import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Close, Login, Menu } from "../ui/Icons";
import { useEffect, useState, type MouseEvent } from "react";
import { portalHref } from "../Site";
import { LinkButton } from "../ui/Button";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import styles from "./Header.module.css";

const ITEM = { hidden: { opacity: 0, y: -8 }, shown: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } } };

const SHEET_CLOSE_MILLISECONDS = 320;

const LINKS = [
    { href: "#about", label: "About" },
    { href: "#games", label: "Games" },
    { href: "#take-part", label: "Take Part" },
    { href: "#team", label: "Team" },
];

function goTo(event: MouseEvent<HTMLAnchorElement>, href: string, delay = 0): void
{
    const target = document.getElementById(href.slice(1));
    if (!target)
    {
        return;
    }
    event.preventDefault();
    window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), delay);
}

export default function Header()
{
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    const [branded, setBranded] = useState(false);

    useMotionValueEvent(scrollY, "change", value => setScrolled(value > 24));

    useEffect(() =>
    {
        const title = document.getElementById("hero-title");
        if (!title)
        {
            return;
        }
        const observer = new IntersectionObserver(([entry]) => setBranded(!!entry && !entry.isIntersecting && entry.boundingClientRect.top < 0), { rootMargin: "-72px 0px 0px 0px" });
        observer.observe(title);
        return () => observer.disconnect();
    }, []);

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
                <motion.a
                    className={styles.brand}
                    href="#top"
                    aria-label="HARA, Back to Top"
                    aria-hidden={!branded}
                    tabIndex={branded ? 0 : -1}
                    initial={false}
                    animate={branded ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.9 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    style={{ pointerEvents: branded ? "auto" : "none" }}
                >
                    <Wordmark />
                </motion.a>
                <nav className={styles.links} aria-label="Sections">
                    {LINKS.map(link => (
                        <a key={link.href} href={link.href} className={styles.link} onClick={event => goTo(event, link.href)}>{link.label}</a>
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
                                    <a
                                        href={link.href}
                                        onClick={(event) =>
                                        {
                                            setOpen(false);
                                            goTo(event, link.href, SHEET_CLOSE_MILLISECONDS);
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.nav>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
