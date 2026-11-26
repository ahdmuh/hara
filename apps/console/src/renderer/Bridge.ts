import { BRIDGE_KEY, type IBridge } from "../shared/IBridge";

export const bridge = (window as unknown as Record<typeof BRIDGE_KEY, IBridge>)[BRIDGE_KEY];
