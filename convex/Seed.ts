import { normalizeEmail } from "@hara/accounts";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

const DAY = 86_400_000;
const FIRST = ["Amara", "Benjamin", "Chloe", "Daniel", "Elena", "Farid", "Grace", "Hiro", "Isla", "Jonah", "Keira", "Liam", "Maya", "Noah", "Priya", "Rosa"];
const LAST = ["Abbott", "Bennett", "Chen", "Dubois", "Evans", "Fischer", "Garcia", "Haddad", "Kaur", "Lambert", "Moreau", "Okafor", "Patel", "Rossi"];
const GAMES = ["rangeOfMotion", "strength", "speed"] as const;
const MAXIMUM = { rangeOfMotion: 100, strength: 20, speed: 6 };

function random(seed: number): () => number
{
    let state = seed >>> 0;
    return () =>
    {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

export const demoPatients = internalMutation({
    args: { clinicianEmail: v.string(), count: v.number(), confirm: v.literal("development") },
    handler: async (ctx, args) =>
    {
        const clinician = await ctx.db.query("users").withIndex("by_email", query => query.eq("email", normalizeEmail(args.clinicianEmail))).unique();
        if (!clinician || clinician.role !== "clinician")
        {
            throw new ConvexError("NOT_A_CLINICIAN");
        }
        const now = Date.now();
        for (let index = 0; index < Math.min(args.count, 300); index++)
        {
            const next = random(index * 7919 + 17);
            const name = `${FIRST[Math.floor(next() * FIRST.length)]} ${LAST[Math.floor(next() * LAST.length)]}`;
            const userID = await ctx.db.insert("users", { name, role: "patient", passwordChangeRequired: false });
            const birthday = new Date(now - (35 + Math.floor(next() * 45)) * 365.25 * DAY).toISOString().slice(0, 10);
            const patientID = await ctx.db.insert("patients", { userID, clinicianID: clinician._id, birthday });
            const linkedDaysAgo = 20 + Math.floor(next() * 140);
            const idleDays = next() < 0.18 ? 8 + Math.floor(next() * 25) : Math.floor(next() * 4);
            const recovery = next() < 0.2 ? -(0.15 + next() * 0.3) : 0.4 + next() * 0.9;
            const start = { rangeOfMotion: 30 + next() * 25, strength: 3 + next() * 4, speed: 1 + next() * 1.2 };
            const gain = { rangeOfMotion: 45, strength: 9, speed: 2.6 };
            const bias = Array.from({ length: 5 }, () => 0.75 + next() * 0.5);
            const milestones: Pick<Doc<"milestones">, "kind" | "achievedAt">[] = [{ kind: "linked", achievedAt: now - linkedDaysAgo * DAY }];
            let count = 0;
            for (let day = linkedDaysAgo; day > idleDays; day -= 1 + Math.floor(next() * 3))
            {
                const progress = Math.min(1, ((linkedDaysAgo - day) / 120) * recovery);
                const game = GAMES[Math.floor(next() * GAMES.length)] ?? "speed";
                const base = start[game] + progress * gain[game];
                const startedAt = now - day * DAY + Math.floor(next() * 8) * 3_600_000;
                const fingers = bias.map(value => Math.round(Math.min(MAXIMUM[game], Math.max(0, base * value)) * 10) / 10);
                await ctx.db.insert("sessions", {
                    patientID,
                    localID: `seed-${patientID}-${count}`,
                    game,
                    startedAt,
                    endedAt: startedAt + ([10, 10, 20, 30][Math.floor(next() * 4)] ?? 10) * 60_000,
                    score: Math.round(400 + Math.max(0, progress) * 1800 + next() * 400),
                    fingers,
                });
                count++;
                if (count === 1)
                {
                    milestones.push({ kind: "first", achievedAt: startedAt });
                }
                if (count === 10 || count === 25 || count === 50)
                {
                    milestones.push({ kind: `sessions${count}`, achievedAt: startedAt });
                }
                if (game === "rangeOfMotion" && Math.min(...fingers) > 60 && !milestones.some(entry => entry.kind === "range"))
                {
                    milestones.push({ kind: "range", achievedAt: startedAt });
                }
            }
            for (const milestone of milestones)
            {
                await ctx.db.insert("milestones", { patientID, ...milestone });
            }
            for (let day = linkedDaysAgo; day > idleDays; day -= 21 + Math.floor(next() * 14))
            {
                const progress = Math.min(1, ((linkedDaysAgo - day) / 120) * recovery);
                const span = (start.rangeOfMotion + progress * gain.rangeOfMotion) / 100;
                const finger = (value: number) => ({
                    open: 100,
                    relaxed: 300,
                    fist: Math.round(100 + 923 * Math.min(1, span * value)),
                    forceZero: 20,
                    forceMaximum: 220,
                });
                await ctx.db.insert("calibrations", {
                    patientID,
                    localID: `seed-${patientID}-calibration-${day}`,
                    takenAt: now - day * DAY,
                    fingers: {
                        thumb: finger(bias[0] ?? 1),
                        index: finger(bias[1] ?? 1),
                        middle: finger(bias[2] ?? 1),
                        ring: finger(bias[3] ?? 1),
                        pinky: finger(bias[4] ?? 1),
                    },
                });
            }
        }
        return null;
    },
});
