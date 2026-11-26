export const BRIDGE_KEY = "hara";

export const CHANNELS = {
    version: "app:version",
} as const;

export interface IBridge
{
    version(): Promise<string>;
}
