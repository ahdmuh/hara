import { SENDER } from "@hara/email";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const RESEND_URL = "https://api.resend.com/emails";

export const send = internalAction({
    args: { to: v.string(), subject: v.string(), html: v.string(), text: v.string() },
    handler: async (_context, message) =>
    {
        const key = process.env.RESEND_API_KEY;
        if (!key)
        {
            throw new Error("RESEND_API_KEY is not set on this deployment.");
        }
        const response = await fetch(RESEND_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: SENDER, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
        });
        if (!response.ok)
        {
            throw new Error(`Resend rejected the email with status ${response.status}.`);
        }
    },
});
