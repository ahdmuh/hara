import { motion, useAnimate } from "motion/react";
import { useEffect, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Field.module.css";
import { Eye, EyeOff } from "./Icons";

interface IFieldProps extends InputHTMLAttributes<HTMLInputElement>
{
    label: string;
    invalid?: boolean;
    shake?: number;
    icon?: ReactNode;
}

export default function Field({ label, invalid = false, shake = 0, icon, type = "text", className, ...rest }: IFieldProps)
{
    const id = useId();
    const [visible, setVisible] = useState(false);
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const password = type === "password";

    useEffect(() =>
    {
        if (invalid && shake > 0)
        {
            void animate(scope.current, { x: [0, -5, 5, -3, 3, 0] }, { duration: 0.4 });
        }
    }, [shake, invalid, animate, scope]);

    return (
        <div className={`${styles.field} ${invalid ? styles.invalid : ""} ${className ?? ""}`}>
            <label htmlFor={id}>{label}</label>
            <motion.div ref={scope} className={styles.control}>
                {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
                <input id={id} type={password && visible ? "text" : type} aria-invalid={invalid} {...rest} />
                {password && (
                    <button
                        type="button"
                        className={styles.reveal}
                        aria-label={visible ? "Hide Password" : "Show Password"}
                        onClick={() => setVisible(value => !value)}
                    >
                        {visible ? <EyeOff /> : <Eye />}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
