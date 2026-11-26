import type { Finger } from "./Hand";

export interface IFingerCalibration
{
    open: number;
    relaxed: number;
    fist: number;
    forceZero: number;
    forceMaximum: number;
}

export type HandCalibration = Record<Finger, IFingerCalibration>;

export function validateCalibration(calibration: IFingerCalibration): void
{
    const { open, relaxed, fist, forceZero, forceMaximum } = calibration;
    const ordered = (open < relaxed && relaxed < fist) || (open > relaxed && relaxed > fist);
    if (!ordered)
    {
        throw new RangeError(`Relaxed position ${relaxed} must sit strictly between open ${open} and fist ${fist}.`);
    }
    if (!(forceMaximum > forceZero))
    {
        throw new RangeError(`Force maximum ${forceMaximum} must be greater than force zero ${forceZero}.`);
    }
}
