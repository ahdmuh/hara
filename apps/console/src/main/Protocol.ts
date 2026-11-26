import { FINGERS, type Finger, type IRawFinger } from "@hara/input";

export const PROTOCOL_VERSION = 1;

const DEVICE_STATES = ["READY", "ESTOP", "FAULT"] as const;
const INTEGER = /^-?\d+$/;

export type DeviceState = typeof DEVICE_STATES[number];
export type Command = "HELLO" | "START" | "STOP";

export type DeviceMessage =
    | { type: "hello"; protocol: number; firmware: string }
    | { type: "data"; timestamp: number; fingers: Record<Finger, IRawFinger> }
    | { type: "status"; timestamp: number; state: DeviceState; code: string | null };

export interface ILimits
{
    positionMinimum: number;
    positionMaximum: number;
    forceMaximum: number;
}

function integers(fields: string[]): number[] | null
{
    return fields.every(field => INTEGER.test(field)) ? fields.map(Number) : null;
}

function parseData(fields: string[]): DeviceMessage | null
{
    const values = fields.length === 1 + FINGERS.length * 2 ? integers(fields) : null;
    if (!values)
    {
        return null;
    }
    const [timestamp = 0, ...readings] = values;
    const fingers = Object.fromEntries(FINGERS.map((finger, index) =>
        [finger, { position: readings[index * 2] ?? 0, force: readings[index * 2 + 1] ?? 0 }]));
    return { type: "data", timestamp, fingers: fingers as Record<Finger, IRawFinger> };
}

function parseStatus(fields: string[]): DeviceMessage | null
{
    const [timestamp, state, code, ...rest] = fields;
    const known = DEVICE_STATES.find(candidate => candidate === state);
    if (!timestamp || !INTEGER.test(timestamp) || !known || rest.length > 0)
    {
        return null;
    }
    return { type: "status", timestamp: Number(timestamp), state: known, code: code || null };
}

function parseHello(fields: string[]): DeviceMessage | null
{
    const [protocol, firmware, ...rest] = fields;
    if (!protocol || !INTEGER.test(protocol) || !firmware || rest.length > 0)
    {
        return null;
    }
    return { type: "hello", protocol: Number(protocol), firmware };
}

export function parseDeviceLine(line: string): DeviceMessage | null
{
    const [type, ...fields] = line.trim().split(",");
    switch (type)
    {
        case "DATA":
            return parseData(fields);
        case "STATUS":
            return parseStatus(fields);
        case "HELLO":
            return parseHello(fields);
        default:
            return null;
    }
}

export function encodeLimits(finger: Finger, limits: ILimits): string
{
    const values = [limits.positionMinimum, limits.positionMaximum, limits.forceMaximum];
    if (!values.every(Number.isInteger) || limits.positionMinimum >= limits.positionMaximum || limits.forceMaximum <= 0)
    {
        throw new RangeError(`Invalid limits for ${finger}: ${values.join(", ")}.`);
    }
    return `LIMITS,${finger.toUpperCase()},${values.join(",")}\n`;
}

export function encodeCommand(command: Command): string
{
    return `${command}\n`;
}
