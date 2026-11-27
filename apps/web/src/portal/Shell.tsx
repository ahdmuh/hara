import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Link, navigate } from "../Router";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import { homeFor, useAccount, type IAccount, type Role } from "./Auth";
import styles from "./Shell.module.css";
import UserMenu from "./UserMenu";

interface IShellProps
{
    role: Role;
    home: string;
    page: string;
    menu?: (close: () => void) => ReactNode;
    children: (account: IAccount) => ReactNode;
}

export default function Shell({ role, home, page, menu, children }: IShellProps)
{
    const account = useAccount();
    const allowed = account?.role === role;

    useEffect(() =>
    {
        if (!account)
        {
            navigate("/login", { replace: true });
        }
        else if (!allowed)
        {
            navigate(homeFor(account), { replace: true });
        }
    }, [account, allowed]);

    if (!account || !allowed)
    {
        return null;
    }

    return (
        <div className={styles.shell}>
            <motion.header
                className={styles.bar}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
            >
                <Link to={home} className={styles.brand} aria-label="Home">
                    <Wordmark />
                </Link>
                <UserMenu account={account}>{menu}</UserMenu>
            </motion.header>
            <AnimatePresence mode="wait">
                <motion.main
                    key={page}
                    className={styles.main}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } }}
                >
                    {children(account)}
                </motion.main>
            </AnimatePresence>
        </div>
    );
}
