import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { userWithRole } from "./Access";
import { fingerCalibration, game, milestoneKind } from "./schema";

const MAXIMUM_BATCH = 100;

const hand = v.object({
    thumb: fingerCalibration,
    index: fingerCalibration,
    middle: fingerCalibration,
    ring: fingerCalibration,
    pinky: fingerCalibration,
});

const session = v.object({
    localID: v.string(),
    game,
    startedAt: v.number(),
    endedAt: v.number(),
    score: v.number(),
    fingers: v.array(v.number()),
});

export const upload = mutation({
    args: {
        sessions: v.array(session),
        calibrations: v.array(v.object({ localID: v.string(), takenAt: v.number(), fingers: hand })),
        milestones: v.array(v.object({ localID: v.string(), kind: milestoneKind, achievedAt: v.number() })),
    },
    returns: v.object({ sessions: v.array(v.string()), calibrations: v.array(v.string()), milestones: v.array(v.string()) }),
    handler: async (ctx, args) =>
    {
        const user = await userWithRole(ctx, "patient");
        const patient = user ? await ctx.db.query("patients").withIndex("by_userID", query => query.eq("userID", user._id)).unique() : null;
        if (!patient)
        {
            throw new ConvexError("FORBIDDEN");
        }
        if (args.sessions.length > MAXIMUM_BATCH || args.calibrations.length > MAXIMUM_BATCH || args.milestones.length > MAXIMUM_BATCH)
        {
            throw new ConvexError("TOO_MANY");
        }
        const accepted = { sessions: [] as string[], calibrations: [] as string[], milestones: [] as string[] };
        for (const entry of args.sessions)
        {
            const existing = await ctx.db.query("sessions").withIndex("by_localID", query => query.eq("localID", entry.localID)).first();
            if (existing && existing.patientID !== patient._id)
            {
                continue;
            }
            if (!existing)
            {
                await ctx.db.insert("sessions", { patientID: patient._id, ...entry, fingers: entry.fingers.slice(0, 5) });
            }
            accepted.sessions.push(entry.localID);
        }
        for (const calibration of args.calibrations)
        {
            const existing = await ctx.db.query("calibrations").withIndex("by_localID", query => query.eq("localID", calibration.localID)).first();
            if (existing && existing.patientID !== patient._id)
            {
                continue;
            }
            if (!existing)
            {
                await ctx.db.insert("calibrations", { patientID: patient._id, ...calibration });
            }
            accepted.calibrations.push(calibration.localID);
        }
        const earned = new Set((await ctx.db.query("milestones").withIndex("by_patientID_achievedAt", query => query.eq("patientID", patient._id)).collect()).map(milestone => milestone.kind));
        for (const milestone of args.milestones)
        {
            if (!earned.has(milestone.kind))
            {
                await ctx.db.insert("milestones", { patientID: patient._id, kind: milestone.kind, achievedAt: milestone.achievedAt });
                earned.add(milestone.kind);
            }
            accepted.milestones.push(milestone.localID);
        }
        return accepted;
    },
});
