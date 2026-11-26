import { expect, test } from "bun:test";
import { RateMeter } from "./RateMeter";

function feed(meter: RateMeter, hertz: number, seconds: number, start = 0): number
{
    let rate = 0;
    for (let index = 0; index < hertz * seconds; index++)
    {
        rate = meter.record(start + index * 1000 / hertz);
    }
    return rate;
}

test.each([50, 100])("reports a steady %d Hz stream", (hertz) =>
{
    expect(feed(new RateMeter(), hertz, 3)).toBe(hertz);
});

test("follows the stream when it slows down", () =>
{
    const meter = new RateMeter();
    feed(meter, 100, 2);
    expect(feed(meter, 50, 2, 2000)).toBe(50);
});

test("drops to one after a long gap", () =>
{
    const meter = new RateMeter();
    feed(meter, 100, 1);
    expect(meter.record(10000)).toBe(1);
});
