import { SerialPort } from "serialport";
import type { IPort, IPortInfo, IPortProvider } from "./IPortProvider";

const BAUD_RATE = 115200;

export class SerialPortProvider implements IPortProvider
{
    async list(): Promise<IPortInfo[]>
    {
        const ports = await SerialPort.list();
        return ports.map(port => ({ path: port.path, vendorID: port.vendorId ?? null }));
    }

    open(path: string): Promise<IPort>
    {
        return new Promise((resolve, reject) =>
        {
            const port = new SerialPort({ path, baudRate: BAUD_RATE }, (error) =>
            {
                if (error)
                {
                    reject(error);
                    return;
                }
                resolve({
                    write: data => port.write(data),
                    close: () => port.isOpen && port.close(),
                    onData: listener => port.on("data", (chunk: Buffer) => listener(chunk.toString("ascii"))),
                    onClose: (listener) =>
                    {
                        port.on("close", listener);
                        port.on("error", listener);
                    },
                });
            });
        });
    }
}
