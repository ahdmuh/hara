import { isEmail, normalizeEmail } from "@hara/accounts";
import { invitation, passwordReset } from "@hara/email";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, internalQuery, query, type ActionCtx } from "./_generated/server";
import { currentUser, userWithRole } from "./Access";
import { issueTemporaryPassword } from "./Accounts";
import { sendEmail } from "./Mail";

export const clinicians = query({
    args: {},
    handler: async (ctx) =>
    {
        if (!(await userWithRole(ctx, "maintainer")))
        {
            return null;
        }
        const users = await ctx.db.query("users").withIndex("by_role", query => query.eq("role", "clinician")).collect();
        return users
            .sort((first, second) => second._creationTime - first._creationTime)
            .map(user => ({
                id: user._id,
                name: user.name,
                email: user.email ?? "",
                status: user.lastActiveAt === undefined ? "invited" as const : "active" as const,
                addedAt: user._creationTime,
                lastActiveAt: user.lastActiveAt,
            }));
    },
});

export const caller = internalQuery({
    args: {},
    handler: async ctx => await currentUser(ctx),
});

async function requireMaintainer(ctx: ActionCtx): Promise<Doc<"users"> | null>
{
    const user = await ctx.runQuery(internal.Admin.caller, {});
    return user && user.role === "maintainer" && !user.passwordChangeRequired ? user : null;
}

export const addClinician = action({
    args: { name: v.string(), email: v.string() },
    handler: async (ctx, args) =>
    {
        const admin = await requireMaintainer(ctx);
        if (!admin)
        {
            return { status: "error" as const, error: "FORBIDDEN" as const };
        }
        const name = args.name.trim().replace(/\s+/g, " ");
        const email = normalizeEmail(args.email);
        if (name.length < 2 || name.length > 80 || !isEmail(email))
        {
            return { status: "error" as const, error: "INVALID" as const };
        }
        const userID = await ctx.runMutation(internal.Accounts.create, { name, email, role: "clinician", addedBy: admin._id });
        if (!userID)
        {
            return { status: "error" as const, error: "EMAIL_TAKEN" as const };
        }
        const password = await issueTemporaryPassword(ctx, userID);
        const sent = await sendEmail(email, invitation(name, email, password));
        return sent ? { status: "complete" as const } : { status: "error" as const, error: "EMAIL_FAILED" as const };
    },
});

export const resetClinician = action({
    args: { userID: v.id("users") },
    handler: async (ctx, { userID }) =>
    {
        const admin = await requireMaintainer(ctx);
        if (!admin)
        {
            return { status: "error" as const, error: "FORBIDDEN" as const };
        }
        const clinician = await ctx.runQuery(internal.Accounts.byID, { userID });
        if (!clinician || clinician.role !== "clinician" || !clinician.email)
        {
            return { status: "error" as const, error: "NOT_FOUND" as const };
        }
        const password = await issueTemporaryPassword(ctx, userID);
        const email = clinician.lastActiveAt === undefined
            ? invitation(clinician.name, clinician.email, password)
            : passwordReset(clinician.name, clinician.email, password);
        const sent = await sendEmail(clinician.email, email);
        return sent ? { status: "complete" as const } : { status: "error" as const, error: "EMAIL_FAILED" as const };
    },
});
