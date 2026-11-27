import { useSyncExternalStore } from "react";

export interface IClinician
{
    name: string;
    username: string;
}

export type SignInResult = { status: "signedIn" } | { status: "setup" } | { status: "error"; title: string; message: string };

const STORAGE_KEY = "hara.clinician";
const CHANGE_EVENT = "hara:auth";
const DEMO = { username: "demo", password: "hara-demo" };
const NEW_CLINICIAN = { username: "new", password: "temporary" };

function read(): string | null
{
    return window.sessionStorage.getItem(STORAGE_KEY);
}

function subscribe(listener: () => void): () => void
{
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}

function store(clinician: IClinician | null): void
{
    if (clinician)
    {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clinician));
    }
    else
    {
        window.sessionStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useClinician(): IClinician | null
{
    const raw = useSyncExternalStore(subscribe, read);
    return raw ? JSON.parse(raw) as IClinician : null;
}

function delay(): Promise<void>
{
    return new Promise(resolve => window.setTimeout(resolve, 650));
}

export async function signIn(username: string, password: string): Promise<SignInResult>
{
    await delay();
    const name = username.trim().toLowerCase();
    if (!name || !password)
    {
        return { status: "error", title: "Missing Details", message: "Enter your username and password." };
    }
    if (name === NEW_CLINICIAN.username && password === NEW_CLINICIAN.password)
    {
        return { status: "setup" };
    }
    if (name === DEMO.username && password === DEMO.password)
    {
        store({ name: "Demo Clinician", username: name });
        return { status: "signedIn" };
    }
    return { status: "error", title: "Incorrect Username or Password", message: "Check your details and try again." };
}

export async function completeSetup(username: string, password: string, confirmation: string): Promise<SignInResult>
{
    await delay();
    if (username.trim().length < 3)
    {
        return { status: "error", title: "Username Too Short", message: "Use at least 3 characters." };
    }
    if (password.length < 8)
    {
        return { status: "error", title: "Password Too Short", message: "Use at least 8 characters." };
    }
    if (password !== confirmation)
    {
        return { status: "error", title: "Passwords Do Not Match", message: "Enter the same new password twice." };
    }
    store({ name: "New Clinician", username: username.trim().toLowerCase() });
    return { status: "signedIn" };
}

export function signOut(): void
{
    store(null);
}
