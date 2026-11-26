import { expect, test } from "bun:test";
import { LineBuffer } from "./LineBuffer";

test("joins lines split across chunks", () =>
{
    const buffer = new LineBuffer();
    expect(buffer.push("DATA,1,2")).toEqual([]);
    expect(buffer.push(",3\r\nSTATUS,4,RE")).toEqual(["DATA,1,2,3"]);
    expect(buffer.push("ADY\n")).toEqual(["STATUS,4,READY"]);
});

test("returns every complete line in one chunk", () =>
{
    expect(new LineBuffer().push("HELLO,1,0.1.0\n\nSTATUS,4,READY\n")).toEqual(["HELLO,1,0.1.0", "STATUS,4,READY"]);
});

test("drops runaway input with no line ending and recovers", () =>
{
    const buffer = new LineBuffer();
    buffer.push("x".repeat(300));
    expect(buffer.push("\nSTATUS,4,READY\n")).toEqual(["STATUS,4,READY"]);
});
