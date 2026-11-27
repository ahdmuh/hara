import { app, Menu, type BrowserWindow, type MenuItemConstructorOptions } from "electron";

export interface IShortcut
{
    type: string;
    key: string;
    control: boolean;
    meta: boolean;
    shift: boolean;
    alt: boolean;
}

const BLOCKED_KEYS = new Set(["F5", "F11", "F12", "BrowserBack", "BrowserForward", "BrowserRefresh", "BrowserHome"]);

const MODIFIED_KEYS = new Set(["r", "p", "=", "+", "-", "_", "0", "[", "]"]);

const INSPECTOR_KEYS = new Set(["i", "j", "c"]);

export function isBlockedShortcut(input: IShortcut): boolean
{
    if (input.type !== "keyDown")
    {
        return false;
    }
    const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
    const command = input.control || input.meta;
    if (BLOCKED_KEYS.has(key))
    {
        return true;
    }
    if (command && MODIFIED_KEYS.has(key))
    {
        return true;
    }
    if (command && (input.alt || input.shift) && INSPECTOR_KEYS.has(key))
    {
        return true;
    }
    return input.alt && !command && (key === "ArrowLeft" || key === "ArrowRight");
}

export function nativeMenu(): Menu | null
{
    if (process.platform !== "darwin")
    {
        return null;
    }
    const template: MenuItemConstructorOptions[] = [
        {
            label: app.name,
            submenu: [{ role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" }],
        },
        {
            label: "Edit",
            submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }],
        },
        {
            label: "Window",
            submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "togglefullscreen" }, { type: "separator" }, { role: "close" }],
        },
    ];
    return Menu.buildFromTemplate(template);
}

export function lockDown(window: BrowserWindow): void
{
    const contents = window.webContents;
    contents.setVisualZoomLevelLimits(1, 1);
    contents.on("before-input-event", (event, input) =>
    {
        if (isBlockedShortcut(input))
        {
            event.preventDefault();
        }
    });
    contents.on("will-navigate", event => event.preventDefault());
    contents.on("will-redirect", event => event.preventDefault());
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
    contents.on("context-menu", event => event.preventDefault());
}
