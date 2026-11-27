import { describe, expect, test } from "bun:test";
import { FINGERS, type Finger, type IHandFrame } from "@hara/input";
import { TapDetector } from "./TapDetector";

function frame(positions: Partial<Record<Finger, number>>): IHandFrame
{
    const fingers = Object.fromEntries(FINGERS.map(finger => [finger, { position: positions[finger] ?? 0, force: 0 }])) as IHandFrame["fingers"];
    return { timestamp: 0, fingers };
}

describe("TapDetector", () =>
{
    test("reports a tap once when a finger crosses the press threshold", () =>
    {
        const detector = new TapDetector();
        expect(detector.update(frame({ middle: 0.6 }))).toEqual(["middle"]);
        expect(detector.update(frame({ middle: 0.9 }))).toEqual([]);
    });

    test("waits for the finger to release before reporting another tap", () =>
    {
        const detector = new TapDetector();
        detector.update(frame({ index: 0.6 }));
        expect(detector.update(frame({ index: 0.4 }))).toEqual([]);
        expect(detector.update(frame({ index: 0.6 }))).toEqual([]);
        detector.update(frame({ index: 0.1 }));
        expect(detector.update(frame({ index: 0.6 }))).toEqual(["index"]);
    });

    test("uses calibrated thresholds when given", () =>
    {
        const detector = new TapDetector({ press: 0.8, release: 0.5 });
        expect(detector.update(frame({ ring: 0.7 }))).toEqual([]);
        expect(detector.update(frame({ ring: 0.85, pinky: 0.9 }))).toEqual(["ring", "pinky"]);
    });
});
