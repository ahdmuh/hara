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
    "../../convex/Clinician.ts": () => import("../../convex/Clinician"),
    "../../convex/Admin.ts": () => import("../../convex/Admin"),
};

type Role = "clinician" | "maintainer" | "patient";

let world: ReturnType<typeof convexTest>;

async function user(role: Role, passwordChangeRequired = false): Promise<string>
{
    return await world.run(async context => await context.db.insert("users", { name: role, email: `${role}${Math.random()}@clinic.example`, role, passwordChangeRequired }));
}

async function patientOf(clinicianID: string): Promise<string>
{
    return await world.run(async (context) =>
    {
        const userID = await context.db.insert("users", { name: "Patient", role: "patient", passwordChangeRequired: false });
        return await context.db.insert("patients", { userID, clinicianID: clinicianID as never, birthday: "1960-01-01" });
    });
}

function as(userID: string)
{
    return world.withIdentity({ subject: userID });
}

beforeEach(() =>
{
    world = convexTest(schema, modules);
});

describe("patient data", () =>
{
    test("a clinician sees only their own linked patients", async () =>
    {
        const mine = await user("clinician");
        const other = await user("clinician");
        const myPatient = await patientOf(mine);
        const otherPatient = await patientOf(other);

        const list = await as(mine).query(api.Clinician.patients, {});

        expect(list?.map(patient => patient.id)).toEqual([myPatient as never]);
        expect(await as(mine).query(api.Clinician.patient, { patientID: otherPatient })).toBeNull();
    });

    test("signed-out callers, admins and clinicians who still need a new password get nothing", async () =>
    {
        const clinician = await user("clinician");
        const patient = await patientOf(clinician);
        const admin = await user("maintainer");
        const pending = await user("clinician", true);

        expect(await world.query(api.Clinician.patients, {})).toBeNull();
        expect(await as(admin).query(api.Clinician.patient, { patientID: patient })).toBeNull();
        expect(await as(pending).query(api.Clinician.patients, {})).toBeNull();
    });

    test("a clinician cannot change an unlinked patient's targets", async () =>
    {
        const mine = await user("clinician");
        const otherPatient = await patientOf(await user("clinician"));

        await expect(as(mine).mutation(api.Clinician.setTargets, {
            patientID: otherPatient as never,
            targets: { rangeOfMotion: 50, strength: 50, speed: 50 },
        })).rejects.toThrow();
    });
});

describe("link pins", () =>
{
    test("a clinician cannot revoke another clinician's pin", async () =>
    {
        const owner = await user("clinician");
        const intruder = await user("clinician");
        const pin = await as(owner).mutation(api.Clinician.createPin, { label: "Jordan" });

        await expect(as(intruder).mutation(api.Clinician.revokePin, { code: pin.code })).rejects.toThrow();
        expect(await as(intruder).query(api.Clinician.pins, {})).toEqual([]);
        expect(await as(owner).query(api.Clinician.pins, {})).toHaveLength(1);
    });
});

describe("admin data", () =>
{
    test("only an admin can list clinicians", async () =>
    {
        const admin = await user("maintainer");
        const clinician = await user("clinician");

        expect(await as(admin).query(api.Admin.clinicians, {})).toHaveLength(1);
        expect(await as(clinician).query(api.Admin.clinicians, {})).toBeNull();
    });
});
