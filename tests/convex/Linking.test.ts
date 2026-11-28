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
    "../../convex/Patients.ts": () => import("../../convex/Patients"),
    "../../convex/Clinician.ts": () => import("../../convex/Clinician"),
};

const DAY = 86_400_000;

let world: ReturnType<typeof convexTest>;

async function setup(code: string, expiresIn = 30 * DAY)
{
    return await world.run(async (context) =>
    {
        const clinicianID = await context.db.insert("users", { name: "Clinician", email: "clinician@clinic.example", role: "clinician", passwordChangeRequired: false });
        const userID = await context.db.insert("users", { name: "Avery Morgan", role: "patient", passwordChangeRequired: false });
        const patientID = await context.db.insert("patients", { userID, birthday: "1960-01-01" });
        await context.db.insert("linkPins", { clinicianID, code, expiresAt: Date.now() + expiresIn, status: "pending" });
        return { clinicianID, userID, patientID };
    });
}

beforeEach(() =>
{
    world = convexTest(schema, modules);
});

describe("linking a clinician", () =>
{
    test("a valid code links the patient, uses the code and awards the milestone", async () =>
    {
        const { clinicianID, userID, patientID } = await setup("HK7PM2QX");

        await world.withIdentity({ subject: userID }).action(api.Patients.linkClinician, { code: "hk7p-m2qx" });

        const state = await world.run(async context => ({
            patient: await context.db.get(patientID),
            pins: await context.db.query("linkPins").collect(),
            milestones: await context.db.query("milestones").collect(),
        }));
        expect(state.patient?.clinicianID).toBe(clinicianID);
        expect(state.pins[0]?.status).toBe("used");
        expect(state.milestones.map(milestone => milestone.kind)).toEqual(["linked"]);
        expect(await world.withIdentity({ subject: userID }).query(api.Patients.profile, {})).toEqual({ name: "Avery Morgan", linked: true, email: null, milestones: ["linked"] });
    });

    test("an unknown, malformed or expired code is refused", async () =>
    {
        const { userID } = await setup("HK7PM2QX", -DAY);
        const patient = world.withIdentity({ subject: userID });

        await expect(patient.action(api.Patients.linkClinician, { code: "HK7P-M2QX" })).rejects.toThrow();
        await expect(patient.action(api.Patients.linkClinician, { code: "ZZZZ-ZZZZ" })).rejects.toThrow();
        await expect(patient.action(api.Patients.linkClinician, { code: "123" })).rejects.toThrow();
    });

    test("a code works only once and a linked patient cannot link again", async () =>
    {
        const { userID } = await setup("HK7PM2QX");
        const patient = world.withIdentity({ subject: userID });

        await patient.action(api.Patients.linkClinician, { code: "HK7PM2QX" });

        await expect(patient.action(api.Patients.linkClinician, { code: "HK7PM2QX" })).rejects.toThrow();
    });

    test("code guesses are limited per patient even when they fail", async () =>
    {
        const { userID } = await setup("HK7PM2QX");
        const patient = world.withIdentity({ subject: userID });

        for (let attempt = 0; attempt < 8; attempt++)
        {
            await expect(patient.action(api.Patients.linkClinician, { code: "ZZZZ-ZZZZ" })).rejects.toThrow();
        }

        await expect(patient.action(api.Patients.linkClinician, { code: "HK7PM2QX" })).rejects.toThrow("RATE_LIMITED");
        const pins = await world.run(async context => await context.db.query("linkPins").collect());
        expect(pins[0]?.status).toBe("pending");
    });

    test("only patients can link", async () =>
    {
        const { clinicianID } = await setup("HK7PM2QX");

        await expect(world.withIdentity({ subject: clinicianID }).action(api.Patients.linkClinician, { code: "HK7PM2QX" })).rejects.toThrow();
    });
});
