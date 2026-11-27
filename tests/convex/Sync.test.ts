import { beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("@convex-dev/auth/server", () => ({
    getAuthUserId: async (context: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) =>
        (await context.auth.getUserIdentity())?.subject ?? null,
}));

const { convexTest } = await import("convex-test");
const { api } = await import("../../convex/_generated/api.js");
const { default: schema } = await import("../../convex/schema");

const modules = {
    "../../convex/_generated/api.js": () => import("../../convex/_generated/api.js"),
    "../../convex/_generated/server.js": () => import("../../convex/_generated/server.js"),
    "../../convex/Sync.ts": () => import("../../convex/Sync"),
};

const FINGER = { open: 100, relaxed: 500, fist: 900, forceZero: 10, forceMaximum: 800 };
const HAND = { thumb: FINGER, index: FINGER, middle: FINGER, ring: FINGER, pinky: FINGER };

let world: ReturnType<typeof convexTest>;

async function patient(): Promise<string>
{
    return await world.run(async (context) =>
    {
        const userID = await context.db.insert("users", { name: "Patient", role: "patient", passwordChangeRequired: false });
        await context.db.insert("patients", { userID, birthday: "1960-01-01" });
        return userID;
    });
}

function batch(score: number)
{
    return {
        sessions: [{ localID: "session-1", game: "speed" as const, startedAt: 1, endedAt: 2, score, fingers: [1, 2, 3, 4, 5] }],
        calibrations: [{ localID: "calibration-1", takenAt: 1, fingers: HAND }],
        milestones: [{ localID: "milestone-1", kind: "first" as const, achievedAt: 2 }],
    };
}

async function counts()
{
    return await world.run(async context => ({
        sessions: (await context.db.query("sessions").collect()).map(session => session.score),
        calibrations: (await context.db.query("calibrations").collect()).length,
        milestones: (await context.db.query("milestones").collect()).length,
    }));
}

beforeEach(() =>
{
    world = convexTest(schema, modules);
});

describe("session sync", () =>
{
    test("syncing the same records twice stores them once and never edits them", async () =>
    {
        const me = world.withIdentity({ subject: await patient() });

        const first = await me.mutation(api.Sync.upload, batch(100));
        const second = await me.mutation(api.Sync.upload, batch(999));

        expect(first).toEqual({ sessions: ["session-1"], calibrations: ["calibration-1"], milestones: ["milestone-1"] });
        expect(second).toEqual(first);
        expect(await counts()).toEqual({ sessions: [100], calibrations: 1, milestones: 1 });
    });

    test("another patient cannot claim or overwrite someone else's records", async () =>
    {
        await world.withIdentity({ subject: await patient() }).mutation(api.Sync.upload, batch(100));

        const result = await world.withIdentity({ subject: await patient() }).mutation(api.Sync.upload, batch(5));

        expect(result.sessions).toEqual([]);
        expect(result.calibrations).toEqual([]);
        expect((await counts()).sessions).toEqual([100]);
    });

    test("only signed-in patients can upload", async () =>
    {
        const clinician = await world.run(async context => await context.db.insert("users", { name: "Clinician", email: "c@clinic.example", role: "clinician", passwordChangeRequired: false }));

        await expect(world.withIdentity({ subject: clinician }).mutation(api.Sync.upload, batch(1))).rejects.toThrow();
        await expect(world.mutation(api.Sync.upload, batch(1))).rejects.toThrow();
    });
});
