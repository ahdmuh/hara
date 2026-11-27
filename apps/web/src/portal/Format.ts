import { now } from "./MockData";

const DAY = 86_400_000;
const RELATIVE = new Intl.RelativeTimeFormat("en-CA", { numeric: "auto" });
const DATE = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });
const SHORT = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" });

export function relative(date: number | undefined): string
{
    if (date === undefined)
    {
        return "Never";
    }
    const days = Math.round((date - now()) / DAY);
    if (days === 0)
    {
        return "Today";
    }
    if (Math.abs(days) < 7)
    {
        const text = RELATIVE.format(days, "day");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    return SHORT.format(date);
}

export function fullDate(date: number): string
{
    return DATE.format(date);
}

export function daysSince(date: number | undefined): number
{
    return date === undefined ? Infinity : Math.floor((now() - date) / DAY);
}

export function initials(name: string): string
{
    return name.split(" ").map(part => part[0]).join("").slice(0, 2);
}
