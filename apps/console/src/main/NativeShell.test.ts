import { describe, expect, mock, test } from "bun:test";

mock.module("electron", () => ({ app: { name: "HARA" }, Menu: { buildFromTemplate: () => null } }));

const { isBlockedShortcut } = await import("./NativeShell");

function key(value: string, modifiers: Partial<{ control: boolean; meta: boolean; shift: boolean; alt: boolean }> = {})
{
    return { type: "keyDown", key: value, control: false, meta: false, shift: false, alt: false, ...modifiers };
}

describe("isBlockedShortcut", () =>
{
    test("blocks reloads on both platforms", () =>
    {
        expect(isBlockedShortcut(key("r", { meta: true }))).toBe(true);
        expect(isBlockedShortcut(key("R", { meta: true, shift: true }))).toBe(true);
        expect(isBlockedShortcut(key("r", { control: true }))).toBe(true);
        expect(isBlockedShortcut(key("F5"))).toBe(true);
    });

    test("blocks developer tools, zoom, printing and history navigation", () =>
    {
        expect(isBlockedShortcut(key("i", { meta: true, alt: true }))).toBe(true);
        expect(isBlockedShortcut(key("I", { control: true, shift: true }))).toBe(true);
        expect(isBlockedShortcut(key("F12"))).toBe(true);
        expect(isBlockedShortcut(key("=", { meta: true }))).toBe(true);
        expect(isBlockedShortcut(key("p", { control: true }))).toBe(true);
        expect(isBlockedShortcut(key("[", { meta: true }))).toBe(true);
        expect(isBlockedShortcut(key("ArrowLeft", { alt: true }))).toBe(true);
    });

    test("leaves typing, editing and console controls alone", () =>
    {
        expect(isBlockedShortcut(key("r"))).toBe(false);
        expect(isBlockedShortcut(key("c", { meta: true }))).toBe(false);
        expect(isBlockedShortcut(key("v", { control: true }))).toBe(false);
        expect(isBlockedShortcut(key("ArrowLeft"))).toBe(false);
        expect(isBlockedShortcut(key("Enter"))).toBe(false);
        expect(isBlockedShortcut({ ...key("r", { meta: true }), type: "keyUp" })).toBe(false);
    });
});
