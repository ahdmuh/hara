import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { CHANNELS } from "../shared/IBridge";
import { DeviceConnection } from "./DeviceConnection";
import { SerialPortProvider } from "./SerialPortProvider";

const device = new DeviceConnection(new SerialPortProvider(), {
    scanMilliseconds: 1000,
    handshakeMilliseconds: 2000,
    silenceMilliseconds: 1000,
    devicePath: process.env.HARA_DEVICE_PATH ?? null,
});

function broadcast(channel: string, payload: unknown): void
{
    BrowserWindow.getAllWindows().forEach(window => window.webContents.send(channel, payload));
}

function createWindow(): void
{
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        backgroundColor: "#000000",
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

app.on("before-quit", () => device.stop());
