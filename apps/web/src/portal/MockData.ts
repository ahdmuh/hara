export const FINGER_NAMES = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;

export type Game = "range" | "strength" | "speed";

export const GAMES: { id: Game; name: string; unit: string; maximum: number; digits: number }[] = [
    { id: "range", name: "Range of Motion", unit: "%", maximum: 100, digits: 0 },
    { id: "strength", name: "Strength", unit: "N", maximum: 20, digits: 1 },
    { id: "speed", name: "Speed", unit: "taps/s", maximum: 6, digits: 1 },
];

export const GAME_INFO = Object.fromEntries(GAMES.map(game => [game.id, game])) as Record<Game, (typeof GAMES)[number]>;

export interface ISession
{
    id: string;
    date: number;
    game: Game;
    minutes: number;
    score: number;
    fingers: number[];
}

export interface IMilestone
{
    date: number;
    title: string;
}

export interface ICalibration
{
    date: number;
    range: number[];
    force: number[];
}

export interface IPatient
{
    id: string;
    name: string;
    age: number;
    linkedAt: number;
    sessions: ISession[];
    milestones: IMilestone[];
    calibrations: ICalibration[];
    targets: Record<Game, number>;
}

const FIRST = [
    "Amara",
    "Benjamin",
    "Chloe",
    "Daniel",
    "Elena",
    "Farid",
    "Grace",
    "Hiro",
    "Isla",
    "Jonah",
    "Keira",
    "Liam",
    "Maya",
    "Noah",
    "Olivia",
    "Priya",
    "Quinn",
    "Rosa",
    "Samuel",
    "Tara",
    "Uma",
    "Victor",
    "Wen",
    "Xavier",
    "Yara",
    "Zane",
    "Aisha",
    "Bruno",
    "Celine",
    "Dmitri",
];
const LAST = [
    "Abbott",
    "Bennett",
    "Chen",
    "Dubois",
    "Evans",
    "Fischer",
    "Garcia",
    "Haddad",
    "Ivanova",
    "Jensen",
    "Kaur",
    "Lambert",
    "Moreau",
    "Nakamura",
    "Okafor",
    "Patel",
    "Quintero",
    "Rossi",
    "Singh",
    "Tanaka",
    "Usman",
    "Vargas",
    "Walsh",
    "Xu",
    "Young",
    "Zimmerman",
];

const DAY = 86_400_000;
const PATIENT_COUNT = 248;
const NOW = new Date(2026, 10, 26, 16).getTime();

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

function pick<T>(values: readonly T[], next: () => number): T
{
    return values[Math.floor(next() * values.length)] as T;
}

function round(value: number, digits: number): number
{
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function buildPatient(index: number): IPatient
{
    const next = random(index * 7919 + 17);
    const linkedDaysAgo = 14 + Math.floor(next() * 150);
    const linkedAt = NOW - linkedDaysAgo * DAY;
    const idleDays = next() < 0.18 ? 8 + Math.floor(next() * 30) : Math.floor(next() * 5);
    const recovery = 0.4 + next() * 0.9;
    const start = { range: 30 + next() * 25, strength: 3 + next() * 4, speed: 1 + next() * 1.2 };
    const fingerBias = FINGER_NAMES.map(() => 0.75 + next() * 0.5);
    const sessions: ISession[] = [];
    let day = linkedDaysAgo;
    while (day > idleDays)
    {
        const progress = Math.min(1, ((linkedDaysAgo - day) / 120) * recovery);
        const game = pick(["range", "strength", "speed"] as const, next);
        const base = game === "range" ? start.range + progress * 45 : game === "strength" ? start.strength + progress * 9 : start.speed + progress * 2.6;
        const maximum = GAMES.find(entry => entry.id === game)?.maximum ?? 1;
        const fingers = fingerBias.map(bias => round(Math.min(maximum, Math.max(0, base * bias + (next() - 0.5) * maximum * 0.06)), 1));
        sessions.push({
            id: `${index}-${sessions.length}`,
            date: NOW - day * DAY + Math.floor(next() * 8) * 3_600_000,
            game,
            minutes: pick([10, 10, 20, 30], next),
            score: Math.round(400 + progress * 1800 + next() * 400),
            fingers,
        });
        day -= 1 + Math.floor(next() * 3);
    }
    const milestones: IMilestone[] = [{ date: linkedAt, title: "Linked to Clinician" }];
    if (sessions[0])
    {
        milestones.push({ date: sessions[0].date, title: "First Session" });
    }
    [10, 25, 50].forEach((count) =>
    {
        const session = sessions[count - 1];
        if (session)
        {
            milestones.push({ date: session.date, title: `${count} Sessions` });
        }
    });
    sessions.filter(session => session.game === "speed" && session.score > 1500).slice(0, 1).forEach((session) =>
    {
        milestones.push({ date: session.date, title: "Unlocked Medium Difficulty" });
    });
    sessions.filter(session => session.game === "range" && Math.min(...session.fingers) > 60).slice(0, 1).forEach((session) =>
    {
        milestones.push({ date: session.date, title: "Range of Motion Above 60%" });
    });
    milestones.sort((first, second) => second.date - first.date);
    const calibrations: ICalibration[] = [];
    for (let calibrationDay = linkedDaysAgo; calibrationDay > idleDays; calibrationDay -= 21 + Math.floor(next() * 14))
    {
        const progress = Math.min(1, ((linkedDaysAgo - calibrationDay) / 120) * recovery);
        calibrations.push({
            date: NOW - calibrationDay * DAY,
            range: fingerBias.map(bias => Math.round(Math.min(100, (start.range + progress * 45) * bias))),
            force: fingerBias.map(bias => round(Math.min(20, (start.strength + progress * 9) * bias), 1)),
        });
    }
    calibrations.reverse();
    return {
        id: `P${1000 + index}`,
        name: `${pick(FIRST, next)} ${pick(LAST, next)}`,
        age: 34 + Math.floor(next() * 50),
        linkedAt,
        sessions: sessions.reverse(),
        milestones,
        calibrations,
        targets: { range: 70, strength: 60, speed: 80 },
    };
}

let cache: IPatient[] | null = null;

export function patients(): IPatient[]
{
    cache ??= Array.from({ length: PATIENT_COUNT }, (_, index) => buildPatient(index));
    return cache;
}

export function saveTargets(id: string, targets: Record<Game, number>): void
{
    const patient = findPatient(id);
    if (patient)
    {
        patient.targets = targets;
    }
}

export function findPatient(id: string): IPatient | undefined
{
    return patients().find(patient => patient.id === id);
}

export function now(): number
{
    return NOW;
}

export function average(values: number[]): number
{
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function latest(patient: IPatient, game: Game): ISession | undefined
{
    return patient.sessions.find(session => session.game === game);
}

export function trend(patient: IPatient, game: Game, count = 12): number[]
{
    return patient.sessions.filter(session => session.game === game).slice(0, count).reverse().map(session => average(session.fingers));
}
