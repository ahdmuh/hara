import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { bridge } from "./Bridge";

const SYNC_MILLISECONDS = 30_000;
const BATCH = 100;

export function useSync(owner: string | null, nudge: number): void
{
    const { isAuthenticated } = useConvexAuth();
    const upload = useMutation(api.Sync.upload);

    useEffect(() =>
    {
        if (!owner || !isAuthenticated)
        {
            return;
        }
        let running = false;
        const run = async () =>
        {
            if (running || !navigator.onLine)
            {
                return;
            }
            running = true;
            try
            {
                const pending = await bridge.unsynced(owner);
                const sessions = pending.sessions.filter(session => session.endedAt !== null).slice(0, BATCH);
                const calibrations = pending.calibrations.slice(0, BATCH);
                const milestones = pending.milestones.slice(0, BATCH);
                if (!sessions.length && !calibrations.length && !milestones.length)
                {
                    return;
                }
                const accepted = await upload({
                    sessions: sessions.map(session => ({
                        localID: session.id,
                        game: session.game,
                        startedAt: session.startedAt,
                        endedAt: session.endedAt ?? session.startedAt,
                        score: session.score,
                        fingers: session.fingers,
                    })),
                    calibrations: calibrations.map(calibration => ({
                        localID: calibration.id,
                        takenAt: calibration.takenAt,
                        fingers: calibration.fingers,
                    })),
                    milestones: milestones.map(milestone => ({ localID: milestone.id, kind: milestone.kind, achievedAt: milestone.achievedAt })),
                });
                await Promise.all([
                    bridge.markSynced("sessions", accepted.sessions),
                    bridge.markSynced("calibrations", accepted.calibrations),
                    bridge.markSynced("milestones", accepted.milestones),
                ]);
            }
            catch
            {
                return;
            }
            finally
            {
                running = false;
            }
        };
        void run();
        const timer = window.setInterval(() => void run(), SYNC_MILLISECONDS);
        const online = () => void run();
        window.addEventListener("online", online);
        return () =>
        {
            window.clearInterval(timer);
            window.removeEventListener("online", online);
        };
    }, [owner, isAuthenticated, upload, nudge]);
}
