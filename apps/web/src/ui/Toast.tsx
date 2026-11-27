import { AnimatePresence, motion } from "motion/react";
import { Check, Close, WarningDiamond } from "./Icons";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { EASE } from "./Motion";
import styles from "./Toast.module.css";

type Tone = "error" | "success";

interface IToast
{
    id: number;
    tone: Tone;
    title: string;
    message?: string;
}

interface IToastApi
{
    error: (title: string, message?: string) => void;
    success: (title: string, message?: string) => void;
}

const TOAST_MILLISECONDS = 5000;
const MAXIMUM_TOASTS = 3;

const ToastContext = createContext<IToastApi | null>(null);

export function useToast(): IToastApi
{
    const api = useContext(ToastContext);
    if (!api)
    {
        throw new Error("useToast needs a ToastProvider.");
    }
    return api;
}

export function ToastProvider({ children }: { children: ReactNode })
{
    const [toasts, setToasts] = useState<IToast[]>([]);
    const nextID = useRef(0);
    const timers = useRef(new Map<number, number>());

    const dismiss = useCallback((id: number) =>
    {
        window.clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts(current => current.filter(toast => toast.id !== id));
    }, []);

    const push = useCallback((tone: Tone, title: string, message?: string) =>
    {
        const id = nextID.current++;
        setToasts(current => [...current.filter(toast => toast.title !== title), { id, tone, title, message }].slice(-MAXIMUM_TOASTS));
        timers.current.set(id, window.setTimeout(() => dismiss(id), TOAST_MILLISECONDS));
    }, [dismiss]);

    const api = useMemo<IToastApi>(() => ({
        error: (title, message) => push("error", title, message),
        success: (title, message) => push("success", title, message),
    }), [push]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ol className={styles.stack} aria-live="assertive">
                <AnimatePresence initial={false}>
                    {toasts.map(toast => (
                        <motion.li
                            key={toast.id}
                            layout
                            className={`${styles.toast} ${styles[toast.tone]}`}
                            role={toast.tone === "error" ? "alert" : "status"}
                            initial={{ opacity: 0, y: -24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } }}
                            exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.22, ease: EASE } }}
                        >
                            <span className={styles.icon} aria-hidden="true">
                                {toast.tone === "error" ? <WarningDiamond /> : <Check />}
                            </span>
                            <span className={styles.text}>
                                <strong>{toast.title}</strong>
                                {toast.message && <span>{toast.message}</span>}
                            </span>
                            <button className={styles.close} type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
                                <Close />
                            </button>
                            <span className={styles.timer} style={{ animationDuration: `${TOAST_MILLISECONDS}ms` }} />
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ol>
        </ToastContext.Provider>
    );
}
