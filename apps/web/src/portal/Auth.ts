import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../../../../convex/_generated/api";
import { navigate } from "../Router";

export type Role = "clinician" | "maintainer" | "patient";

export interface IAccount
{
    name: string;
    email: string;
    role: Role;
    passwordChangeRequired: boolean;
}

export interface IAccountState
{
    loading: boolean;
    account: IAccount | null;
}

export function useAccount(): IAccountState
{
    const { isLoading, isAuthenticated } = useConvexAuth();
    const me = useQuery(api.Accounts.me, isAuthenticated ? {} : "skip");
    if (isLoading || (isAuthenticated && me === undefined))
    {
        return { loading: true, account: null };
    }
    return { loading: false, account: isAuthenticated ? me ?? null : null };
}

export function homeFor(account: IAccount): string
{
    if (account.passwordChangeRequired)
    {
        return "/login";
    }
    return account.role === "maintainer" ? "/admin" : "/patients";
}

export function useSignOut(): () => Promise<void>
{
    const { signOut } = useAuthActions();
    return useCallback(async () =>
    {
        await signOut();
        navigate("/login", { replace: true });
    }, [signOut]);
}
