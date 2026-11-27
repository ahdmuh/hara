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

export function passwordReset(name: string, resetUrl: string): IEmail
{
    return render({
        category: "Security",
        title: "Password Reset",
        greeting: `Hi ${name},`,
        paragraphs: [
            "A password reset was requested for your HARA portal account. Use the button below to choose a new password.",
            "If you did not expect this email, you can ignore it and your password will stay the same.",
        ],
        action: { label: "Reset Password", url: resetUrl },
    });
}
