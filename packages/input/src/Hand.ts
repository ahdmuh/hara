export const FINGERS = ["thumb", "index", "middle", "ring", "pinky"] as const;

export type Finger = typeof FINGERS[number];

export interface IFingerState
{
    position: number;
    force: number;
}

export interface IHandFrame
{
    timestamp: number;
    fingers: Record<Finger, IFingerState>;
}
