export interface IPasswordRule
{
    id: string;
    label: string;
    passes: (password: string, email: string) => boolean;
}

export const MINIMUM_LENGTH = 12;

const COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "hara", "projecthara", "admin", "iloveyou", "monkey", "dragon"];

export const PASSWORD_RULES: IPasswordRule[] = [
    {
        id: "length",
        label: `At least ${MINIMUM_LENGTH} characters`,
        passes: password => password.length >= MINIMUM_LENGTH,
    },
    {
        id: "case",
        label: "Upper and lowercase letters",
        passes: password => /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
        id: "number",
        label: "At least one number",
        passes: password => /\d/.test(password),
    },
    {
        id: "symbol",
        label: "At least one symbol",
        passes: password => /[^A-Za-z0-9\s]/.test(password),
    },
    {
        id: "personal",
        label: "No email or common words",
        passes: (password, email) =>
        {
            const lower = password.toLowerCase();
            const name = email.split("@")[0]?.toLowerCase() ?? "";
            return (name.length < 3 || !lower.includes(name)) && !COMMON.some(word => lower.includes(word));
        },
    },
];

export function failedRules(password: string, email: string): IPasswordRule[]
{
    return PASSWORD_RULES.filter(rule => !rule.passes(password, email));
}
