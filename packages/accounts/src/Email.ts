const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string
{
    return email.trim().toLowerCase();
}

export function isEmail(email: string): boolean
{
    return email.length <= 254 && EMAIL_PATTERN.test(email);
}
