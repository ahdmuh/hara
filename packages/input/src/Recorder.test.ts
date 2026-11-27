import { describe, expect, test } from "bun:test";
import { FINGERS, type Finger } from "./Hand";
import type { IRawFinger } from "./Normalize";
import { CalibrationRecorder } from "./Recorder";

function hand(position: number, force: number): Record<Finger, IRawFinger>
{
    return Object.fromEntries(FINGERS.map(finger => [finger, { position, force }])) as Record<Finger, IRawFinger>;
}

function recorded(): CalibrationRecorder
{
    const recorder = new CalibrationRecorder();
    [120, 100, 110].forEach(position => recorder.record("open", hand(position, 5)));
    [500, 520, 510].forEach(position => recorder.record("relax", hand(position, 10)));
    [900, 880, 890].forEach(position => recorder.record("fist", hand(position, 20)));
    [600, 760, 700].forEach(force => recorder.record("push", hand(520, force)));
    return recorder;
}

describe("CalibrationRecorder", () =>
{
    test("takes steady positions, the resting force and the strongest push", () =>
    {
        const calibration = recorded().result();
        expect(calibration?.index).toEqual({ open: 110, relaxed: 510, fist: 890, forceZero: 10, forceMaximum: 760 });
    });

    test("measures each finger's tap rate", () =>
    {
        const recorder = recorded();
        [0, 1, 2, 3, 4, 5].forEach(() => recorder.tap("middle"));
        recorder.tapDuration(3);
        expect(recorder.result()?.middle.tapRate).toBe(2);
        expect(recorder.result()?.thumb.tapRate).toBe(0);
    });

    test("refuses a calibration with a skipped step", () =>
    {
        const recorder = new CalibrationRecorder();
        recorder.record("open", hand(100, 0));
        recorder.record("relax", hand(500, 0));
        recorder.record("fist", hand(900, 0));
        expect(recorder.result()).toBeNull();
    });

    test("refuses positions that are not ordered open, relaxed, fist", () =>
    {
        const recorder = new CalibrationRecorder();
        recorder.record("open", hand(500, 0));
        recorder.record("relax", hand(500, 0));
        recorder.record("fist", hand(900, 0));
        recorder.record("push", hand(500, 800));
        expect(recorder.result()).toBeNull();
    });
});
