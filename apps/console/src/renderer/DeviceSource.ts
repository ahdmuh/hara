import { FINGERS, normalizeHand, type HandCalibration, type IInputSource } from "@hara/input";
import type { IBridge } from "../shared/IBridge";

const PROVISIONAL_CALIBRATION = Object.fromEntries(FINGERS.map(finger =>
    [finger, { open: 0, relaxed: 512, fist: 1023, forceZero: 0, forceMaximum: 1023 }])) as HandCalibration;

export function createDeviceSource(bridge: IBridge, calibration = PROVISIONAL_CALIBRATION): IInputSource
{
    return {
        subscribe(listener)
        {
            return bridge.onDeviceMessage((message) =>
            {
                if (message.type === "data")
                {
                    listener(normalizeHand(message.timestamp, message.fingers, calibration));
                }
            });
        },
    };
}
