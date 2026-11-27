import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import handPoster from "../assets/shared/hara-hand.jpg";
import handVideo from "../assets/shared/hara-hand.mp4";
import { navigate } from "../Router";
import { siteHref } from "../Site";
import Button, { LinkButton } from "../ui/Button";
import Field from "../ui/Field";
import { ArrowLeft, ArrowRight, Check, Lock, Mail } from "../ui/Icons";
import { EASE, RISE, STAGGER } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import Wordmark from "../ui/Wordmark";
import { completeSetup, homeFor, signIn, useAccount, type SignInResult } from "./Auth";
import styles from "./Login.module.css";
import { PASSWORD_RULES } from "./Password";

type FieldName = "email" | "password" | "newPassword" | "confirmation";

export default function Login()
{
    const toast = useToast();
    const account = useAccount();
    const [setupEmail, setSetupEmail] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [invalid, setInvalid] = useState<FieldName[]>([]);
    const [values, setValues] = useState<Record<FieldName, string>>({ email: "", password: "", newPassword: "", confirmation: "" });

    useEffect(() =>
    {
        if (account)
        {
            toast.clear();
            navigate(homeFor(account), { replace: true });
        }
    }, [account, toast]);

    function update(key: FieldName, value: string): void
    {
        setValues(current => ({ ...current, [key]: value }));
        setInvalid(current => current.filter(entry => entry !== key));
    }

    function fail(result: Extract<SignInResult, { status: "error" }>, fields: FieldName[]): void
    {
        toast.error(result.title, result.message);
        setInvalid(fields);
        setAttempt(value => value + 1);
    }

    async function submit(event: FormEvent): Promise<void>
    {
        event.preventDefault();
        if (busy)
        {
            return;
        }
        setBusy(true);
        if (setupEmail === null)
        {
            const result = await signIn(values.email, values.password);
            setBusy(false);
            if (result.status === "setup")
            {
                setSetupEmail(result.email);
                setValues(current => ({ ...current, password: "" }));
                setInvalid([]);
            }
            else if (result.status === "error")
            {
                setValues(current => ({ ...current, password: "" }));
                fail(result, ["email", "password"]);
            }
            return;
        }
        const result = await completeSetup(setupEmail, values.newPassword, values.confirmation);
        setBusy(false);
        if (result.status === "error")
        {
            fail(result, result.title === "Passwords Do Not Match" ? ["confirmation"] : ["newPassword"]);
        }
        else
        {
            setValues({ email: "", password: "", newPassword: "", confirmation: "" });
            toast.success("Password Set", "Your account is ready.");
        }
    }

    const isInvalid = (key: FieldName) => invalid.includes(key);

    return (
        <div className={styles.page}>
            <motion.aside
                className={styles.screen}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: EASE }}
            >
                <video className={styles.video} src={handVideo} poster={handPoster} autoPlay muted loop playsInline aria-hidden="true" />
                <Wordmark className={styles.wordmark} animate delay={0.2} />
            </motion.aside>
            <main className={styles.panel}>
                <LinkButton to={siteHref("/")} variant="ghost" size="small" icon={<ArrowLeft />} className={styles.back}>Home</LinkButton>
                <div className={styles.card}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.form
                            key={setupEmail === null ? "signIn" : "setup"}
                            className={styles.form}
                            onSubmit={submit}
                            noValidate
                            variants={STAGGER}
                            initial="hidden"
                            animate="shown"
                            exit="gone"
                        >
                            {setupEmail === null
                                ? (
                                        <>
                                            <motion.h1 variants={RISE}>Sign In</motion.h1>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Email"
                                                    name="email"
                                                    type="email"
                                                    inputMode="email"
                                                    autoComplete="username"
                                                    spellCheck={false}
                                                    icon={<Mail />}
                                                    invalid={isInvalid("email")}
                                                    shake={attempt}
                                                    value={values.email}
                                                    onChange={event => update("email", event.target.value)}
                                                    autoFocus
                                                />
                                            </motion.div>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    icon={<Lock />}
                                                    invalid={isInvalid("password")}
                                                    shake={attempt}
                                                    value={values.password}
                                                    onChange={event => update("password", event.target.value)}
                                                />
                                            </motion.div>
                                        </>
                                    )
                                : (
                                        <>
                                            <motion.h1 variants={RISE}>Set Your Password</motion.h1>
                                            <motion.p variants={RISE} className={styles.note}>
                                                Replace your temporary password before continuing.
                                            </motion.p>
                                            <input type="email" name="email" autoComplete="username" value={setupEmail} readOnly hidden />
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="New Password"
                                                    name="newPassword"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    icon={<Lock />}
                                                    invalid={isInvalid("newPassword")}
                                                    shake={attempt}
                                                    value={values.newPassword}
                                                    onChange={event => update("newPassword", event.target.value)}
                                                    autoFocus
                                                />
                                            </motion.div>
                                            <motion.ul variants={RISE} className={styles.rules} aria-label="Password Requirements">
                                                {PASSWORD_RULES.map((rule) =>
                                                {
                                                    const met = values.newPassword.length > 0 && rule.passes(values.newPassword, setupEmail);
                                                    return (
                                                        <li key={rule.id} className={met ? styles.met : ""}>
                                                            <span className={styles.tick} aria-hidden="true"><Check /></span>
                                                            <span>{rule.label}</span>
                                                            <span className="srOnly">{met ? "Met" : "Not Met"}</span>
                                                        </li>
                                                    );
                                                })}
                                            </motion.ul>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Confirm Password"
                                                    name="confirmation"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    icon={<Lock />}
                                                    invalid={isInvalid("confirmation")}
                                                    shake={attempt}
                                                    value={values.confirmation}
                                                    onChange={event => update("confirmation", event.target.value)}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                            <motion.div variants={RISE}>
                                <Button type="submit" size="large" busy={busy} iconAfter={<ArrowRight />} className={styles.submit}>
                                    {setupEmail === null ? "Sign In" : "Set Password"}
                                </Button>
                            </motion.div>
                        </motion.form>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
