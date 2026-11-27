import { formatLinkCode } from "@hara/accounts";

export const VALID_DAYS = 30;

export interface ILinkPin
{
    code: string;
    label: string;
    expiresAt: number;
}

export const formatPin = formatLinkCode;

export function inviteMessage(pin: ILinkPin, clinician: string, expires: string): string
{
    const greeting = pin.label ? `Hi ${pin.label},` : "Hi,";
    return [
        greeting,
        "",
        `To connect your HARA app to ${clinician}, open the app, choose Sign Up, and enter this link code when asked:`,
        "",
        formatPin(pin.code),
        "",
        `The code works once and is valid until ${expires}.`,
    ].join("\n");
}
