import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { FINGERS, type HandCalibration } from "@hara/input";
import { SessionStore, type IDatabase } from "./SessionStore";

const FINGER = { open: 100, relaxed: 300, fist: 900, forceZero: 20, forceMaximum: 220 };
const CALIBRATION = Object.fromEntries(FINGERS.map(finger => [finger, FINGER])) as HandCalibration;

let database: Database;
let time: number;

function open(): SessionStore
{
    return new SessionStore(database as unknown as IDatabase, () => time);
}

beforeEach(() =>
{
    database = new Database(":memory:");
    time = 1_000;
});

test("gives every session its own id and keeps the final result", () =>
{
    const store = open();
    const first = store.startSession("speed");
    const second = store.startSession("strength");
    time = 61_000;
    store.finishSession(first, 1200, [1, 2, 3, 4, 5]);

    expect(first).not.toBe(second);
    expect(store.sessions().find(session => session.id === first)).toEqual({
        id: first,
        game: "speed",
        startedAt: 1_000,
        endedAt: 61_000,
        score: 1200,
        fingers: [1, 2, 3, 4, 5],
    });
});

test("recovers a session interrupted mid-play from its last checkpoint after a restart", () =>
{
    const store = open();
    const id = store.startSession("rangeOfMotion");
    time = 30_000;
    store.checkpoint(id, 400, [10, 20, 30, 40, 50]);
    time = 90_000;

    const restarted = open();

    expect(restarted.recoverInterrupted()).toBe(1);
    expect(restarted.sessions()[0]).toMatchObject({ id, endedAt: 30_000, score: 400, fingers: [10, 20, 30, 40, 50] });
});

test("records each milestone once and keeps the latest calibration", () =>
{
    const store = open();
    store.saveCalibration(CALIBRATION);
    time = 2_000;
    const latest = store.saveCalibration({ ...CALIBRATION, thumb: { ...CALIBRATION.thumb, fist: 800 } });

    expect(store.recordMilestone("first")).toBe(true);
    expect(store.recordMilestone("first")).toBe(false);
    expect(store.latestCalibration()?.id).toBe(latest);
});

test("offers only finished, unsent records for sync", () =>
{
    const store = open();
    const done = store.startSession("speed");
    store.finishSession(done, 10, []);
    store.startSession("speed");
    store.recordMilestone("first");
    store.markSynced("sessions", [done]);

    const pending = store.unsynced();

    expect(pending.sessions).toEqual([]);
    expect(pending.milestones.map(milestone => milestone.kind)).toEqual(["first"]);
});
