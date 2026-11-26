import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { CHANNELS } from "../shared/IBridge";

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

void app.whenReady().then(() =>
{
    createWindow();
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
