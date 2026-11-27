import type { IFingerCalibration, HandCalibration } from "./Calibration";
import { FINGERS, type Finger, type IFingerState, type IHandFrame } from "./Hand";

export interface IRawFinger
{
    position: number;
    force: number;
}

function clamp(value: number, minimum: number, maximum: number): number
{
    return Math.min(maximum, Math.max(minimum, value));
}

export function normalizePosition(raw: number, calibration: IFingerCalibration): number
{
    const { open, relaxed, fist } = calibration;
    const towardsFist = (raw - relaxed) / (fist - relaxed);
    const towardsOpen = (raw - relaxed) / (open - relaxed);
    return towardsFist >= 0 ? clamp(towardsFist, 0, 1) : -clamp(towardsOpen, 0, 1);
}

export function normalizeForce(raw: number, calibration: IFingerCalibration): number
{
    return clamp((raw - calibration.forceZero) / (calibration.forceMaximum - calibration.forceZero), 0, 1);
}

export function normalizeFinger(raw: IRawFinger, calibration: IFingerCalibration): IFingerState
{
    return { position: normalizePosition(raw.position, calibration), force: normalizeForce(raw.force, calibration) };
}

export function normalizeHand(timestamp: number, raw: Record<Finger, IRawFinger>, calibration: HandCalibration): IHandFrame
{
    const fingers = Object.fromEntries(FINGERS.map(finger => [finger, normalizeFinger(raw[finger], calibration[finger])]));
    return { timestamp, fingers: fingers as Record<Finger, IFingerState> };
}

export function denormalizeFinger(state: IFingerState, calibration: IFingerCalibration): IRawFinger
{
    const { open, relaxed, fist, forceZero, forceMaximum } = calibration;
    const position = state.position >= 0 ? relaxed + state.position * (fist - relaxed) : relaxed + -state.position * (open - relaxed);
    return { position, force: forceZero + state.force * (forceMaximum - forceZero) };
}
