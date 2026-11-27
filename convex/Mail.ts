import { SENDER, type IEmail } from "@hara/email";

const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail(to: string, email: IEmail): Promise<boolean>
{
    const key = process.env.RESEND_API_KEY;
    if (!key)
    {
        return false;
    }
    const response = await fetch(RESEND_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: SENDER, to: [to], subject: email.subject, html: email.html, text: email.text }),
    });
    return response.ok;
}
