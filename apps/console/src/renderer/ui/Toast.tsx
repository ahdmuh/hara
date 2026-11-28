import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import { Check, InfoBox, WarningDiamond } from "./Icons";
import { sounds } from "../Sounds";
import { SPRING } from "./Motion";
import styles from "./Toast.module.css";

type Tone = "error" | "info" | "success";

interface IToast
{
    id: number;
    message: string;
    tone: Tone;
    nudge: number;
}

const SHOW_MILLISECONDS = 3200;
const MAXIMUM_TOASTS = 3;

let toasts: IToast[] = [];
let nextID = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, number>();

function publish(next: IToast[]): void
{
    toasts = next;
    listeners.forEach(listener => listener());
}

function dismiss(id: number): void
{
    window.clearTimeout(timers.get(id));
    timers.delete(id);
    publish(toasts.filter(toast => toast.id !== id));
}

function schedule(id: number): void
{
    window.clearTimeout(timers.get(id));
    timers.set(id, window.setTimeout(() => dismiss(id), SHOW_MILLISECONDS));
}

export function notify(message: string, tone: Tone = "error"): void
{
    if (tone === "error")
    {
        sounds.play("error");
    }
    const existing = toasts.find(toast => toast.message === message);
    if (existing)
    {
        publish(toasts.map(toast => toast.id === existing.id ? { ...toast, nudge: toast.nudge + 1 } : toast));
        schedule(existing.id);
        return;
    }
    const toast = { id: nextID++, message, tone, nudge: 0 };
    publish([...toasts, toast].slice(-MAXIMUM_TOASTS));
    schedule(toast.id);
}

function Toast({ toast }: { toast: IToast })
{
    const [scope, animate] = useAnimate<HTMLSpanElement>();
    const Icon = toast.tone === "error" ? WarningDiamond : toast.tone === "success" ? Check : InfoBox;

    useEffect(() =>
    {
        if (toast.nudge > 0)
        {
            void animate(scope.current, { x: [0, -8, 8, -4, 4, 0] }, { duration: 0.4 });
        }
    }, [toast.nudge, animate, scope]);

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.22 } }}
            transition={SPRING}
            onClick={() => dismiss(toast.id)}
        >
            <span ref={scope} className={`${styles.toast} ${styles[toast.tone]}`} role={toast.tone === "error" ? "alert" : "status"}>
                <span className={styles.icon}><Icon /></span>
                {toast.message}
            </span>
        </motion.li>
    );
}

export default function Toasts()
{
    const current = useSyncExternalStore((listener) =>
    {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, () => toasts);

    return (
        <ol className={styles.stack} aria-live="assertive">
            <AnimatePresence initial={false}>
                {current.map(toast => <Toast key={toast.id} toast={toast} />)}
            </AnimatePresence>
        </ol>
    );
}
