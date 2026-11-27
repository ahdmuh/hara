import { setupUsernamePassword } from "@convex-dev/auth/methods/username-password/server";
import { setupConvexAuth } from "@convex-dev/auth/server";
import { components, internal } from "./_generated/api";

const core = setupConvexAuth({ component: components.auth });

export const { signOut, refreshSession, isAuthenticated } = core;

export const { signInWithUsernamePassword } = setupUsernamePassword(core, {
    component: components.authPassword,
    usernameComponent: components.authUsername,
}).attachUserCallbacks({
    createUser: internal.Accounts.refuseSignUp,
    onSignIn: internal.Accounts.recordSignIn,
});
