export const LINK_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const LINK_CODE_LENGTH = 8;

const LIMIT = 256 - (256 % LINK_CODE_ALPHABET.length);

function secureBytes(count: number): Uint8Array
{
    const bytes = new Uint8Array(new ArrayBuffer(count));
    crypto.getRandomValues(bytes);
    return bytes;
}

export function generateLinkCode(random: (count: number) => Uint8Array = secureBytes): string
{
    let code = "";
    while (code.length < LINK_CODE_LENGTH)
    {
        for (const value of random(LINK_CODE_LENGTH * 2))
        {
            if (value < LIMIT && code.length < LINK_CODE_LENGTH)
            {
                code += LINK_CODE_ALPHABET[value % LINK_CODE_ALPHABET.length];
            }
        }
    }
    return code;
}

export function normalizeLinkCode(input: string): string | null
{
    const code = input.toUpperCase().replace(/[\s-]/g, "");
    if (code.length !== LINK_CODE_LENGTH || [...code].some(character => !LINK_CODE_ALPHABET.includes(character)))
    {
        return null;
    }
    return code;
}

export function formatLinkCode(code: string): string
{
    return `${code.slice(0, 4)}-${code.slice(4)}`;
}
