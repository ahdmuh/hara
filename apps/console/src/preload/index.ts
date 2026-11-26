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
};

contextBridge.exposeInMainWorld(BRIDGE_KEY, bridge);
