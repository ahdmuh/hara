import { validateCalibration, type HandCalibration, type IFingerCalibration } from "./Calibration";
import { FINGERS, type Finger } from "./Hand";
import type { IRawFinger } from "./Normalize";

export type CalibrationPose = "open" | "relax" | "fist" | "push";

interface ISamples
{
    positions: number[];
    forces: number[];
}

function average(values: number[]): number
{
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number
{
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] ?? 0 : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export class CalibrationRecorder
{
    private readonly samples = new Map<string, ISamples>();
    private readonly taps = new Map<Finger, number>();
    private tapSeconds = 0;

    record(pose: CalibrationPose, hand: Record<Finger, IRawFinger>): void
    {
        for (const finger of FINGERS)
        {
            const key = `${pose}:${finger}`;
            const entry = this.samples.get(key) ?? { positions: [], forces: [] };
            entry.positions.push(hand[finger].position);
            entry.forces.push(hand[finger].force);
            this.samples.set(key, entry);
        }
    }

    tap(finger: Finger): void
    {
        this.taps.set(finger, (this.taps.get(finger) ?? 0) + 1);
    }

    tapDuration(seconds: number): void
    {
        this.tapSeconds = seconds;
    }

    finger(finger: Finger): IFingerCalibration | null
    {
        const open = this.samples.get(`open:${finger}`);
        const relax = this.samples.get(`relax:${finger}`);
        const fist = this.samples.get(`fist:${finger}`);
        const push = this.samples.get(`push:${finger}`);
        if (!open || !relax || !fist || !push)
        {
            return null;
        }
        const calibration: IFingerCalibration = {
            open: median(open.positions),
            relaxed: median(relax.positions),
            fist: median(fist.positions),
            forceZero: average(relax.forces),
            forceMaximum: Math.max(...push.forces),
        };
        if (this.tapSeconds > 0)
        {
            calibration.tapRate = Math.round(((this.taps.get(finger) ?? 0) / this.tapSeconds) * 100) / 100;
        }
        try
        {
            validateCalibration(calibration);
            return calibration;
        }
        catch
        {
            return null;
        }
    }

    result(): HandCalibration | null
    {
        const fingers = FINGERS.map(finger => [finger, this.finger(finger)] as const);
        if (fingers.some(([, calibration]) => !calibration))
        {
            return null;
        }
        return Object.fromEntries(fingers) as HandCalibration;
    }
}
