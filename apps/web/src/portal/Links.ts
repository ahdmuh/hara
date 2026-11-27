export const VALID_DAYS = 30;

export interface ILinkPin
{
    code: string;
    label: string;
    expiresAt: number;
}

export function formatPin(code: string): string
{
    return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export function inviteMessage(pin: ILinkPin, clinician: string, expires: string): string
{
    const greeting = pin.label ? `Hi ${pin.label},` : "Hi,";
    return [
        greeting,
        "",
        `To connect your HARA app to ${clinician}, open the app, choose Sign Up, and enter this PIN when asked:`,
        "",
        formatPin(pin.code),
        "",
        `The PIN works once and is valid until ${expires}.`,
    ].join("\n");
}
