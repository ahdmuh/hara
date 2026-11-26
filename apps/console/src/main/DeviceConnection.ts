import type { IPort, IPortProvider } from "./IPortProvider";
import { LineBuffer } from "./LineBuffer";
import { encodeCommand, parseDeviceLine, PROTOCOL_VERSION, type DeviceMessage } from "./Protocol";

export interface IDeviceStatus
{
    connected: boolean;
    firmware: string | null;
}

export interface IConnectionOptions
{
    scanMilliseconds: number;
    handshakeMilliseconds: number;
    silenceMilliseconds: number;
    devicePath: string | null;
}

const DISCONNECTED: IDeviceStatus = { connected: false, firmware: null };

export class DeviceConnection
{
    private port: IPort | null = null;
    private status = DISCONNECTED;
    private scanning = false;
    private lastMessageAt = 0;
    private timer: ReturnType<typeof setInterval> | null = null;
    private readonly rejected = new Set<string>();
    private readonly statusListeners = new Set<(status: IDeviceStatus) => void>();
    private readonly messageListeners = new Set<(message: DeviceMessage) => void>();

    constructor(private readonly provider: IPortProvider, private readonly options: IConnectionOptions)
    {
    }

    get currentStatus(): IDeviceStatus
    {
        return this.status;
    }

    start(): void
    {
        this.timer ??= setInterval(() => void this.scan(), this.options.scanMilliseconds);
        void this.scan();
    }

    stop(): void
    {
        if (this.timer)
        {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.port?.close();
    }

    onStatus(listener: (status: IDeviceStatus) => void): () => void
    {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    onMessage(listener: (message: DeviceMessage) => void): () => void
    {
        this.messageListeners.add(listener);
        return () => this.messageListeners.delete(listener);
    }

    private async candidatePaths(): Promise<string[]>
    {
        if (this.options.devicePath)
        {
            return [this.options.devicePath];
        }
        const ports = await this.provider.list();
        const present = new Set(ports.map(port => port.path));
        this.rejected.forEach(path => !present.has(path) && this.rejected.delete(path));
        return ports.filter(port => port.vendorID !== null && !this.rejected.has(port.path)).map(port => port.path);
    }

    private async scan(): Promise<void>
    {
        if (this.port)
        {
            this.dropIfSilent(this.port);
            return;
        }
        if (this.scanning)
        {
            return;
        }
        this.scanning = true;
        try
        {
            for (const path of await this.candidatePaths())
            {
                if (await this.probe(path))
                {
                    return;
                }
                this.rejected.add(path);
            }
        }
        catch
        {
            this.setStatus(DISCONNECTED);
        }
        finally
        {
            this.scanning = false;
        }
    }

    private async probe(path: string): Promise<boolean>
    {
        const port = await this.provider.open(path).catch(() => null);
        if (!port)
        {
            return false;
        }

        const buffer = new LineBuffer();
        const firmware = await new Promise<string | null>((resolve) =>
        {
            const timeout = setTimeout(() => resolve(null), this.options.handshakeMilliseconds);
            port.onData((chunk) =>
            {
                for (const message of buffer.push(chunk).map(parseDeviceLine))
                {
                    if (this.port === port && message)
                    {
                        this.lastMessageAt = Date.now();
                        this.messageListeners.forEach(listener => listener(message));
                    }
                    else if (message?.type === "hello" && message.protocol === PROTOCOL_VERSION)
                    {
                        clearTimeout(timeout);
                        resolve(message.firmware);
                    }
                }
            });
            port.onClose(() =>
            {
                clearTimeout(timeout);
                resolve(null);
                this.disconnect(port);
            });
            port.write(encodeCommand("HELLO"));
        });

        if (!firmware)
        {
            port.close();
            return false;
        }
        this.port = port;
        this.lastMessageAt = Date.now();
        port.write(encodeCommand("START"));
        this.setStatus({ connected: true, firmware });
        return true;
    }

    private dropIfSilent(port: IPort): void
    {
        if (Date.now() - this.lastMessageAt > this.options.silenceMilliseconds)
        {
            port.close();
            this.disconnect(port);
        }
    }

    private disconnect(port: IPort): void
    {
        if (this.port === port)
        {
            this.port = null;
            this.setStatus(DISCONNECTED);
        }
    }

    private setStatus(status: IDeviceStatus): void
    {
        if (status.connected !== this.status.connected || status.firmware !== this.status.firmware)
        {
            this.status = status;
            this.statusListeners.forEach(listener => listener(status));
        }
    }
}
