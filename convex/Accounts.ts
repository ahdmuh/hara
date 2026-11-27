import { failedRules, MINIMUM_LENGTH, normalizeEmail } from "@hara/accounts";
import { invitation } from "@hara/email";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation, query, type ActionCtx } from "./_generated/server";
import { currentUser, temporaryPassword } from "./Access";
import { sendEmail } from "./Mail";
import { role } from "./schema";

const method = v.object({ name: v.string(), profile: v.any() });

export const refuseSignUp = internalMutation({
    args: { method },
    returns: v.id("users"),
    handler: async () =>
    {
        throw new ConvexError("SIGN_UP_DISABLED");
    },
});

export const recordSignIn = internalMutation({
    args: { method, userId: v.id("users") },
    returns: v.null(),
    handler: async (ctx, args) =>
    {
        await ctx.db.patch(args.userId, { lastActiveAt: Date.now() });
        return null;
    },
});

export const me = query({
    args: {},
    handler: async (ctx) =>
    {
        const user = await currentUser(ctx);
        if (!user)
        {
            return null;
        }
        return { name: user.name, email: user.email ?? "", role: user.role, passwordChangeRequired: user.passwordChangeRequired };
    },
});

export const changePassword = mutation({
    args: { currentPassword: v.string(), newPassword: v.string() },
    handler: async (ctx, { currentPassword, newPassword }) =>
    {
        const user = await currentUser(ctx);
        if (!user)
        {
            return { status: "error" as const, error: "NOT_SIGNED_IN" as const };
        }
        if (failedRules(newPassword, user.email ?? "").length > 0 || newPassword === currentPassword)
        {
            return { status: "error" as const, error: "WEAK_PASSWORD" as const };
        }
        const verified = await ctx.runMutation(components.authPassword.public.verifyPassword, { userId: user._id, password: currentPassword });
        if (!verified.success)
        {
            return { status: "error" as const, error: verified.userError.error === "RATE_LIMITED" ? "RATE_LIMITED" as const : "INVALID_CREDENTIALS" as const };
        }
        const set = await ctx.runMutation(components.authPassword.public._internal_dangerous_setPassword, {
            userId: user._id,
            password: newPassword,
            minimumLength: MINIMUM_LENGTH,
        });
        if (!set.success)
        {
            return { status: "error" as const, error: "WEAK_PASSWORD" as const };
        }
        await ctx.db.patch(user._id, { passwordChangeRequired: false, lastActiveAt: Date.now() });
        return { status: "complete" as const };
    },
});

export const byID = internalQuery({
    args: { userID: v.id("users") },
    handler: async (ctx, { userID }) => await ctx.db.get(userID),
});

export const create = internalMutation({
    args: { name: v.string(), email: v.string(), role, addedBy: v.optional(v.id("users")) },
    handler: async (ctx, args): Promise<Id<"users"> | null> =>
    {
        const existing = await ctx.db.query("users").withIndex("by_email", query => query.eq("email", args.email)).unique();
        if (existing)
        {
            return null;
        }
        const userID = await ctx.db.insert("users", { ...args, passwordChangeRequired: true });
        await ctx.runMutation(components.auth.public.markUserIdCreated, { userId: userID });
        const username = await ctx.runMutation(components.authUsername.public.setUsername, { userId: userID, username: args.email });
        if (!username.success)
        {
            throw new ConvexError("INVALID_EMAIL");
        }
        return userID;
    },
});

export const requirePasswordChange = internalMutation({
    args: { userID: v.id("users") },
    returns: v.null(),
    handler: async (ctx, { userID }) =>
    {
        await ctx.db.patch(userID, { passwordChangeRequired: true });
        const sessions = await ctx.runQuery(components.auth.public.listSessions, { userId: userID });
        await ctx.runMutation(components.auth.public.revokeSessions, { sessionIds: sessions.map(session => session.sessionId) });
        return null;
    },
});

export async function issueTemporaryPassword(ctx: ActionCtx, userID: Id<"users">): Promise<string>
{
    const password = temporaryPassword();
    const set = await ctx.runMutation(components.authPassword.public._internal_dangerous_setPassword, {
        userId: userID,
        password,
        minimumLength: MINIMUM_LENGTH,
    });
    if (!set.success)
    {
        throw new ConvexError("PASSWORD_FAILED");
    }
    await ctx.runMutation(internal.Accounts.requirePasswordChange, { userID });
    return password;
}

export const bootstrapAdmin = internalAction({
    args: { name: v.string(), email: v.string() },
    returns: v.string(),
    handler: async (ctx, args) =>
    {
        const email = normalizeEmail(args.email);
        const exists = await ctx.runQuery(internal.Accounts.hasMaintainer, {});
        if (exists)
        {
            return "An admin already exists.";
        }
        const userID = await ctx.runMutation(internal.Accounts.create, { name: args.name.trim(), email, role: "maintainer" });
        if (!userID)
        {
            return "That email already has an account.";
        }
        const password = await issueTemporaryPassword(ctx, userID);
        const sent = await sendEmail(email, invitation(args.name.trim(), email, password));
        return sent ? `Invitation sent to ${email}.` : "Account created, but the invitation email could not be sent.";
    },
});

export const hasMaintainer = internalQuery({
    args: {},
    handler: async ctx => (await ctx.db.query("users").withIndex("by_role", query => query.eq("role", "maintainer")).first()) !== null,
});
