import { describe, expect, test } from "bun:test";
import { eraseDigit, finishEntry, partialLabel, typeText, type IDateEntry } from "./DateEntry";

const TODAY = { year: 2026, month: 11, day: 27 };
const START: IDateEntry = { digits: "", date: { year: 1960, month: 1, day: 1 } };

function type(text: string, entry = START)
{
    return typeText(entry, text, TODAY);
}

describe("DateEntry", () =>
{
    test("reads a full date typed in one stroke", () =>
    {
        const result = type("20020910");
        expect(result.rejected).toBe(false);
        expect(result.entry.date).toEqual({ year: 2002, month: 9, day: 10 });
        expect(finishEntry(result.entry, TODAY).rejected).toBe(false);
    });

    test("accepts separators and single-digit months and days", () =>
    {
        expect(type("2002-9-10").entry.date).toEqual({ year: 2002, month: 9, day: 10 });
        expect(type("2002/09/7").entry.date).toEqual({ year: 2002, month: 9, day: 7 });
        expect(type("1985-3-").entry.date).toEqual({ year: 1985, month: 3, day: 1 });
    });

    test("pads a month above 1 and a day above 3 straight away", () =>
    {
        expect(type("20025").entry.digits).toBe("200205");
        expect(type("2002054").entry.digits).toBe("20020504");
    });

    test("rejects an out-of-range part and clears only that part", () =>
    {
        const month = type("200213");
        expect(month.rejected).toBe(true);
        expect(month.entry.digits).toBe("2002");
        expect(month.reason).toBe("There Is No Month 13");
        const day = type("20010229");
        expect(day.rejected).toBe(true);
        expect(day.entry.digits).toBe("200102");
        expect(day.reason).toBe("February 2001 Has 28 Days");
        expect(type("1899").rejected).toBe(true);
    });

    test("accepts a leap day and rejects dates in the future", () =>
    {
        expect(type("20000229").entry.date).toEqual({ year: 2000, month: 2, day: 29 });
        expect(type("20261128").reason).toBe("Your Birthday Can't Be in the Future");
        expect(type("2027").rejected).toBe(true);
    });

    test("shows partial parts with placeholders and erases digits", () =>
    {
        const partial = type("20");
        expect(partialLabel(partial.entry, "year")).toBe("20––");
        expect(finishEntry(partial.entry, TODAY).reason).toBe("Finish Typing the Year");
        expect(eraseDigit(partial.entry).digits).toBe("2");
    });

    test("finishes a single-digit day or month on enter", () =>
    {
        expect(finishEntry(type("2002041").entry, TODAY).entry.date).toEqual({ year: 2002, month: 4, day: 1 });
        expect(finishEntry(type("20021").entry, TODAY).entry.date).toEqual({ year: 2002, month: 1, day: 1 });
        expect(finishEntry(type("200204").entry, TODAY).rejected).toBe(false);
    });

    test("starts over when typing after a complete date", () =>
    {
        const first = type("20020910");
        expect(type("1", first.entry).entry.digits).toBe("1");
    });
});
