import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const fingerCalibration = v.object({
    open: v.number(),
    relaxed: v.number(),
    fist: v.number(),
    forceZero: v.number(),
    forceMaximum: v.number(),
    tapRate: v.optional(v.number()),
});

export const role = v.union(v.literal("patient"), v.literal("clinician"), v.literal("maintainer"));

export const game = v.union(v.literal("rangeOfMotion"), v.literal("strength"), v.literal("speed"));

export const milestoneKind = v.union(
    v.literal("linked"),
    v.literal("first"),
    v.literal("sessions10"),
    v.literal("sessions25"),
    v.literal("sessions50"),
    v.literal("difficulty"),
    v.literal("range"),
    v.literal("strength"),
    v.literal("speed"),
);

export const targets = v.object({ rangeOfMotion: v.number(), strength: v.number(), speed: v.number() });

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        role,
        passwordChangeRequired: v.boolean(),
        lastActiveAt: v.optional(v.number()),
        addedBy: v.optional(v.id("users")),
    })
        .index("by_email", ["email"])
        .index("by_role", ["role"]),

    patients: defineTable({
        userID: v.id("users"),
        clinicianID: v.optional(v.id("users")),
        birthday: v.string(),
        targets: v.optional(targets),
    })
        .index("by_userID", ["userID"])
        .index("by_clinicianID", ["clinicianID"]),

    sessions: defineTable({
        patientID: v.id("patients"),
        localID: v.string(),
        game,
        startedAt: v.number(),
        endedAt: v.number(),
        score: v.number(),
        fingers: v.optional(v.array(v.number())),
    })
        .index("by_patientID_startedAt", ["patientID", "startedAt"])
        .index("by_localID", ["localID"]),

    milestones: defineTable({
        patientID: v.id("patients"),
        kind: milestoneKind,
        achievedAt: v.number(),
    })
        .index("by_patientID_achievedAt", ["patientID", "achievedAt"]),

    calibrations: defineTable({
        patientID: v.id("patients"),
        localID: v.string(),
        takenAt: v.number(),
        fingers: v.object({
            thumb: fingerCalibration,
            index: fingerCalibration,
            middle: fingerCalibration,
            ring: fingerCalibration,
            pinky: fingerCalibration,
        }),
    })
        .index("by_patientID_takenAt", ["patientID", "takenAt"])
        .index("by_localID", ["localID"]),

    limits: defineTable({
        key: v.string(),
        windowStart: v.number(),
        count: v.number(),
    })
        .index("by_key", ["key"]),

    linkPins: defineTable({
        clinicianID: v.id("users"),
        code: v.string(),
        label: v.string(),
        expiresAt: v.number(),
        status: v.union(v.literal("pending"), v.literal("used"), v.literal("revoked")),
        usedBy: v.optional(v.id("patients")),
    })
        .index("by_code_status", ["code", "status"])
        .index("by_clinicianID_status", ["clinicianID", "status"]),
});
