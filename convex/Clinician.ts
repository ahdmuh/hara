import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireRole, userWithRole } from "./Access";
import { targets as targetsValidator } from "./schema";

const DAY = 86_400_000;
const PIN_DAYS = 30;
const TREND_LENGTH = 12;
const DEFAULT_TARGETS = { rangeOfMotion: 70, strength: 60, speed: 80 };
const GAMES = ["rangeOfMotion", "strength", "speed"] as const;

function age(birthday: string): number | null
{
    const born = Date.parse(birthday);
    return Number.isNaN(born) ? null : Math.floor((Date.now() - born) / (365.25 * DAY));
}

function rangePercent(open: number, fist: number): number
{
    return Math.round(Math.min(100, (Math.abs(fist - open) / 1023) * 100));
}

function average(values: number[] | undefined): number
{
    return values && values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

async function ownedPatient(ctx: QueryCtx, clinicianID: Id<"users">, patientID: Id<"patients">): Promise<Doc<"patients">>
{
    const patient = await ctx.db.get(patientID);
    if (!patient || patient.clinicianID !== clinicianID)
    {
        throw new ConvexError("NOT_FOUND");
    }
    return patient;
}

export const patients = query({
    args: {},
    handler: async (ctx) =>
    {
        const clinician = await userWithRole(ctx, "clinician");
        if (!clinician)
        {
            return null;
        }
        const linked = await ctx.db.query("patients").withIndex("by_clinicianID", query => query.eq("clinicianID", clinician._id)).collect();
        return await Promise.all(linked.map(async (patient) =>
        {
            const user = await ctx.db.get(patient.userID);
            const sessions = await ctx.db.query("sessions").withIndex("by_patientID_startedAt", query => query.eq("patientID", patient._id)).order("desc").collect();
            const milestone = await ctx.db.query("milestones").withIndex("by_patientID_achievedAt", query => query.eq("patientID", patient._id)).order("desc").first();
            const trends = Object.fromEntries(GAMES.map(game => [
                game,
                sessions.filter(session => session.game === game).slice(0, TREND_LENGTH).reverse().map(session => average(session.fingers)),
            ])) as Record<(typeof GAMES)[number], number[]>;
            return {
                id: patient._id,
                name: user?.name ?? "Unknown",
                age: age(patient.birthday),
                lastSession: sessions[0]?.startedAt,
                sessionCount: sessions.length,
                trends,
                milestone: milestone ? { kind: milestone.kind, achievedAt: milestone.achievedAt } : null,
            };
        }));
    },
});

export const patient = query({
    args: { patientID: v.string() },
    handler: async (ctx, args) =>
    {
        const clinician = await userWithRole(ctx, "clinician");
        if (!clinician)
        {
            return null;
        }
        const patientID = ctx.db.normalizeId("patients", args.patientID);
        if (!patientID)
        {
            return null;
        }
        const record = await ctx.db.get(patientID);
        if (!record || record.clinicianID !== clinician._id)
        {
            return null;
        }
        const user = await ctx.db.get(record.userID);
        const sessions = await ctx.db.query("sessions").withIndex("by_patientID_startedAt", query => query.eq("patientID", patientID)).order("desc").take(500);
        const milestones = await ctx.db.query("milestones").withIndex("by_patientID_achievedAt", query => query.eq("patientID", patientID)).order("desc").collect();
        const calibrations = await ctx.db.query("calibrations").withIndex("by_patientID_takenAt", query => query.eq("patientID", patientID)).order("desc").take(24);
        return {
            id: record._id,
            name: user?.name ?? "Unknown",
            age: age(record.birthday),
            linkedAt: record._creationTime,
            targets: record.targets ?? DEFAULT_TARGETS,
            sessions: sessions.map(session => ({
                id: session._id,
                game: session.game,
                startedAt: session.startedAt,
                minutes: Math.max(1, Math.round((session.endedAt - session.startedAt) / 60_000)),
                score: session.score,
                fingers: session.fingers ?? [],
            })),
            milestones: milestones.map(milestone => ({ kind: milestone.kind, achievedAt: milestone.achievedAt })),
            calibrations: calibrations.map(calibration => ({
                takenAt: calibration.takenAt,
                range: Object.values(calibration.fingers).map(finger => rangePercent(finger.open, finger.fist)),
            })),
        };
    },
});

export const setTargets = mutation({
    args: { patientID: v.id("patients"), targets: targetsValidator },
    handler: async (ctx, args) =>
    {
        const clinician = await requireRole(ctx, "clinician");
        await ownedPatient(ctx, clinician._id, args.patientID);
        const valid = Object.values(args.targets).every(value => Number.isInteger(value) && value >= 20 && value <= 100);
        if (!valid)
        {
            throw new ConvexError("INVALID_TARGETS");
        }
        await ctx.db.patch(args.patientID, { targets: args.targets });
        return null;
    },
});

export const pins = query({
    args: {},
    handler: async (ctx) =>
    {
        const clinician = await userWithRole(ctx, "clinician");
        if (!clinician)
        {
            return null;
        }
        const pending = await ctx.db.query("linkPins").withIndex("by_clinicianID_status", query => query.eq("clinicianID", clinician._id).eq("status", "pending")).collect();
        const now = Date.now();
        return pending
            .filter(pin => pin.expiresAt > now)
            .sort((first, second) => second._creationTime - first._creationTime)
            .map(pin => ({ code: pin.code, label: pin.label, createdAt: pin._creationTime, expiresAt: pin.expiresAt }));
    },
});

function randomCode(): string
{
    const values = crypto.getRandomValues(new Uint32Array(1));
    return ((values[0] ?? 0) % 1_000_000).toString().padStart(6, "0");
}

export const createPin = mutation({
    args: { label: v.string() },
    handler: async (ctx, args) =>
    {
        const clinician = await requireRole(ctx, "clinician");
        const label = args.label.trim().replace(/\s+/g, " ").slice(0, 60);
        const open = await ctx.db.query("linkPins").withIndex("by_clinicianID_status", query => query.eq("clinicianID", clinician._id).eq("status", "pending")).collect();
        if (open.length >= 50)
        {
            throw new ConvexError("TOO_MANY_PINS");
        }
        for (let attempt = 0; attempt < 20; attempt++)
        {
            const code = randomCode();
            const taken = await ctx.db.query("linkPins").withIndex("by_code_status", query => query.eq("code", code).eq("status", "pending")).first();
            if (!taken && !/^(\d)\1{5}$/.test(code))
            {
                const expiresAt = Date.now() + PIN_DAYS * DAY;
                await ctx.db.insert("linkPins", { clinicianID: clinician._id, code, label, expiresAt, status: "pending" });
                return { code, label, expiresAt };
            }
        }
        throw new ConvexError("PIN_UNAVAILABLE");
    },
});

export const revokePin = mutation({
    args: { code: v.string() },
    handler: async (ctx, { code }) =>
    {
        const clinician = await requireRole(ctx, "clinician");
        const pin = await ctx.db.query("linkPins").withIndex("by_code_status", query => query.eq("code", code).eq("status", "pending")).first();
        if (!pin || pin.clinicianID !== clinician._id)
        {
            throw new ConvexError("NOT_FOUND");
        }
        await ctx.db.patch(pin._id, { status: "revoked" });
        return null;
    },
});
