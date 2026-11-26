import { afterEach, expect, test } from "bun:test";
import { DeviceConnection, type IDeviceStatus } from "./DeviceConnection";
import type { IPort, IPortInfo, IPortProvider } from "./IPortProvider";
import type { DeviceMessage } from "./Protocol";

class FakePort implements IPort
{
    readonly written: string[] = [];
    closed = false;
    private readonly dataListeners: ((chunk: string) => void)[] = [];
    private readonly closeListeners: (() => void)[] = [];

    constructor(private readonly hello: string | null)
    {
    }

    write(data: string): void
    {
        this.written.push(data);
        const hello = this.hello;
        if (data === "HELLO\n" && hello)
        {
            queueMicrotask(() => this.send(hello));
        }
    }

    close(): void
    {
        if (!this.closed)
        {
            this.closed = true;
            this.closeListeners.forEach(listener => listener());
        }
    }

    onData(listener: (chunk: string) => void): void
    {
        this.dataListeners.push(listener);
    }

    onClose(listener: () => void): void
    {
        this.closeListeners.push(listener);
    }

    send(chunk: string): void
    {
        this.dataListeners.forEach(listener => listener(chunk));
    }
}

class FakeProvider implements IPortProvider
{
    ports: IPortInfo[] = [];
    readonly opened: FakePort[] = [];
    readonly hellos = new Map<string, string | null>();

    plug(path: string, hello: string | null, vendorID: string | null = "16c0"): void
    {
        this.ports.push({ path, vendorID });
        this.hellos.set(path, hello);
    }

    unplug(path: string): void
    {
        this.ports = this.ports.filter(port => port.path !== path);
        this.opened.filter(port => !port.closed).forEach(port => port.close());
    }

    async list(): Promise<IPortInfo[]>
    {
        return [...this.ports];
    }

    async open(path: string): Promise<IPort>
    {
        const port = new FakePort(this.hellos.get(path) ?? null);
        this.opened.push(port);
        return port;
    }
}

const OPTIONS = { scanMilliseconds: 5, handshakeMilliseconds: 20, silenceMilliseconds: 40, devicePath: null };

let connection: DeviceConnection | null = null;

afterEach(() => connection?.stop());

async function waitFor(condition: () => boolean): Promise<void>
{
    for (let attempt = 0; attempt < 200 && !condition(); attempt++)
    {
        await Bun.sleep(2);
    }
    expect(condition()).toBe(true);
}

function connect(provider: FakeProvider): { statuses: IDeviceStatus[]; messages: DeviceMessage[] }
{
    const statuses: IDeviceStatus[] = [];
    const messages: DeviceMessage[] = [];
    connection = new DeviceConnection(provider, OPTIONS);
    connection.onStatus(status => statuses.push(status));
    connection.onMessage(message => messages.push(message));
    connection.start();
    return { statuses, messages };
}

test("connects to the port that answers the handshake and starts streaming", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/keyboard", null, null);
    provider.plug("/dev/printer", null);
    provider.plug("/dev/hara", "HELLO,1,0.1.0\n");

    const { statuses } = connect(provider);
    await waitFor(() => statuses.length === 1);

    expect(statuses[0]).toEqual({ connected: true, firmware: "0.1.0" });
    expect(provider.opened.map(port => port.written)).toEqual([["HELLO\n"], ["HELLO\n", "START\n"]]);
    expect(provider.opened.at(0)?.closed).toBe(true);
});

test("does not keep probing a port that never answered while it stays plugged in", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/printer", null);

    connect(provider);
    await Bun.sleep(100);

    expect(provider.opened).toHaveLength(1);
});

test("refuses a device speaking another protocol version", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/hara", "HELLO,2,9.0.0\n");

    const { statuses } = connect(provider);
    await Bun.sleep(60);

    expect(statuses).toEqual([]);
});

test("forwards device messages once connected and drops malformed lines", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/hara", "HELLO,1,0.1.0\n");

    const { statuses, messages } = connect(provider);
    await waitFor(() => statuses.length === 1);
    const [port] = provider.opened;
    port?.send("STATUS,10,REA");
    port?.send("DY\nDATA,garbage\nSTATUS,20,ESTOP\n");

    expect(messages).toEqual([
        { type: "status", timestamp: 10, state: "READY", code: null },
        { type: "status", timestamp: 20, state: "ESTOP", code: null },
    ]);
});

test("drops a device that goes silent so a frozen board is not shown as connected", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/hara", "HELLO,1,0.1.0\n");

    const { statuses } = connect(provider);
    await waitFor(() => statuses.length === 2);

    expect(statuses.map(status => status.connected)).toEqual([true, false]);
    expect(provider.opened.at(0)?.closed).toBe(true);
});

test("reconnects after the device is unplugged and plugged back in", async () =>
{
    const provider = new FakeProvider();
    provider.plug("/dev/hara", "HELLO,1,0.1.0\n");

    const { statuses } = connect(provider);
    await waitFor(() => statuses.length === 1);

    provider.unplug("/dev/hara");
    await waitFor(() => statuses.length === 2);
    provider.plug("/dev/hara", "HELLO,1,0.1.0\n");
    await waitFor(() => statuses.length === 3);

    expect(statuses.map(status => status.connected)).toEqual([true, false, true]);
});
