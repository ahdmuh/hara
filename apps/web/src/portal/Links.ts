import { useSyncExternalStore } from "react";
import { now } from "./MockData";

export type LinkStatus = "pending" | "used" | "revoked";

export interface ILinkPin
{
    code: string;
    label: string;
    createdAt: number;
    expiresAt: number;
    status: LinkStatus;
}

export const VALID_DAYS = 30;

const DAY = 86_400_000;
const CHANGE_EVENT = "hara:links";

let pins: ILinkPin[] = [
    { code: "482913", label: "Jordan Lee", createdAt: now() - 2 * DAY, expiresAt: now() + 28 * DAY, status: "pending" },
    { code: "305177", label: "", createdAt: now() - 6 * DAY, expiresAt: now() + 24 * DAY, status: "pending" },
];

function emit(): void
{
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(listener: () => void): () => void
{
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function snapshot(): ILinkPin[]
{
    return pins;
}

function isOpen(pin: ILinkPin): boolean
{
    return pin.status === "pending" && pin.expiresAt > Date.now();
}

export function usePendingPins(): ILinkPin[]
{
    return useSyncExternalStore(subscribe, snapshot).filter(isOpen);
}

function randomCode(): string
{
    const values = crypto.getRandomValues(new Uint32Array(1));
    return ((values[0] ?? 0) % 1_000_000).toString().padStart(6, "0");
}

export function createPin(label: string): ILinkPin
{
    const active = new Set(pins.filter(pin => pin.status === "pending").map(pin => pin.code));
    let code = randomCode();
    while (active.has(code) || /^(\d)\1{5}$/.test(code))
    {
        code = randomCode();
    }
    const created = Date.now();
    const pin: ILinkPin = { code, label: label.trim(), createdAt: created, expiresAt: created + VALID_DAYS * DAY, status: "pending" };
    pins = [pin, ...pins];
    emit();
    return pin;
}

export function revokePin(code: string): void
{
    pins = pins.map(pin => (pin.code === code && pin.status === "pending" ? { ...pin, status: "revoked" } : pin));
    emit();
}

export function formatPin(code: string): string
{
    return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export function inviteMessage(pin: ILinkPin, clinician: string, expires: string): string
{
    const greeting = pin.label ? `Hi ${pin.label},` : "Hi,";
    return [
        greeting,
        "",
        `To connect your HARA app to ${clinician}, open the app, choose Sign Up, and enter this PIN when asked:`,
        "",
        formatPin(pin.code),
        "",
        `The PIN works once and is valid until ${expires}.`,
    ].join("\n");
}
