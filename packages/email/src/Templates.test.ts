import { describe, expect, test } from "bun:test";
import { invitation, passwordReset } from "./Templates";

describe("invitation", () =>
{
    const email = invitation("Jordan Lee", "jordan@clinic.example", "Temp-Pass-123");

    test("uses a categorized title-case subject", () =>
    {
        expect(email.subject).toBe("Account: Portal Invitation");
    });

    test("carries the sign-in details in both the html and plain text", () =>
    {
        for (const body of [email.html, email.text])
        {
            expect(body).toContain("jordan@clinic.example");
            expect(body).toContain("Temp-Pass-123");
            expect(body).toContain("https://portal.projecthara.ca/login");
            expect(body).toContain("HARA Team");
        }
    });

    test("escapes names so they cannot inject markup", () =>
    {
        const hostile = invitation("<img src=x onerror=alert(1)>", "a@b.example", "x");
        expect(hostile.html).not.toContain("<img");
        expect(hostile.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });
});

describe("passwordReset", () =>
{
    test("links to the reset url under a security subject", () =>
    {
        const email = passwordReset("Jordan Lee", "https://portal.projecthara.ca/reset?token=abc");
        expect(email.subject).toBe("Security: Password Reset");
        expect(email.html).toContain("href=\"https://portal.projecthara.ca/reset?token=abc\"");
    });
});
