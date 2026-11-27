import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Dialog.module.css";
import { Close } from "./Icons";
import { EASE } from "./Motion";

interface IDialogProps
{
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export default function Dialog({ open, title, onClose, children }: IDialogProps)
{
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if (!open)
        {
            return;
        }
        const previous = document.activeElement as HTMLElement | null;
        panel.current?.focus();
        function handle(event: KeyboardEvent): void
        {
            if (event.key === "Escape")
            {
                onClose();
            }
        }
        window.addEventListener("keydown", handle);
        document.body.style.overflow = "hidden";
        return () =>
        {
            window.removeEventListener("keydown", handle);
            document.body.style.overflow = "";
            previous?.focus();
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    onPointerDown={(event) =>
                    {
                        if (event.target === event.currentTarget)
                        {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        ref={panel}
                        className={styles.panel}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        tabIndex={-1}
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } }}
                        exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2, ease: EASE } }}
                    >
                        <header className={styles.head}>
                            <h2>{title}</h2>
                            <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
                                <Close />
                            </button>
                        </header>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
