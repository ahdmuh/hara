import { randomUUID } from "node:crypto";
import type { HandCalibration } from "@hara/input";

export type Game = "rangeOfMotion" | "strength" | "speed";

export type MilestoneKind = "first" | "sessions10" | "sessions25" | "sessions50" | "difficulty" | "range" | "strength" | "speed";

type Value = string | number | null;

export interface IStatement
{
    run(...parameters: Value[]): unknown;
    all(...parameters: Value[]): unknown[];
    get(...parameters: Value[]): unknown;
}

export interface IDatabase
{
    exec(sql: string): void;
    prepare(sql: string): IStatement;
}

export interface ISession
{
    id: string;
    game: Game;
    startedAt: number;
    endedAt: number | null;
    score: number;
    fingers: number[];
}

export interface ICalibrationRecord
{
    id: string;
    takenAt: number;
    fingers: HandCalibration;
}

export interface IMilestone
{
    id: string;
    kind: MilestoneKind;
    achievedAt: number;
}

interface ISessionRow
{
    id: string;
    game: Game;
    started_at: number;
    ended_at: number | null;
    score: number;
    fingers: string;
}

const MIGRATIONS = [
    `CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        game TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        ended_at INTEGER,
        score INTEGER NOT NULL DEFAULT 0,
        fingers TEXT NOT NULL DEFAULT '[]',
        synced_at INTEGER
    );
    CREATE INDEX sessions_started_at ON sessions (started_at);
    CREATE TABLE calibrations (
        id TEXT PRIMARY KEY,
        taken_at INTEGER NOT NULL,
        fingers TEXT NOT NULL,
        synced_at INTEGER
    );
    CREATE TABLE milestones (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL UNIQUE,
        achieved_at INTEGER NOT NULL,
        synced_at INTEGER
    );`,
];

function toSession(row: ISessionRow): ISession
{
    return {
        id: row.id,
        game: row.game,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        score: row.score,
        fingers: JSON.parse(row.fingers) as number[],
    };
}

export class SessionStore
{
    constructor(
        private readonly database: IDatabase,
        private readonly now: () => number = Date.now,
        private readonly newID: () => string = randomUUID,
    )
    {
        this.migrate();
    }

    private migrate(): void
    {
        const { user_version: version } = this.database.prepare("PRAGMA user_version").get() as { user_version: number };
        MIGRATIONS.slice(version).forEach((migration, index) =>
        {
            this.database.exec(`BEGIN; ${migration} PRAGMA user_version = ${version + index + 1}; COMMIT;`);
        });
    }

    startSession(game: Game): string
    {
        const id = this.newID();
        const time = this.now();
        this.database.prepare("INSERT INTO sessions (id, game, started_at, updated_at) VALUES (?, ?, ?, ?)").run(id, game, time, time);
        return id;
    }

    checkpoint(id: string, score: number, fingers: number[]): void
    {
        this.database
            .prepare("UPDATE sessions SET score = ?, fingers = ?, updated_at = ? WHERE id = ? AND ended_at IS NULL")
            .run(score, JSON.stringify(fingers), this.now(), id);
    }

    finishSession(id: string, score: number, fingers: number[]): void
    {
        const time = this.now();
        this.database
            .prepare("UPDATE sessions SET score = ?, fingers = ?, updated_at = ?, ended_at = ? WHERE id = ? AND ended_at IS NULL")
            .run(score, JSON.stringify(fingers), time, time, id);
    }

    recoverInterrupted(): number
    {
        const open = this.database.prepare("SELECT id FROM sessions WHERE ended_at IS NULL").all();
        this.database.prepare("UPDATE sessions SET ended_at = updated_at WHERE ended_at IS NULL").run();
        return open.length;
    }

    saveCalibration(fingers: HandCalibration): string
    {
        const id = this.newID();
        this.database.prepare("INSERT INTO calibrations (id, taken_at, fingers) VALUES (?, ?, ?)").run(id, this.now(), JSON.stringify(fingers));
        return id;
    }

    latestCalibration(): ICalibrationRecord | null
    {
        const row = this.database.prepare("SELECT id, taken_at, fingers FROM calibrations ORDER BY taken_at DESC LIMIT 1").get() as
            | { id: string; taken_at: number; fingers: string }
            | undefined;
        return row ? { id: row.id, takenAt: row.taken_at, fingers: JSON.parse(row.fingers) as HandCalibration } : null;
    }

    recordMilestone(kind: MilestoneKind): boolean
    {
        const existing = this.database.prepare("SELECT id FROM milestones WHERE kind = ?").get(kind);
        if (existing)
        {
            return false;
        }
        this.database.prepare("INSERT INTO milestones (id, kind, achieved_at) VALUES (?, ?, ?)").run(this.newID(), kind, this.now());
        return true;
    }

    sessions(): ISession[]
    {
        const rows = this.database
            .prepare("SELECT id, game, started_at, ended_at, score, fingers FROM sessions ORDER BY started_at DESC")
            .all() as ISessionRow[];
        return rows.map(toSession);
    }

    unsynced(): { sessions: ISession[]; calibrations: ICalibrationRecord[]; milestones: IMilestone[] }
    {
        const sessions = this.database
            .prepare("SELECT id, game, started_at, ended_at, score, fingers FROM sessions WHERE synced_at IS NULL AND ended_at IS NOT NULL")
            .all() as ISessionRow[];
        const calibrations = this.database.prepare("SELECT id, taken_at, fingers FROM calibrations WHERE synced_at IS NULL").all() as {
            id: string;
            taken_at: number;
            fingers: string;
        }[];
        const milestones = this.database.prepare("SELECT id, kind, achieved_at FROM milestones WHERE synced_at IS NULL").all() as {
            id: string;
            kind: MilestoneKind;
            achieved_at: number;
        }[];
        return {
            sessions: sessions.map(toSession),
            calibrations: calibrations.map(row => ({ id: row.id, takenAt: row.taken_at, fingers: JSON.parse(row.fingers) as HandCalibration })),
            milestones: milestones.map(row => ({ id: row.id, kind: row.kind, achievedAt: row.achieved_at })),
        };
    }

    markSynced(table: "sessions" | "calibrations" | "milestones", ids: string[]): void
    {
        const statement = this.database.prepare(`UPDATE ${table} SET synced_at = ? WHERE id = ?`);
        const time = this.now();
        ids.forEach(id => statement.run(time, id));
    }
}
