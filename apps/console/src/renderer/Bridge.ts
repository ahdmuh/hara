import { BRIDGE_KEY, type IBridge } from "../shared/IBridge";

const OFFLINE: IBridge = {
    version: async () => "",
    deviceStatus: async () => ({ connected: false, firmware: null }),
    onDeviceStatus: () => () => undefined,
    onDeviceMessage: () => () => undefined,
};

export const bridge = (window as unknown as Partial<Record<typeof BRIDGE_KEY, IBridge>>)[BRIDGE_KEY] ?? OFFLINE;
