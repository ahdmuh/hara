import { FINGERS, type Finger, type IFingerState, type IHandFrame } from "./Hand";

export type Grip = "close" | "open";

const UNITS_PER_SECOND = 2;

const TARGET_POSITION: Record<Grip | "none", number> = { close: 1, open: -1, none: 0 };

function approach(value: number, target: number, step: number): number
{
    return value < target ? Math.min(target, value + step) : Math.max(target, value - step);
}

export class KeyboardHand
{
    private readonly grips = new Map<Finger, Grip>();
    private readonly fingers = Object.fromEntries(FINGERS.map(finger => [finger, { position: 0, force: 0 }])) as Record<Finger, IFingerState>;

    press(finger: Finger, grip: Grip): void
    {
        this.grips.set(finger, grip);
    }

    release(finger: Finger): void
    {
        this.grips.delete(finger);
    }

    step(timestamp: number, seconds: number): IHandFrame
    {
        const delta = Math.max(0, seconds) * UNITS_PER_SECOND;
        for (const finger of FINGERS)
        {
            const grip = this.grips.get(finger);
            const state = this.fingers[finger];
            const squeezing = grip === "close" && state.position === 1;
            state.position = approach(state.position, TARGET_POSITION[grip ?? "none"], delta);
            state.force = approach(state.force, squeezing ? 1 : 0, delta);
        }
        const fingers = Object.fromEntries(FINGERS.map(finger => [finger, { ...this.fingers[finger] }])) as Record<Finger, IFingerState>;
        return { timestamp, fingers };
    }
}
