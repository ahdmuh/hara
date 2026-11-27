import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import type { Finger, IInputSource } from "@hara/input";
import { sounds, type Sound } from "./Sounds";
import { TapDetector, type ITapThresholds } from "./TapDetector";

export type Intent = "previous" | "next" | "up" | "down" | "select" | "back";

type IntentListener = (intent: Intent) => boolean;

const KEY_INTENTS: Record<string, Intent> = {
    ArrowLeft: "previous",
    ArrowRight: "next",
    ArrowUp: "up",
    ArrowDown: "down",
    Enter: "select",
    NumpadEnter: "select",
    Space: "select",
    Escape: "back",
    Backspace: "back",
};

const TYPING_KEYS = new Set(["ArrowLeft", "ArrowRight", "Space", "Backspace"]);

export const FINGER_INTENTS: Record<Finger, Intent> = {
    thumb: "back",
    index: "previous",
    middle: "select",
    ring: "next",
    pinky: "down",
};

export type InputMode = "keyboard" | "hand";

const listeners: IntentListener[] = [];
const modeListeners = new Set<() => void>();
let mode: InputMode = "keyboard";

function setMode(next: InputMode): void
{
    if (mode !== next)
    {
        mode = next;
        modeListeners.forEach(listener => listener());
    }
}

export function useInputMode(): InputMode
{
    return useSyncExternalStore((listener) =>
    {
        modeListeners.add(listener);
        return () => modeListeners.delete(listener);
    }, () => mode);
}

const INTENT_SOUNDS: Record<Intent, Sound> = {
    previous: "move",
    next: "move",
    up: "move",
    down: "move",
    select: "select",
    back: "back",
};

export function emitIntent(intent: Intent): void
{
    const handled = listeners.at(-1)?.(intent) ?? false;
    if (handled && !sounds.playedRecently("error"))
    {
        sounds.play(INTENT_SOUNDS[intent]);
    }
}

export function useIntent(listener: IntentListener): void
{
    const onIntent = useEffectEvent(listener);
    useEffect(() =>
    {
        const entry: IntentListener = intent => onIntent(intent);
        listeners.push(entry);
        return () =>
        {
            listeners.splice(listeners.indexOf(entry), 1);
        };
    }, []);
}

function isTyping(target: EventTarget | null): target is HTMLInputElement
{
    return target instanceof HTMLInputElement;
}

function canErase(input: HTMLInputElement): boolean
{
    if (input.dataset.capture !== undefined)
    {
        return false;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    return input.value.length > 0 && (start > 0 || end > start);
}

export function startIntents(target: Window, source: IInputSource, thresholds: ITapThresholds): () => void
{
    const onKeyDown = (event: KeyboardEvent) =>
    {
        if (isTyping(event.target) && !event.ctrlKey && !event.metaKey && (event.key.length === 1 || (event.key === "Backspace" && canErase(event.target))))
        {
            sounds.play("type");
        }
        const intent = KEY_INTENTS[event.code];
        if (!intent || event.ctrlKey || event.metaKey || event.altKey)
        {
            return;
        }
        if (isTyping(event.target) && TYPING_KEYS.has(event.code))
        {
            return;
        }
        if (event.repeat && (intent === "select" || intent === "back"))
        {
            return;
        }
        event.preventDefault();
        setMode("keyboard");
        emitIntent(intent);
    };
    const detector = new TapDetector(thresholds);
    const unsubscribe = source.subscribe((frame) =>
    {
        const taps = detector.update(frame);
        if (!isTyping(target.document.activeElement))
        {
            taps.forEach((finger) =>
            {
                setMode("hand");
                emitIntent(FINGER_INTENTS[finger]);
            });
        }
    });
    const onClick = (event: MouseEvent) =>
    {
        if (event.target instanceof Element && event.target.closest("button") && !sounds.playedRecently("error"))
        {
            sounds.play("select");
        }
    };
    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("click", onClick);
    return () =>
    {
        unsubscribe();
        target.removeEventListener("keydown", onKeyDown);
        target.removeEventListener("click", onClick);
    };
}
