import { describe, expect, test } from "bun:test";
import { KeyboardHand } from "./KeyboardHand";

const FRAME_SECONDS = 0.125;

function holdFor(hand: KeyboardHand, seconds: number)
{
    const frames = Math.max(1, Math.round(seconds / FRAME_SECONDS));
    let frame = hand.step(0, seconds / frames);
    for (let index = 1; index < frames; index++)
    {
        frame = hand.step(0, seconds / frames);
    }
    return frame;
}

describe("KeyboardHand", () =>
{
    test("curls a held finger into a fist before any force builds", () =>
    {
        const hand = new KeyboardHand();
        hand.press("index", "close");

        expect(holdFor(hand, 0.25).fingers.index).toEqual({ position: 0.5, force: 0 });
        expect(holdFor(hand, 0.25).fingers.index).toEqual({ position: 1, force: 0 });
        expect(holdFor(hand, 0.25).fingers.index).toEqual({ position: 1, force: 0.5 });
    });

    test("opens a finger when the open grip is held", () =>
    {
        const hand = new KeyboardHand();
        hand.press("thumb", "open");
        expect(holdFor(hand, 1).fingers.thumb).toEqual({ position: -1, force: 0 });
    });

    test("releases force and returns to relaxed when the key is let go", () =>
    {
        const hand = new KeyboardHand();
        hand.press("ring", "close");
        holdFor(hand, 2);
        hand.release("ring");

        expect(holdFor(hand, 0.25).fingers.ring).toEqual({ position: 0.5, force: 0.5 });
        expect(holdFor(hand, 1).fingers.ring).toEqual({ position: 0, force: 0 });
    });

    test("moves only the fingers being held", () =>
    {
        const hand = new KeyboardHand();
        hand.press("middle", "close");
        const frame = holdFor(hand, 1);
        expect(frame.fingers.middle.position).toBe(1);
        expect(frame.fingers.pinky.position).toBe(0);
    });

    test("never leaves the normalized range on long or backwards steps", () =>
    {
        const hand = new KeyboardHand();
        hand.press("pinky", "close");
        expect(holdFor(hand, 60).fingers.pinky).toEqual({ position: 1, force: 1 });
        expect(holdFor(hand, -5).fingers.pinky).toEqual({ position: 1, force: 1 });
    });
});
