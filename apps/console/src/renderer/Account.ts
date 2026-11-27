import { useSignInWithUsernamePassword } from "@convex-dev/auth/methods/username-password/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { isEmail, normalizeEmail } from "@hara/accounts";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback } from "react";
import { api } from "../../../../convex/_generated/api";

const ACCOUNT_KEY = "hara.account";

export interface IAccount
{
    username: string;
    name: string;
}

export interface IRegistration
{
    name: string;
    email: string;
    birthday: string;
    password: string;
    code: string;
}

const MESSAGES: Record<string, string> = {
    INVALID_CODE: "That Code Isn't Valid or Has Expired",
    ALREADY_LINKED: "You're Already Linked to a Clinician",
    INVALID_NAME: "Check Your Name and Try Again",
    INVALID_BIRTHDAY: "Check Your Birthday and Try Again",
    INVALID_PASSWORD: "Choose a Different Password",
    RATE_LIMITED: "Too Many Attempts. Try Again Later",
    EMAIL_TAKEN: "An Account With That Email Already Exists",
    INVALID_EMAIL: "Enter a Valid Email",
};

export function storedAccount(): IAccount | null
{
    try
    {
        const value = JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) ?? "null") as IAccount | null;
        return value && typeof value.username === "string" && typeof value.name === "string" ? value : null;
    }
    catch
    {
        return null;
    }
}

function problem(error: unknown): string
{
    if (error instanceof ConvexError && typeof error.data === "string")
    {
        return MESSAGES[error.data] ?? "Something Went Wrong. Try Again";
    }
    return "Can't Connect. Check Your Connection";
}

export function useRegister(): (details: IRegistration) => Promise<IAccount | string>
{
    const register = useAction(api.Patients.register);
    const { signIn } = useSignInWithUsernamePassword(api.auth);
    return useCallback(async (details) =>
    {
        try
        {
            const { username } = await register({ ...details, code: details.code || undefined });
            const result = await signIn({ username, password: details.password });
            if (result.status !== "complete")
            {
                return "Can't Connect. Check Your Connection";
            }
            const account = { username, name: details.name };
            window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
            return account;
        }
        catch (error)
        {
            return problem(error);
        }
    }, [register, signIn]);
}

export function useSignIn(): (email: string, password: string) => Promise<IAccount | string>
{
    const { signIn } = useSignInWithUsernamePassword(api.auth);
    return useCallback(async (email, password) =>
    {
        const username = normalizeEmail(email);
        if (!isEmail(username))
        {
            return "Enter a Valid Email";
        }
        try
        {
            const result = await signIn({ username, password });
            if (result.status !== "complete")
            {
                const error = result.userError.error;
                return error === "RATE_LIMITED"
                    ? MESSAGES.RATE_LIMITED ?? ""
                    : error === "OTHER_ERROR"
                        ? "Can't Connect. Check Your Connection"
                        : "That Email or Password Isn't Right";
            }
            const account = { username, name: "" };
            window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
            return account;
        }
        catch (error)
        {
            return problem(error);
        }
    }, [signIn]);
}

export function useLinkClinician(): (code: string) => Promise<string | null>
{
    const link = useAction(api.Patients.linkClinician);
    return useCallback(async (code) =>
    {
        try
        {
            await link({ code });
            return null;
        }
        catch (error)
        {
            return problem(error);
        }
    }, [link]);
}

export function rememberName(name: string): void
{
    const account = storedAccount();
    if (account && account.name !== name)
    {
        window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...account, name }));
    }
}

export function useProfile()
{
    return useQuery(api.Patients.profile);
}

export function useSignOut(): () => Promise<void>
{
    const { signOut } = useAuthActions();
    return useCallback(async () =>
    {
        window.localStorage.removeItem(ACCOUNT_KEY);
        await signOut().catch(() => undefined);
    }, [signOut]);
}
