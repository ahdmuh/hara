import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { BRIDGE_KEY, CHANNELS, type IBridge } from "../shared/IBridge";

function subscribe<TPayload>(channel: string, listener: (payload: TPayload) => void): () => void
{
    const handler = (_: IpcRendererEvent, payload: TPayload) => listener(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
}

const bridge: IBridge = {
    version: () => ipcRenderer.invoke(CHANNELS.version),
    deviceStatus: () => ipcRenderer.invoke(CHANNELS.deviceStatus),
    onDeviceStatus: listener => subscribe(CHANNELS.deviceStatus, listener),
    onDeviceMessage: listener => subscribe(CHANNELS.deviceMessage, listener),
    saveCalibration: (owner, fingers) => ipcRenderer.invoke(CHANNELS.saveCalibration, owner, fingers),
    latestCalibration: owner => ipcRenderer.invoke(CHANNELS.latestCalibration, owner),
    unsynced: owner => ipcRenderer.invoke(CHANNELS.unsynced, owner),
    markSynced: (table, ids) => ipcRenderer.invoke(CHANNELS.markSynced, table, ids),
};

contextBridge.exposeInMainWorld(BRIDGE_KEY, bridge);
