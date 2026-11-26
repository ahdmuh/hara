import { FINGERS, KeyboardHand, type Finger, type FrameListener, type IInputSource } from "@hara/input";

const KEY_FINGERS: Record<string, Finger> = {
    Digit1: "thumb",
    Digit2: "index",
    Digit3: "middle",
    Digit4: "ring",
    Digit5: "pinky",
};

export function createKeyboardSource(target: Window): IInputSource
{
    return {
        subscribe(listener: FrameListener)
        {
            const hand = new KeyboardHand();

            const onKeyDown = (event: KeyboardEvent) =>
            {
                const finger = KEY_FINGERS[event.code];
                if (finger)
                {
                    hand.press(finger, event.shiftKey ? "open" : "close");
                }
            };
            const onKeyUp = (event: KeyboardEvent) =>
            {
                const finger = KEY_FINGERS[event.code];
                if (finger)
                {
                    hand.release(finger);
                }
            };
            const onBlur = () => FINGERS.forEach(finger => hand.release(finger));

            let previous = target.performance.now();
            const tick = (now: number) =>
            {
                listener(hand.step(now, (now - previous) / 1000));
                previous = now;
                frameID = target.requestAnimationFrame(tick);
            };
            let frameID = target.requestAnimationFrame(tick);

            target.addEventListener("keydown", onKeyDown);
            target.addEventListener("keyup", onKeyUp);
            target.addEventListener("blur", onBlur);
            return () =>
            {
                target.cancelAnimationFrame(frameID);
                target.removeEventListener("keydown", onKeyDown);
                target.removeEventListener("keyup", onKeyUp);
                target.removeEventListener("blur", onBlur);
            };
        },
    };
}
