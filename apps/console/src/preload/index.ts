import { contextBridge, ipcRenderer } from "electron";
import { BRIDGE_KEY, CHANNELS, type IBridge } from "../shared/IBridge";

const bridge: IBridge = {
    version: () => ipcRenderer.invoke(CHANNELS.version),
};

contextBridge.exposeInMainWorld(BRIDGE_KEY, bridge);
