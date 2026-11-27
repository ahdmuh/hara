import { PORTAL_URL, render, type IEmail } from "./Layout";

export function invitation(name: string, email: string, temporaryPassword: string): IEmail
{
    return render({
        category: "Account",
        title: "Portal Invitation",
        greeting: `Hi ${name},`,
        paragraphs: [
            "You have been invited to the HARA clinician portal, where you can follow your patients' progress between sessions.",
            "Sign in with the details below. You will be asked to set your own password the first time you sign in.",
        ],
        details: [
            { label: "Email", value: email },
            { label: "Temporary Password", value: temporaryPassword },
        ],
        action: { label: "Sign In to the Portal", url: `${PORTAL_URL}/login` },
    });
}

export function passwordReset(name: string, email: string, temporaryPassword: string): IEmail
{
    return render({
        category: "Security",
        title: "Password Reset",
        greeting: `Hi ${name},`,
        paragraphs: [
            "Your HARA portal password has been reset by an administrator. Sign in with the temporary password below, and you will be asked to choose a new one straight away.",
            "If you did not ask for this, reply to this email so we can look into it.",
        ],
        details: [
            { label: "Email", value: email },
            { label: "Temporary Password", value: temporaryPassword },
        ],
        action: { label: "Sign In to the Portal", url: `${PORTAL_URL}/login` },
        closing: "For your security, this temporary password stops working once you set a new one.",
    });
}
