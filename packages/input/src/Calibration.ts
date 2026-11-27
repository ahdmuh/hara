import type { Finger } from "./Hand";

export interface IFingerCalibration
{
    open: number;
    relaxed: number;
    fist: number;
    forceZero: number;
    forceMaximum: number;
    tapRate?: number;
}

export const PROVISIONAL_CALIBRATION: IFingerCalibration = { open: 0, relaxed: 512, fist: 1023, forceZero: 0, forceMaximum: 1023 };

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
