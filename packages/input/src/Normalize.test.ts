import { describe, expect, test } from "bun:test";
import { validateCalibration, type HandCalibration, type IFingerCalibration } from "./Calibration";
import { FINGERS } from "./Hand";
import { normalizeForce, normalizeHand, normalizePosition } from "./Normalize";

const CALIBRATION: IFingerCalibration = { open: 100, relaxed: 400, fist: 500, forceZero: 20, forceMaximum: 220 };
const INVERTED: IFingerCalibration = { ...CALIBRATION, open: 500, relaxed: 200, fist: 100 };

describe("normalizePosition", () =>
{
    test.each([
        ["open", 100, -1],
        ["halfway to open", 250, -0.5],
        ["relaxed", 400, 0],
        ["halfway to a fist", 450, 0.5],
        ["fist", 500, 1],
        ["past open", 0, -1],
        ["past a fist", 900, 1],
    ])("maps %s to %d using each side's own range", (_, raw, expected) =>
    {
        expect(normalizePosition(raw, CALIBRATION)).toBeCloseTo(expected);
    });

    test.each([
        [500, -1],
        [200, 0],
        [150, 0.5],
        [100, 1],
    ])("handles sensors that read lower as the finger closes: %d is %d", (raw, expected) =>
    {
        expect(normalizePosition(raw, INVERTED)).toBeCloseTo(expected);
    });
});

describe("normalizeForce", () =>
{
    test.each([
        [20, 0],
        [120, 0.5],
        [220, 1],
        [0, 0],
        [400, 1],
    ])("maps %d to %d of the calibrated maximum", (raw, expected) =>
    {
        expect(normalizeForce(raw, CALIBRATION)).toBeCloseTo(expected);
    });
});

describe("normalizeHand", () =>
{
    test("uses each finger's own calibration and keeps the timestamp", () =>
    {
        const calibration = Object.fromEntries(FINGERS.map(finger => [finger, CALIBRATION])) as HandCalibration;
        calibration.thumb = INVERTED;
        const raw = Object.fromEntries(FINGERS.map(finger => [finger, { position: 500, force: 120 }])) as Parameters<typeof normalizeHand>[1];

        const frame = normalizeHand(1234, raw, calibration);

        expect(frame.timestamp).toBe(1234);
        expect(frame.fingers.thumb.position).toBeCloseTo(-1);
        expect(frame.fingers.pinky).toEqual({ position: 1, force: 0.5 });
    });
});

describe("validateCalibration", () =>
{
    test.each([CALIBRATION, INVERTED])("accepts a sensor in either direction", (calibration) =>
    {
        expect(() => validateCalibration(calibration)).not.toThrow();
    });

    test.each([
        ["relaxed outside the range", { ...CALIBRATION, relaxed: 600 }],
        ["relaxed equal to open", { ...CALIBRATION, relaxed: 100 }],
        ["no force range", { ...CALIBRATION, forceMaximum: 20 }],
    ])("rejects %s", (_, calibration) =>
    {
        expect(() => validateCalibration(calibration)).toThrow(RangeError);
    });
});
