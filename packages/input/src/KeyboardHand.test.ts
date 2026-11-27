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
