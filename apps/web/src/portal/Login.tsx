import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import handPoster from "../assets/shared/hara-hand.jpg";
import handVideo from "../assets/shared/hara-hand.mp4";
import { navigate } from "../Router";
import { siteHref } from "../Site";
import Button, { LinkButton } from "../ui/Button";
import Field from "../ui/Field";
import { ArrowLeft, ArrowRight, Lock, User } from "../ui/Icons";
import { EASE, RISE, STAGGER } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import Wordmark from "../ui/Wordmark";
import { completeSetup, signIn, useClinician, type SignInResult } from "./Auth";
import styles from "./Login.module.css";

type Step = "signIn" | "setup";

export default function Login()
{
    const toast = useToast();
    const clinician = useClinician();
    const [step, setStep] = useState<Step>("signIn");
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [invalid, setInvalid] = useState<string[]>([]);
    const [values, setValues] = useState({ username: "", password: "", newUsername: "", newPassword: "", confirmation: "" });

    useEffect(() =>
    {
        if (clinician)
        {
            toast.clear();
            navigate("/patients", { replace: true });
        }
    }, [clinician, toast]);

    function update(key: keyof typeof values, value: string): void
    {
        setValues(current => ({ ...current, [key]: value }));
        setInvalid(current => current.filter(entry => entry !== key));
    }

    function fail(result: Extract<SignInResult, { status: "error" }>, fields: string[]): void
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
        if (step === "signIn")
        {
            const result = await signIn(values.username, values.password);
            setBusy(false);
            if (result.status === "setup")
            {
                setStep("setup");
                setInvalid([]);
            }
            else if (result.status === "error")
            {
                fail(result, ["username", "password"]);
            }
            return;
        }
        const result = await completeSetup(values.newUsername, values.newPassword, values.confirmation);
        setBusy(false);
        if (result.status === "error")
        {
            const fields = result.title.startsWith("Username") ? ["newUsername"] : result.title.startsWith("Passwords") ? ["confirmation"] : ["newPassword"];
            fail(result, fields);
        }
        else
        {
            toast.success("Account Ready", "Your username and password are set.");
        }
    }

    const isInvalid = (key: string) => invalid.includes(key);

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
                            key={step}
                            className={styles.form}
                            onSubmit={submit}
                            noValidate
                            variants={STAGGER}
                            initial="hidden"
                            animate="shown"
                            exit="gone"
                        >
                            {step === "signIn"
                                ? (
                                        <>
                                            <motion.h1 variants={RISE}>Sign In</motion.h1>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Username"
                                                    name="username"
                                                    autoComplete="username"
                                                    icon={<User />}
                                                    invalid={isInvalid("username")}
                                                    shake={attempt}
                                                    value={values.username}
                                                    onChange={event => update("username", event.target.value)}
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
                                            <motion.h1 variants={RISE}>Set Up Your Account</motion.h1>
                                            <motion.p variants={RISE} className={styles.note}>
                                                Choose a username and a new password to replace your temporary one.
                                            </motion.p>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Username"
                                                    autoComplete="username"
                                                    icon={<User />}
                                                    invalid={isInvalid("newUsername")}
                                                    shake={attempt}
                                                    value={values.newUsername}
                                                    onChange={event => update("newUsername", event.target.value)}
                                                    autoFocus
                                                />
                                            </motion.div>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="New Password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    icon={<Lock />}
                                                    invalid={isInvalid("newPassword")}
                                                    shake={attempt}
                                                    value={values.newPassword}
                                                    onChange={event => update("newPassword", event.target.value)}
                                                />
                                            </motion.div>
                                            <motion.div variants={RISE}>
                                                <Field
                                                    label="Confirm Password"
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
                                    {step === "signIn" ? "Sign In" : "Save and Continue"}
                                </Button>
                            </motion.div>
                        </motion.form>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
