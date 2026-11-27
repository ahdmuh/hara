import { denormalizeFinger, FINGERS, normalizeHand, PROVISIONAL_CALIBRATION, type Finger, type HandCalibration, type IInputSource, type IRawFinger } from "@hara/input";
import type { IBridge } from "../shared/IBridge";

export type RawListener = (raw: Record<Finger, IRawFinger>) => void;

export interface IRawSource
{
    subscribe(listener: RawListener): () => void;
}

export const PROVISIONAL = Object.fromEntries(FINGERS.map(finger => [finger, PROVISIONAL_CALIBRATION])) as HandCalibration;

export function createDeviceSource(bridge: IBridge, calibration: HandCalibration = PROVISIONAL): IInputSource
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

export function createDeviceRawSource(bridge: IBridge): IRawSource
{
    return {
        subscribe(listener)
        {
            return bridge.onDeviceMessage((message) =>
            {
                if (message.type === "data")
                {
                    listener(message.fingers);
                }
            });
        },
    };
}

export function createProvisionalRawSource(source: IInputSource): IRawSource
{
    return {
        subscribe(listener)
        {
            return source.subscribe(frame => listener(Object.fromEntries(FINGERS.map(finger =>
                [finger, denormalizeFinger(frame.fingers[finger], PROVISIONAL_CALIBRATION)])) as Record<Finger, IRawFinger>));
        },
    };
}
