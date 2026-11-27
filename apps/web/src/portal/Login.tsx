import { useSignInWithUsernamePassword } from "@convex-dev/auth/methods/username-password/react";
import { normalizeEmail, PASSWORD_RULES } from "@hara/accounts";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
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
import { homeFor, useAccount, useSignOut } from "./Auth";
import styles from "./Login.module.css";

type FieldName = "email" | "password" | "current" | "newPassword" | "confirmation";

const EMPTY: Record<FieldName, string> = { email: "", password: "", current: "", newPassword: "", confirmation: "" };

export default function Login()
{
    const toast = useToast();
    const { loading, account } = useAccount();
    const { signIn } = useSignInWithUsernamePassword(api.auth);
    const changePassword = useMutation(api.Accounts.changePassword);
    const signOut = useSignOut();
    const [temporary, setTemporary] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [invalid, setInvalid] = useState<FieldName[]>([]);
    const [values, setValues] = useState(EMPTY);
    const setup = account?.passwordChangeRequired === true;

    useEffect(() =>
    {
        if (account && !account.passwordChangeRequired)
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

    function fail(title: string, message: string, fields: FieldName[]): void
    {
        toast.error(title, message);
        setInvalid(fields);
        setAttempt(value => value + 1);
    }

    async function submitSignIn(): Promise<void>
    {
        const email = normalizeEmail(values.email);
        if (!email || !values.password)
        {
            fail("Missing Details", "Enter your email and password.", [!email ? "email" : "password"]);
            return;
        }
        const result = await signIn({ username: email, password: values.password });
        if (result.status === "complete")
        {
            setTemporary(values.password);
            setValues(EMPTY);
            return;
        }
        setValues(current => ({ ...current, password: "" }));
        const error = result.userError.error;
        if (error === "RATE_LIMITED")
        {
            fail("Too Many Attempts", "Wait a minute before trying again.", []);
        }
        else if (error === "OTHER_ERROR")
        {
            fail("Could Not Sign In", "Check your connection and try again.", []);
        }
        else
        {
            fail("Incorrect Email or Password", "Check your details and try again.", ["email", "password"]);
        }
    }

    async function submitSetup(): Promise<void>
    {
        const current = temporary ?? values.current;
        if (values.newPassword !== values.confirmation)
        {
            fail("Passwords Do Not Match", "Enter the same new password twice.", ["confirmation"]);
            return;
        }
        try
        {
            const result = await changePassword({ currentPassword: current, newPassword: values.newPassword });
            if (result.status === "complete")
            {
                setValues(EMPTY);
                setTemporary(null);
                toast.success("Password Set", "Your account is ready.");
                return;
            }
            if (result.error === "INVALID_CREDENTIALS")
            {
                setTemporary(null);
                fail("Temporary Password Incorrect", "Enter the temporary password from your email.", ["current"]);
            }
            else if (result.error === "RATE_LIMITED")
            {
                fail("Too Many Attempts", "Wait a minute before trying again.", []);
            }
            else
            {
                fail("Password Too Weak", "Meet every requirement listed below the field.", ["newPassword"]);
            }
        }
        catch
        {
            fail("Could Not Save", "Check your connection and try again.", []);
        }
    }

    async function submit(event: FormEvent): Promise<void>
    {
        event.preventDefault();
        if (busy)
        {
            return;
        }
        setBusy(true);
        await (setup ? submitSetup() : submitSignIn());
        setBusy(false);
    }

    const isInvalid = (key: FieldName) => invalid.includes(key);
    const email = account?.email ?? "";

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
                        {!loading && (
                            <motion.form
                                key={setup ? "setup" : "signIn"}
                                className={styles.form}
                                onSubmit={submit}
                                noValidate
                                variants={STAGGER}
                                initial="hidden"
                                animate="shown"
                                exit="gone"
                            >
                                {setup
                                    ? (
                                            <>
                                                <motion.h1 variants={RISE}>Set Your Password</motion.h1>
                                                <motion.p variants={RISE} className={styles.note}>
                                                    Replace your temporary password before continuing.
                                                </motion.p>
                                                <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
                                                {temporary === null && (
                                                    <motion.div variants={RISE}>
                                                        <Field
                                                            label="Temporary Password"
                                                            name="current"
                                                            type="password"
                                                            autoComplete="current-password"
                                                            icon={<Lock />}
                                                            invalid={isInvalid("current")}
                                                            shake={attempt}
                                                            value={values.current}
                                                            onChange={event => update("current", event.target.value)}
                                                            autoFocus
                                                        />
                                                    </motion.div>
                                                )}
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
                                                        autoFocus={temporary !== null}
                                                    />
                                                </motion.div>
                                                <motion.ul variants={RISE} className={styles.rules} aria-label="Password Requirements">
                                                    {PASSWORD_RULES.map((rule) =>
                                                    {
                                                        const met = values.newPassword.length > 0 && rule.passes(values.newPassword, email);
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
                                        )
                                    : (
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
                                        )}
                                <motion.div variants={RISE}>
                                    <Button type="submit" size="large" busy={busy} iconAfter={<ArrowRight />} className={styles.submit}>
                                        {setup ? "Set Password" : "Sign In"}
                                    </Button>
                                </motion.div>
                                {setup && (
                                    <motion.button variants={RISE} type="button" className={styles.switch} onClick={() => void signOut()}>
                                        Use a Different Account
                                    </motion.button>
                                )}
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
