import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Link, navigate, scrollToTop } from "../Router";
import Button from "../ui/Button";
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
    action?: { label: string; icon: ReactNode; onClick: () => void };
    children: (account: IAccount) => ReactNode;
}

export default function Shell({ role, home, page, action, children }: IShellProps)
{
    const { loading, account } = useAccount();
    const allowed = account?.role === role && !account.passwordChangeRequired;

    useEffect(() =>
    {
        if (loading)
        {
            return;
        }
        if (!account)
        {
            navigate("/login", { replace: true });
        }
        else if (!allowed)
        {
            navigate(homeFor(account), { replace: true });
        }
    }, [loading, account, allowed]);

    if (loading || !account || !allowed)
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
                <UserMenu account={account} />
            </motion.header>
            <AnimatePresence mode="wait" onExitComplete={scrollToTop}>
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
            {action && (
                <motion.div
                    className={styles.action}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, delay: 0.3, ease: EASE } }}
                >
                    <Button size="large" icon={action.icon} onClick={action.onClick}>{action.label}</Button>
                </motion.div>
            )}
        </div>
    );
}
