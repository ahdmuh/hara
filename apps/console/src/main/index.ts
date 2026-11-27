import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { app, BrowserWindow, ipcMain } from "electron";
import { CHANNELS } from "../shared/IBridge";
import { DeviceConnection } from "./DeviceConnection";
import { SerialPortProvider } from "./SerialPortProvider";
import { SessionStore } from "./SessionStore";

const device = new DeviceConnection(new SerialPortProvider(), {
    scanMilliseconds: 1000,
    handshakeMilliseconds: 2000,
    silenceMilliseconds: 1000,
    devicePath: process.env.HARA_DEVICE_PATH ?? null,
});

let database: DatabaseSync | null = null;
let sessions: SessionStore | null = null;

function openSessions(): void
{
    database = new DatabaseSync(join(app.getPath("userData"), "hara.sqlite"));
    database.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
    sessions = new SessionStore(database);
    sessions.recoverInterrupted();
}

function broadcast(channel: string, payload: unknown): void
{
    BrowserWindow.getAllWindows().forEach(window => window.webContents.send(channel, payload));
}

function createWindow(): void
{
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 960,
        minHeight: 600,
        show: false,
        title: "HARA",
        backgroundColor: "#fcfbf8",
        titleBarStyle: "hidden",
        trafficLightPosition: { x: 18, y: 18 },
        titleBarOverlay: process.platform === "darwin" ? false : { color: "#00000000", symbolColor: "#3b3b43", height: 40 },
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
        },
    });

    mainWindow.once("ready-to-show", () => mainWindow.show());

    const devServerURL = process.env.ELECTRON_RENDERER_URL;
    if (devServerURL)
    {
        void mainWindow.loadURL(devServerURL);
    }
    else
    {
        void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

ipcMain.handle(CHANNELS.version, () => app.getVersion());
ipcMain.handle(CHANNELS.deviceStatus, () => device.currentStatus);
device.onStatus(status => broadcast(CHANNELS.deviceStatus, status));
device.onMessage(message => broadcast(CHANNELS.deviceMessage, message));

void app.whenReady().then(() =>
{
    openSessions();
    createWindow();
    device.start();
    app.on("activate", () =>
    {
        if (BrowserWindow.getAllWindows().length === 0)
        {
            createWindow();
        }
    });
});

app.on("window-all-closed", () =>
{
    if (process.platform !== "darwin")
    {
        app.quit();
    }
});

app.on("before-quit", () =>
{
    device.stop();
    sessions = null;
    database?.close();
    database = null;
});
