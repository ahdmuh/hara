export const MAXIMUM_NAME = 60;

const PART = /^\p{L}[\p{L}\p{M}]*(?:['’-]\p{L}[\p{L}\p{M}]*)*\.?$/u;

export function filterName(raw: string): string
{
    return raw
        .replace(/[^\p{L}\p{M} '’.-]/gu, "")
        .replace(/\s+/g, " ")
        .replace(/(['’.-])['’.-]+/g, "$1")
        .replace(/^[\s'’.-]+/, "")
        .slice(0, MAXIMUM_NAME);
}

export function nameParts(value: string): string[]
{
    return value.trim().split(" ").filter(Boolean);
}

export function nameError(value: string): string | null
{
    const parts = nameParts(value);
    if (parts.length < 2)
    {
        return "Enter Your First and Last Name";
    }
    if (!parts.every(part => PART.test(part)))
    {
        return "Names Can Only Join With a Hyphen or Apostrophe";
    }
    return null;
}

export function firstName(value: string): string
{
    return nameParts(value)[0] ?? "";
}
