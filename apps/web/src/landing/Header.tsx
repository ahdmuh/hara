import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Close, Login, Menu } from "../ui/Icons";
import { useEffect, useState } from "react";
import { portalHref } from "../Site";
import { LinkButton } from "../ui/Button";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import styles from "./Header.module.css";

const ITEM = { hidden: { opacity: 0, y: -8 }, shown: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } } };

const LINKS = [
    { href: "#about", label: "About" },
    { href: "#games", label: "Games" },
    { href: "#take-part", label: "Take Part" },
    { href: "#team", label: "Team" },
];

export default function Header()
{
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useMotionValueEvent(scrollY, "change", value => setScrolled(value > 24));

    useEffect(() =>
    {
        if (!open)
        {
            return;
        }
        function close(event: KeyboardEvent): void
        {
            if (event.key === "Escape")
            {
                setOpen(false);
            }
        }
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [open]);

    return (
        <motion.header
            className={`${styles.header} ${scrolled || open ? styles.raised : ""}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        >
            <div className={styles.bar}>
                <a className={styles.brand} href="#top" aria-label="HARA, Back to Top">
                    <Wordmark />
                </a>
                <nav className={styles.links} aria-label="Sections">
                    {LINKS.map(link => (
                        <a key={link.href} href={link.href} className={styles.link}>{link.label}</a>
                    ))}
                </nav>
                <div className={styles.actions}>
                    <LinkButton to={portalHref("/login")} variant="dark" size="small" icon={<Login />} className={styles.login}>
                        Portal
                    </LinkButton>
                    <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={open}
                        aria-label={open ? "Close Menu" : "Open Menu"}
                        onClick={() => setOpen(value => !value)}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={open ? "close" : "menu"}
                                initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                                transition={{ duration: 0.25, ease: EASE }}
                            >
                                {open ? <Close /> : <Menu />}
                            </motion.span>
                        </AnimatePresence>
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.nav
                        className={styles.sheet}
                        aria-label="Sections"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1, transition: { duration: 0.45, ease: EASE } }}
                        exit={{ height: 0, opacity: 0, transition: { duration: 0.3, ease: EASE } }}
                    >
                        <motion.ul
                            initial="hidden"
                            animate="shown"
                            exit="hidden"
                            variants={{ shown: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
                        >
                            {LINKS.map(link => (
                                <motion.li
                                    key={link.href}
                                    variants={ITEM}
                                >
                                    <a href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
                                </motion.li>
                            ))}
                            <motion.li variants={ITEM}>
                                <LinkButton to={portalHref("/login")} variant="dark" icon={<Login />} className={styles.sheetLogin}>
                                    Portal
                                </LinkButton>
                            </motion.li>
                        </motion.ul>
                    </motion.nav>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
