import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { navigate } from "../Router";
import styles from "./Button.module.css";
import { PRESS } from "./Motion";

type Variant = "primary" | "dark" | "ghost" | "light";

interface IButtonProps extends Omit<HTMLMotionProps<"button">, "children">
{
    variant?: Variant;
    size?: "small" | "medium" | "large";
    icon?: ReactNode;
    iconAfter?: ReactNode;
    busy?: boolean;
    children?: ReactNode;
}

export default function Button({ variant = "primary", size = "medium", icon, iconAfter, busy = false, children, className, disabled, ...rest }: IButtonProps)
{
    const classes = [styles.button, styles[variant], styles[size], busy ? styles.busy : "", className ?? ""].join(" ");
    return (
        <motion.button className={classes} whileTap={disabled || busy ? undefined : PRESS} disabled={disabled || busy} aria-busy={busy} {...rest}>
            <span className={styles.content}>
                {icon}
                {children}
                {iconAfter}
            </span>
            <span className={styles.spinner} aria-hidden="true" />
        </motion.button>
    );
}

interface ILinkButtonProps extends Omit<HTMLMotionProps<"a">, "children">
{
    to: string;
    variant?: Variant;
    size?: "small" | "medium" | "large";
    icon?: ReactNode;
    iconAfter?: ReactNode;
    children?: ReactNode;
}

export function LinkButton({ to, variant = "primary", size = "medium", icon, iconAfter, children, className, onClick, ...rest }: ILinkButtonProps)
{
    const classes = [styles.button, styles[variant], styles[size], className ?? ""].join(" ");
    const external = /^(https?:|mailto:)/.test(to);
    const anchor = to.startsWith("#");
    return (
        <motion.a
            className={classes}
            href={to}
            whileTap={PRESS}
            onClick={(event) =>
            {
                onClick?.(event);
                if (!external && !anchor && !event.defaultPrevented && !event.metaKey && !event.ctrlKey)
                {
                    event.preventDefault();
                    navigate(to);
                }
            }}
            {...rest}
        >
            <span className={styles.content}>
                {icon}
                {children}
                {iconAfter}
            </span>
        </motion.a>
    );
}
