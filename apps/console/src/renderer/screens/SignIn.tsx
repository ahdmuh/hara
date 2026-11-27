import { isEmail, normalizeEmail } from "@hara/accounts";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useIntent } from "../Intents";
import Hints from "../ui/Hints";
import { EASE } from "../ui/Motion";
import { useShake } from "../ui/Shake";
import { notify } from "../ui/Toast";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./SignUp.module.css";

const STEPS = [
    { id: "account", title: "Enter Your Email", note: "", type: "email", label: "Email" },
    { id: "password", title: "Enter Your Password", note: "", type: "password", label: "Password" },
] as const;

interface ISignInProps
{
    onDone: (id: string, password: string) => Promise<string | null>;
    onBack: () => void;
}

export default function SignIn({ onDone, onBack }: ISignInProps)
{
    const [index, setIndex] = useState(0);
    const [travel, setTravel] = useState(1);
    const [values, setValues] = useState({ account: "", password: "" });
    const [busy, setBusy] = useState(false);
    const [field, shakeField] = useShake<HTMLLabelElement>();
    const step = STEPS[index] ?? STEPS[0];

    function go(next: number): void
    {
        setTravel(next >= index ? 1 : -1);
        setIndex(next);
    }

    function fail(message: string): void
    {
        shakeField();
        notify(message);
    }

    function next(): void
    {
        if (busy)
        {
            return;
        }
        if (step.id === "account")
        {
            if (!isEmail(normalizeEmail(values.account)))
            {
                fail("Enter a Valid Email");
                return;
            }
            go(1);
            return;
        }
        if (!values.password)
        {
            fail("Enter Your Password");
            return;
        }
        setBusy(true);
        void onDone(values.account, values.password).then((message) =>
        {
            setBusy(false);
            if (message)
            {
                setValues(current => ({ ...current, password: "" }));
                fail(message);
            }
        });
    }

    useIntent((intent) =>
    {
        if (busy)
        {
            return false;
        }
        if (intent === "select")
        {
            next();
            return true;
        }
        if (intent === "back")
        {
            if (index === 0)
            {
                onBack();
            }
            else
            {
                go(0);
            }
            return true;
        }
        return false;
    });

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
                <ol className={styles.dots} aria-label="Sign In Steps">
                    {STEPS.map((entry, position) => <li key={entry.id} className={position <= index ? styles.done : ""} />)}
                </ol>
            </div>
            <div className={styles.stage}>
                <AnimatePresence mode="wait" initial={false} custom={travel}>
                    <motion.form
                        key={step.id}
                        className={styles.card}
                        custom={travel}
                        variants={{
                            enter: (sign: number) => ({ opacity: 0, x: sign * 60 }),
                            center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
                            leave: (sign: number) => ({ opacity: 0, x: sign * -60, transition: { duration: 0.2, ease: EASE } }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="leave"
                        onSubmit={(event) =>
                        {
                            event.preventDefault();
                            next();
                        }}
                    >
                        <div className={screen.heading}>
                            <h1>{step.title}</h1>
                            {step.note && <p>{step.note}</p>}
                        </div>
                        <label ref={field} className={styles.field}>
                            <span>{step.label}</span>
                            <input
                                autoFocus
                                type={step.type}
                                maxLength={step.id === "account" ? 254 : 128}
                                autoComplete="off"
                                value={values[step.id]}
                                onChange={event => setValues({ ...values, [step.id]: step.id === "account" ? event.target.value.replace(/\s/g, "") : event.target.value })}
                            />
                        </label>
                    </motion.form>
                </AnimatePresence>
            </div>
            <div className={screen.foot}>
                <Hints hints={[{ finger: "middle", key: "Enter", label: index === 0 ? "Continue" : "Sign In" }, { finger: "thumb", key: "Esc", label: "Back" }]} />
            </div>
        </div>
    );
}
