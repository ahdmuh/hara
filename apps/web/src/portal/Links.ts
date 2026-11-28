import { formatLinkCode } from "@hara/accounts";

export const VALID_DAYS = 30;

export interface ILinkPin
{
    code: string;
    expiresAt: number;
}

export const formatPin = formatLinkCode;

export function inviteMessage(pin: ILinkPin, clinician: string, expires: string): string
{
    return [
        "Hi,",
        "",
        `To link your HARA account to ${clinician}, open HARA, choose Create an Account, and enter this link code when asked:`,
        "",
        formatPin(pin.code),
        "",
        `The code works once and is valid until ${expires}.`,
    ].join("\n");
}
