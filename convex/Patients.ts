import { getAuthUserId } from "@convex-dev/auth/server";
import { filterName, isEmail, nameError, normalizeEmail, normalizeLinkCode } from "@hara/accounts";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, query, type MutationCtx } from "./_generated/server";
import { userWithRole } from "./Access";

const MINIMUM_PASSWORD = 8;
const MAXIMUM_PASSWORD = 128;
const FIRST_YEAR = 1900;
const HOUR = 3_600_000;
const REGISTRATIONS_PER_HOUR = 60;
const LINK_ATTEMPTS_PER_HOUR = 8;

function validBirthday(value: string): boolean
{
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
    {
        return false;
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    return real && year >= FIRST_YEAR && date.getTime() <= Date.now();
}

async function redeem(ctx: MutationCtx, input: string, patientID: Id<"patients">): Promise<void>
{
    const code = normalizeLinkCode(input);
    const pin = code
        ? await ctx.db.query("linkPins").withIndex("by_code_status", query => query.eq("code", code).eq("status", "pending")).first()
        : null;
    if (!pin || pin.expiresAt <= Date.now())
    {
        throw new ConvexError("INVALID_CODE");
    }
    await ctx.db.patch(patientID, { clinicianID: pin.clinicianID });
    await ctx.db.patch(pin._id, { status: "used", usedBy: patientID });
    await ctx.db.insert("milestones", { patientID, kind: "linked", achievedAt: Date.now() });
}

export const consume = internalMutation({
    args: { key: v.string(), maximum: v.number(), windowMilliseconds: v.number() },
    returns: v.boolean(),
    handler: async (ctx, args) =>
    {
        const now = Date.now();
        const limit = await ctx.db.query("limits").withIndex("by_key", query => query.eq("key", args.key)).unique();
        if (!limit || now - limit.windowStart >= args.windowMilliseconds)
        {
            if (limit)
            {
                await ctx.db.patch(limit._id, { windowStart: now, count: 1 });
            }
            else
            {
                await ctx.db.insert("limits", { key: args.key, windowStart: now, count: 1 });
            }
            return true;
        }
        if (limit.count >= args.maximum)
        {
            return false;
        }
        await ctx.db.patch(limit._id, { count: limit.count + 1 });
        return true;
    },
});

export const createPatient = internalMutation({
    args: { name: v.string(), email: v.string(), birthday: v.string(), code: v.optional(v.string()) },
    returns: v.object({ userID: v.id("users"), username: v.string() }),
    handler: async (ctx, args) =>
    {
        const existing = await ctx.db.query("users").withIndex("by_email", query => query.eq("email", args.email)).unique();
        if (existing)
        {
            throw new ConvexError("EMAIL_TAKEN");
        }
        const userID = await ctx.db.insert("users", { name: args.name, email: args.email, role: "patient", passwordChangeRequired: false });
        await ctx.runMutation(components.auth.public.markUserIdCreated, { userId: userID });
        const set = await ctx.runMutation(components.authUsername.public.setUsername, { userId: userID, username: args.email });
        if (!set.success)
        {
            throw new ConvexError("EMAIL_TAKEN");
        }
        const username = args.email;
        const patientID = await ctx.db.insert("patients", { userID, birthday: args.birthday });
        if (args.code)
        {
            await redeem(ctx, args.code, patientID);
        }
        return { userID, username };
    },
});

export const removePatient = internalMutation({
    args: { userID: v.id("users") },
    returns: v.null(),
    handler: async (ctx, { userID }) =>
    {
        const patient = await ctx.db.query("patients").withIndex("by_userID", query => query.eq("userID", userID)).unique();
        if (patient)
        {
            const milestones = await ctx.db.query("milestones").withIndex("by_patientID_achievedAt", query => query.eq("patientID", patient._id)).collect();
            await Promise.all(milestones.map(milestone => ctx.db.delete(milestone._id)));
            await ctx.db.delete(patient._id);
        }
        const sessions = await ctx.runQuery(components.auth.public.listSessions, { userId: userID });
        await ctx.runMutation(components.auth.public.revokeSessions, { sessionIds: sessions.map(session => session.sessionId) });
        await ctx.runMutation(components.authUsername.public.deleteUsername, { userId: userID });
        await ctx.db.delete(userID);
        return null;
    },
});

export const register = action({
    args: { name: v.string(), email: v.string(), birthday: v.string(), password: v.string(), code: v.optional(v.string()) },
    returns: v.object({ username: v.string() }),
    handler: async (ctx, args): Promise<{ username: string }> =>
    {
        const name = filterName(args.name).trim();
        if (name !== args.name.trim() || nameError(name))
        {
            throw new ConvexError("INVALID_NAME");
        }
        const email = normalizeEmail(args.email);
        if (!isEmail(email))
        {
            throw new ConvexError("INVALID_EMAIL");
        }
        if (!validBirthday(args.birthday))
        {
            throw new ConvexError("INVALID_BIRTHDAY");
        }
        if (args.password.length < MINIMUM_PASSWORD || args.password.length > MAXIMUM_PASSWORD)
        {
            throw new ConvexError("INVALID_PASSWORD");
        }
        const allowed = await ctx.runMutation(internal.Patients.consume, { key: "register", maximum: REGISTRATIONS_PER_HOUR, windowMilliseconds: HOUR });
        if (!allowed)
        {
            throw new ConvexError("RATE_LIMITED");
        }
        const code = args.code?.trim() ? args.code : undefined;
        const created: { userID: Id<"users">; username: string } = await ctx.runMutation(internal.Patients.createPatient, { name, email, birthday: args.birthday, code });
        const { userID, username } = created;
        const set = await ctx.runMutation(components.authPassword.public._internal_dangerous_setPassword, {
            userId: userID,
            password: args.password,
            minimumLength: MINIMUM_PASSWORD,
        });
        if (!set.success)
        {
            await ctx.runMutation(internal.Patients.removePatient, { userID });
            throw new ConvexError("INVALID_PASSWORD");
        }
        return { username };
    },
});

export const link = internalMutation({
    args: { userID: v.id("users"), code: v.string() },
    returns: v.null(),
    handler: async (ctx, { userID, code }) =>
    {
        const user = await ctx.db.get(userID);
        const patient = user?.role === "patient"
            ? await ctx.db.query("patients").withIndex("by_userID", query => query.eq("userID", userID)).unique()
            : null;
        if (!patient)
        {
            throw new ConvexError("FORBIDDEN");
        }
        if (patient.clinicianID)
        {
            throw new ConvexError("ALREADY_LINKED");
        }
        await redeem(ctx, code, patient._id);
        return null;
    },
});

export const currentUser = internalQuery({
    args: {},
    returns: v.union(v.id("users"), v.null()),
    handler: async ctx => getAuthUserId(ctx),
});

export const linkClinician = action({
    args: { code: v.string() },
    returns: v.null(),
    handler: async (ctx, { code }): Promise<null> =>
    {
        const userID: Id<"users"> | null = await ctx.runQuery(internal.Patients.currentUser, {});
        if (!userID)
        {
            throw new ConvexError("FORBIDDEN");
        }
        const allowed = await ctx.runMutation(internal.Patients.consume, { key: `link:${userID}`, maximum: LINK_ATTEMPTS_PER_HOUR, windowMilliseconds: HOUR });
        if (!allowed)
        {
            throw new ConvexError("RATE_LIMITED");
        }
        await ctx.runMutation(internal.Patients.link, { userID, code });
        return null;
    },
});

export const profile = query({
    args: {},
    handler: async (ctx) =>
    {
        const user = await userWithRole(ctx, "patient");
        if (!user)
        {
            return null;
        }
        const patient = await ctx.db.query("patients").withIndex("by_userID", query => query.eq("userID", user._id)).unique();
        if (!patient)
        {
            return null;
        }
        const milestones = await ctx.db.query("milestones").withIndex("by_patientID_achievedAt", query => query.eq("patientID", patient._id)).collect();
        return {
            name: user.name,
            linked: !!patient.clinicianID,
            email: user.email ?? null,
            milestones: milestones.map(milestone => milestone.kind),
        };
    },
});
