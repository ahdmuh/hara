import { filterName, nameError, normalizeLinkCode } from "@hara/accounts";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { requireRole, userWithRole } from "./Access";

const MINIMUM_PASSWORD = 8;
const MAXIMUM_PASSWORD = 128;
const FIRST_YEAR = 1900;

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

export const createPatient = internalMutation({
    args: { name: v.string(), birthday: v.string(), code: v.optional(v.string()) },
    returns: v.object({ userID: v.id("users"), username: v.string() }),
    handler: async (ctx, args) =>
    {
        const userID = await ctx.db.insert("users", { name: args.name, role: "patient", passwordChangeRequired: false });
        await ctx.runMutation(components.auth.public.markUserIdCreated, { userId: userID });
        const username = `patient-${crypto.randomUUID()}`;
        const set = await ctx.runMutation(components.authUsername.public.setUsername, { userId: userID, username });
        if (!set.success)
        {
            throw new ConvexError("ACCOUNT_FAILED");
        }
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
            await ctx.db.delete(patient._id);
        }
        await ctx.db.delete(userID);
        return null;
    },
});

export const register = action({
    args: { name: v.string(), birthday: v.string(), password: v.string(), code: v.optional(v.string()) },
    returns: v.object({ username: v.string() }),
    handler: async (ctx, args): Promise<{ username: string }> =>
    {
        const name = filterName(args.name).trim();
        if (name !== args.name.trim() || nameError(name))
        {
            throw new ConvexError("INVALID_NAME");
        }
        if (!validBirthday(args.birthday))
        {
            throw new ConvexError("INVALID_BIRTHDAY");
        }
        if (args.password.length < MINIMUM_PASSWORD || args.password.length > MAXIMUM_PASSWORD)
        {
            throw new ConvexError("INVALID_PASSWORD");
        }
        const code = args.code?.trim() ? args.code : undefined;
        const created: { userID: Id<"users">; username: string } = await ctx.runMutation(internal.Patients.createPatient, { name, birthday: args.birthday, code });
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

export const linkClinician = mutation({
    args: { code: v.string() },
    returns: v.null(),
    handler: async (ctx, { code }) =>
    {
        const user = await requireRole(ctx, "patient");
        const patient = await ctx.db.query("patients").withIndex("by_userID", query => query.eq("userID", user._id)).unique();
        if (!patient)
        {
            throw new ConvexError("NOT_FOUND");
        }
        if (patient.clinicianID)
        {
            throw new ConvexError("ALREADY_LINKED");
        }
        await redeem(ctx, code, patient._id);
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
        return patient ? { name: user.name, linked: !!patient.clinicianID } : null;
    },
});
