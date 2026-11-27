import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, matchPath, navigate, usePath } from "../Router";
import Button from "../ui/Button";
import { Key, Logout } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import { signOut, useClinician } from "./Auth";
import PatientDetail from "./PatientDetail";
import PatientList from "./PatientList";
import PinDialog from "./PinDialog";
import styles from "./Portal.module.css";

export default function Portal()
{
    const path = usePath();
    const clinician = useClinician();
    const [pinOpen, setPinOpen] = useState(false);
    const detail = matchPath("/patients/:id", path);

    useEffect(() =>
    {
        if (!clinician)
        {
            navigate("/login", { replace: true });
        }
    }, [clinician]);

    if (!clinician)
    {
        return null;
    }

    const initials = clinician.name.split(" ").map(part => part[0]).join("").slice(0, 2);

    return (
        <div className={styles.portal}>
            <motion.header
                className={styles.bar}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
            >
                <Link to="/patients" className={styles.brand} aria-label="Patients">
                    <Wordmark />
                </Link>
                <div className={styles.actions}>
                    <Button variant="primary" size="small" icon={<Key />} aria-label="Link Patient" onClick={() => setPinOpen(true)}>
                        <span className={styles.wide}>Link Patient</span>
                    </Button>
                    <span className={styles.who}>
                        <span className={styles.avatar} aria-hidden="true">{initials}</span>
                        <span className={styles.name}>{clinician.name}</span>
                    </span>
                    <Button
                        variant="light"
                        size="small"
                        icon={<Logout />}
                        aria-label="Sign Out"
                        onClick={() =>
                        {
                            signOut();
                            navigate("/login", { replace: true });
                        }}
                    >
                        <span className={styles.wide}>Sign Out</span>
                    </Button>
                </div>
            </motion.header>
            <AnimatePresence mode="wait">
                <motion.main
                    key={path}
                    className={styles.main}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } }}
                >
                    {detail?.id ? <PatientDetail id={detail.id} /> : <PatientList />}
                </motion.main>
            </AnimatePresence>
            <PinDialog open={pinOpen} onClose={() => setPinOpen(false)} />
        </div>
    );
}
