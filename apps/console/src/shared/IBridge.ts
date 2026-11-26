import type { IDeviceStatus } from "../main/DeviceConnection";
import type { DeviceMessage } from "../main/Protocol";

export const BRIDGE_KEY = "hara";

export const CHANNELS = {
    version: "app:version",
    deviceStatus: "device:status",
    deviceMessage: "device:message",
} as const;

export interface IBridge
{
    version(): Promise<string>;
    deviceStatus(): Promise<IDeviceStatus>;
    onDeviceStatus(listener: (status: IDeviceStatus) => void): () => void;
    onDeviceMessage(listener: (message: DeviceMessage) => void): () => void;
}
