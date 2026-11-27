import type { IDeviceStatus } from "../main/DeviceConnection";
import type { HandCalibration } from "@hara/input";
import type { DeviceMessage } from "../main/Protocol";
import type { ICalibrationRecord, IUnsynced } from "../main/SessionStore";

export const BRIDGE_KEY = "hara";

export const CHANNELS = {
    version: "app:version",
    deviceStatus: "device:status",
    deviceMessage: "device:message",
    saveCalibration: "store:saveCalibration",
    latestCalibration: "store:latestCalibration",
    unsynced: "store:unsynced",
    markSynced: "store:markSynced",
} as const;

export type SyncTable = "sessions" | "calibrations" | "milestones";

export interface IBridge
{
    version(): Promise<string>;
    deviceStatus(): Promise<IDeviceStatus>;
    onDeviceStatus(listener: (status: IDeviceStatus) => void): () => void;
    onDeviceMessage(listener: (message: DeviceMessage) => void): () => void;
    saveCalibration(owner: string, fingers: HandCalibration): Promise<string>;
    latestCalibration(owner: string): Promise<ICalibrationRecord | null>;
    unsynced(owner: string): Promise<IUnsynced>;
    markSynced(table: SyncTable, ids: string[]): Promise<void>;
}
