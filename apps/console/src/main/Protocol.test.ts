import { describe, expect, test } from "bun:test";
import { encodeCommand, encodeLimits, parseDeviceLine } from "./Protocol";

describe("parseDeviceLine", () =>
{
    test("reads a data line into raw readings per finger", () =>
    {
        const message = parseDeviceLine("DATA,120450,512,30,600,0,488,12,470,5,455,-2\r");
        expect(message).toEqual({
            type: "data",
            timestamp: 120450,
            fingers: {
                thumb: { position: 512, force: 30 },
                index: { position: 600, force: 0 },
                middle: { position: 488, force: 12 },
                ring: { position: 470, force: 5 },
                pinky: { position: 455, force: -2 },
            },
        });
    });

    test.each([
        ["STATUS,9000,READY", { type: "status", timestamp: 9000, state: "READY", code: null }],
        ["STATUS,9010,FAULT,LOAD_CELL", { type: "status", timestamp: 9010, state: "FAULT", code: "LOAD_CELL" }],
        ["HELLO,1,0.3.2", { type: "hello", protocol: 1, firmware: "0.3.2" }],
    ])("reads %s", (line, expected) =>
    {
        expect(parseDeviceLine(line)).toEqual(expected as ReturnType<typeof parseDeviceLine>);
    });

    test.each([
        ["", "an empty line"],
        ["DATA,1,2,3", "a data line missing fingers"],
        ["DATA,1,2,3,4,5,6,7,8,9,10,11,12", "a data line with an extra value"],
        ["DATA,1,2,3,4,5,6,7,8,9,10,1.5", "a fractional reading"],
        ["DATA,1,2,3,4,5,6,7,8,9,10,", "a truncated line"],
        ["STATUS,9000,SLEEPING", "an unknown device state"],
        ["STATUS,later,READY", "a status without a timestamp"],
        ["HELLO,one,0.3.2", "a hello without a protocol number"],
        ["PING,1", "an unknown message"],
    ])("ignores %s (%s)", (line) =>
    {
        expect(parseDeviceLine(line)).toBeNull();
    });
});

describe("encoding", () =>
{
    test("writes limits for one finger", () =>
    {
        expect(encodeLimits("ring", { positionMinimum: 120, positionMaximum: 880, forceMaximum: 400 })).toBe("LIMITS,RING,120,880,400\n");
    });

    test.each([
        { positionMinimum: 880, positionMaximum: 120, forceMaximum: 400 },
        { positionMinimum: 120, positionMaximum: 880, forceMaximum: 0 },
        { positionMinimum: 120.5, positionMaximum: 880, forceMaximum: 400 },
    ])("refuses limits the device could not enforce safely: %o", (limits) =>
    {
        expect(() => encodeLimits("thumb", limits)).toThrow(RangeError);
    });

    test("writes commands", () =>
    {
        expect(encodeCommand("STOP")).toBe("STOP\n");
    });
});
