import { useMemo, useSyncExternalStore } from "react";
import { failedRules } from "./Password";

export type Role = "clinician" | "admin";

export interface IAccount
{
    name: string;
    email: string;
    role: Role;
}

export type SignInResult =
    | { status: "signedIn"; account: IAccount }
    | { status: "setup"; email: string }
    | { status: "error"; title: string; message: string };

interface IStoredAccount extends IAccount
{
    password: string;
    temporary: boolean;
}

const STORAGE_KEY = "hara.account";
const CHANGE_EVENT = "hara:auth";

const ACCOUNTS: IStoredAccount[] = [
    { name: "Demo Clinician", email: "demo@projecthara.ca", role: "clinician", password: "Copper-Kettle-42", temporary: false },
    { name: "New Clinician", email: "new@projecthara.ca", role: "clinician", password: "Temporary-Pass-7", temporary: true },
    { name: "HARA Admin", email: "admin@projecthara.ca", role: "admin", password: "Granite-Harbor-19", temporary: false },
];

function read(): string | null
{
    return window.sessionStorage.getItem(STORAGE_KEY);
}

function subscribe(listener: () => void): () => void
{
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function store(account: IAccount | null): void
{
    if (account)
    {
        const { name, email, role } = account;
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email, role }));
    }
    else
    {
        window.sessionStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAccount(): IAccount | null
{
    const raw = useSyncExternalStore(subscribe, read);
    return useMemo(() => (raw ? JSON.parse(raw) as IAccount : null), [raw]);
}

export function homeFor(account: IAccount): string
{
    return account.role === "admin" ? "/admin" : "/patients";
}

function delay(): Promise<void>
{
    return new Promise(resolve => window.setTimeout(resolve, 650));
}

function find(email: string): IStoredAccount | undefined
{
    const normalized = email.trim().toLowerCase();
    return ACCOUNTS.find(account => account.email === normalized);
}

export async function signIn(email: string, password: string): Promise<SignInResult>
{
    await delay();
    if (!email.trim() || !password)
    {
        return { status: "error", title: "Missing Details", message: "Enter your email and password." };
    }
    const account = find(email);
    if (!account || account.password !== password)
    {
        return { status: "error", title: "Incorrect Email or Password", message: "Check your details and try again." };
    }
    if (account.temporary)
    {
        return { status: "setup", email: account.email };
    }
    store(account);
    return { status: "signedIn", account };
}

export async function completeSetup(email: string, password: string, confirmation: string): Promise<SignInResult>
{
    await delay();
    const account = find(email);
    if (!account)
    {
        return { status: "error", title: "Session Expired", message: "Sign in again with your temporary password." };
    }
    if (failedRules(password, account.email).length > 0)
    {
        return { status: "error", title: "Password Too Weak", message: "Meet every requirement listed below the field." };
    }
    if (password !== confirmation)
    {
        return { status: "error", title: "Passwords Do Not Match", message: "Enter the same new password twice." };
    }
    account.password = password;
    account.temporary = false;
    store(account);
    return { status: "signedIn", account };
}

export function signOut(): void
{
    store(null);
}
