import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const fingerCalibration = v.object({
    open: v.number(),
    relaxed: v.number(),
    fist: v.number(),
    forceZero: v.number(),
    forceMaximum: v.number(),
});

export default defineSchema({
    users: defineTable({
        name: v.string(),
        role: v.union(v.literal("patient"), v.literal("clinician"), v.literal("maintainer")),
    }),

    clinicians: defineTable({
        userID: v.id("users"),
        username: v.optional(v.string()),
        passwordChangeRequired: v.boolean(),
    })
        .index("by_userID", ["userID"])
        .index("by_username", ["username"]),

    patients: defineTable({
        userID: v.id("users"),
        clinicianID: v.id("clinicians"),
        birthday: v.string(),
    })
        .index("by_userID", ["userID"])
        .index("by_clinicianID", ["clinicianID"]),

    sessions: defineTable({
        patientID: v.id("patients"),
        localID: v.string(),
        game: v.union(v.literal("rangeOfMotion"), v.literal("strength"), v.literal("speed")),
        startedAt: v.number(),
        endedAt: v.number(),
        score: v.number(),
    })
        .index("by_patientID_startedAt", ["patientID", "startedAt"])
        .index("by_localID", ["localID"]),

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
});
