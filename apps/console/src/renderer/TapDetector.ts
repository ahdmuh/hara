import { FINGERS, type Finger, type IHandFrame } from "@hara/input";

export interface ITapThresholds
{
    press: number;
    release: number;
}

export const GENEROUS_THRESHOLDS: ITapThresholds = { press: 0.25, release: 0.1 };

export const CALIBRATED_THRESHOLDS: ITapThresholds = { press: 0.5, release: 0.25 };

export class TapDetector
{
    private readonly held = new Set<Finger>();

    constructor(private readonly thresholds: ITapThresholds = GENEROUS_THRESHOLDS)
    {
    }

    update(frame: IHandFrame): Finger[]
    {
        const taps: Finger[] = [];
        for (const finger of FINGERS)
        {
            const position = frame.fingers[finger].position;
            if (!this.held.has(finger) && position >= this.thresholds.press)
            {
                this.held.add(finger);
                taps.push(finger);
            }
            else if (this.held.has(finger) && position <= this.thresholds.release)
            {
                this.held.delete(finger);
            }
        }
        return taps;
    }
}
