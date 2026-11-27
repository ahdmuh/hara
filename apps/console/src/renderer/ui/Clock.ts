import { useEffect, useState } from "react";

const TICK_MILLISECONDS = 15000;

export function useNow(): Date
{
    const [now, setNow] = useState(() => new Date());
    useEffect(() =>
    {
        const timer = window.setInterval(() => setNow(new Date()), TICK_MILLISECONDS);
        return () => window.clearInterval(timer);
    }, []);
    return now;
}

export function formatTime(date: Date): string
{
    return date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: false });
}

export function formatDate(date: Date): string
{
    return date.toLocaleDateString("en-CA", { weekday: "short", day: "numeric", month: "short" });
}
