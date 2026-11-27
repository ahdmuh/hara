import type { DateColumn, ISimpleDate } from "./ui/DateWheel";

export interface IDateEntry
{
    digits: string;
    date: ISimpleDate;
}

export interface IEntryResult
{
    entry: IDateEntry;
    rejected: boolean;
    reason?: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const FIRST_YEAR = 1900;

const SEGMENTS: { column: DateColumn; start: number; length: number }[] = [
    { column: "year", start: 0, length: 4 },
    { column: "month", start: 4, length: 2 },
    { column: "day", start: 6, length: 2 },
];

const FULL_LENGTH = 8;

export function daysIn(year: number, month: number): number
{
    return new Date(year, month, 0).getDate();
}

function isAfter(date: ISimpleDate, today: ISimpleDate): boolean
{
    return date.year * 10000 + date.month * 100 + date.day > today.year * 10000 + today.month * 100 + today.day;
}

function segmentAt(position: number)
{
    return SEGMENTS.find(segment => position >= segment.start && position < segment.start + segment.length) ?? SEGMENTS[2];
}

export function entryColumn(entry: IDateEntry): DateColumn
{
    return segmentAt(Math.min(entry.digits.length, FULL_LENGTH - 1))?.column ?? "day";
}

export function partialLabel(entry: IDateEntry, column: DateColumn): string | null
{
    const segment = SEGMENTS.find(item => item.column === column);
    if (!segment)
    {
        return null;
    }
    const typed = entry.digits.slice(segment.start, segment.start + segment.length);
    if (typed.length === 0 || typed.length === segment.length)
    {
        return null;
    }
    return typed.padEnd(segment.length, "–");
}

function commit(entry: IDateEntry, digits: string, today: ISimpleDate): IEntryResult
{
    const segment = segmentAt(digits.length - 1);
    if (!segment || digits.length < segment.start + segment.length)
    {
        return { entry: { ...entry, digits }, rejected: false };
    }
    const value = Number(digits.slice(segment.start, segment.start + segment.length));
    const date = { ...entry.date };
    if (segment.column === "year")
    {
        date.year = value;
    }
    else if (segment.column === "month")
    {
        date.month = value;
    }
    else
    {
        date.day = value;
    }
    const cleared = { ...entry, digits: digits.slice(0, segment.start) };
    if (segment.column === "year" && (value < FIRST_YEAR || value > today.year))
    {
        return { entry: cleared, rejected: true, reason: `Enter a Year From ${FIRST_YEAR} to ${today.year}` };
    }
    if (segment.column === "month" && (value < 1 || value > 12))
    {
        return { entry: cleared, rejected: true, reason: value === 0 ? "Months Start at 01" : `There Is No Month ${value}` };
    }
    if (segment.column === "day" && (value < 1 || value > daysIn(date.year, date.month)))
    {
        const reason = value === 0
            ? "Days Start at 01"
            : `${MONTH_NAMES[date.month - 1] ?? ""} ${date.year} Has ${daysIn(date.year, date.month)} Days`;
        return { entry: cleared, rejected: true, reason };
    }
    if (segment.column !== "day")
    {
        date.day = Math.min(date.day, daysIn(date.year, date.month));
    }
    if (isAfter(date, today))
    {
        return { entry: cleared, rejected: true, reason: "Your Birthday Can't Be in the Future" };
    }
    return { entry: { digits, date }, rejected: false };
}

export function typeDigit(entry: IDateEntry, digit: string, today: ISimpleDate): IEntryResult
{
    const base = entry.digits.length >= FULL_LENGTH ? "" : entry.digits;
    const segment = segmentAt(base.length);
    const leading = base.length === segment?.start;
    const padded = leading && ((segment?.column === "month" && digit > "1") || (segment?.column === "day" && digit > "3"));
    return commit(entry, base + (padded ? `0${digit}` : digit), today);
}

export function typeSeparator(entry: IDateEntry, today: ISimpleDate): IEntryResult
{
    const segment = segmentAt(entry.digits.length);
    const typed = segment ? entry.digits.length - segment.start : 0;
    if (!segment || segment.column === "year" || typed !== 1)
    {
        return { entry, rejected: false };
    }
    const digits = entry.digits.slice(0, -1) + "0" + entry.digits.slice(-1);
    return commit(entry, digits, today);
}

export function eraseDigit(entry: IDateEntry): IDateEntry
{
    return { ...entry, digits: entry.digits.slice(0, -1) };
}

export function typeText(entry: IDateEntry, text: string, today: ISimpleDate): IEntryResult
{
    let result: IEntryResult = { entry, rejected: false };
    for (const character of text)
    {
        if (/\d/.test(character))
        {
            result = typeDigit(result.entry, character, today);
        }
        else if (/[-/. ]/.test(character))
        {
            result = typeSeparator(result.entry, today);
        }
        if (result.rejected)
        {
            break;
        }
    }
    return result;
}

export function finishEntry(entry: IDateEntry, today: ISimpleDate): IEntryResult
{
    const length = entry.digits.length;
    if (length > 0 && length < 4)
    {
        return { entry, rejected: true, reason: "Finish Typing the Year" };
    }
    const segment = segmentAt(length);
    const typed = segment ? length - segment.start : 0;
    const finished = typed === 1 ? typeSeparator(entry, today) : { entry, rejected: false };
    if (finished.rejected)
    {
        return finished;
    }
    return { entry: { ...finished.entry, digits: "" }, rejected: false };
}
