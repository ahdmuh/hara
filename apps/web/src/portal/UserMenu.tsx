import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { ChevronDown, Logout } from "../ui/Icons";
import { EASE, SPRING } from "../ui/Motion";
import { useSignOut, type IAccount } from "./Auth";
import styles from "./UserMenu.module.css";

interface IUserMenuProps
{
    account: IAccount;
    children?: (close: () => void) => ReactNode;
}

export default function UserMenu({ account, children }: IUserMenuProps)
{
    const [open, setOpen] = useState(false);
    const signOut = useSignOut();
    const root = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if (!open)
        {
            return;
        }
        function outside(event: PointerEvent): void
        {
            if (!root.current?.contains(event.target as Node))
            {
                setOpen(false);
            }
        }
        function escape(event: KeyboardEvent): void
        {
            if (event.key === "Escape")
            {
                setOpen(false);
            }
        }
        window.addEventListener("pointerdown", outside);
        window.addEventListener("keydown", escape);
        return () =>
        {
            window.removeEventListener("pointerdown", outside);
            window.removeEventListener("keydown", escape);
        };
    }, [open]);

    const close = () => setOpen(false);

    return (
        <div ref={root} className={styles.menu}>
            <button
                type="button"
                className={`${styles.trigger} ${open ? styles.open : ""}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account Menu for ${account.name}`}
                onClick={() => setOpen(value => !value)}
            >
                <Avatar name={account.name} size={34} />
                <motion.span className={styles.chevron} animate={{ rotate: open ? 180 : 0 }} transition={SPRING}>
                    <ChevronDown />
                </motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        className={styles.panel}
                        role="menu"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: EASE } }}
                        exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.16, ease: EASE } }}
                    >
                        <div className={styles.who}>
                            <Avatar name={account.name} size={40} />
                            <span>
                                <strong>{account.name}</strong>
                                <small>{account.email}</small>
                            </span>
                        </div>
                        <div className={styles.actions}>
                            {children?.(close)}
                            <Button
                                variant="light"
                                icon={<Logout />}
                                role="menuitem"
                                onClick={() => void signOut()}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
