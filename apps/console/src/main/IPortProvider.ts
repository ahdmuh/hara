export interface IPortInfo
{
    path: string;
    vendorID: string | null;
}

export interface IPort
{
    write(data: string): void;
    close(): void;
    onData(listener: (chunk: string) => void): void;
    onClose(listener: () => void): void;
}

export interface IPortProvider
{
    list(): Promise<IPortInfo[]>;
    open(path: string): Promise<IPort>;
}
