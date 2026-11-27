import { isEmail, normalizeEmail } from "@hara/accounts";
import { useAction, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import Field from "../ui/Field";
import { Mail, Search, Send, User, UserPlus } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import styles from "./Admin.module.css";
import { fullDate, relative } from "./Format";
import Shell from "./Shell";

type IClinician = NonNullable<FunctionReturnType<typeof api.Admin.clinicians>>[number];

const FAILURES: Record<string, [string, string]> = {
    EMAIL_TAKEN: ["Clinician Already Added", "That email already has an account."],
    INVALID: ["Check the Details", "Enter a full name and a valid email."],
    EMAIL_FAILED: ["Email Not Sent", "The account is ready, but the email failed. Use Resend Invitation."],
    FORBIDDEN: ["Not Allowed", "Sign in again and retry."],
    NOT_FOUND: ["Clinician Not Found", "Refresh the page and try again."],
};

const EMPTY_TRANSITION = { duration: 0.4, ease: EASE };

type Pending = { kind: "reset" | "resend"; clinician: IClinician } | null;

function Clinicians({ inviting, setInviting }: { inviting: boolean; setInviting: (open: boolean) => void })
{
    const toast = useToast();
    const data = useQuery(api.Admin.clinicians);
    const clinicians = useMemo(() => data ?? [], [data]);
    const addClinician = useAction(api.Admin.addClinician);
    const resetClinician = useAction(api.Admin.resetClinician);
    const [query, setQuery] = useState("");
    const deferred = useDeferredValue(query);
    const [pending, setPending] = useState<Pending>(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ name: "", email: "" });
    const [invalid, setInvalid] = useState<string[]>([]);
    const [attempt, setAttempt] = useState(0);

    const visible = useMemo(() =>
    {
        const needle = deferred.trim().toLowerCase();
        return clinicians.filter(clinician => !needle || `${clinician.name} ${clinician.email}`.toLowerCase().includes(needle));
    }, [clinicians, deferred]);

    function closeInvite(): void
    {
        setInviting(false);
        setForm({ name: "", email: "" });
        setInvalid([]);
    }

    function failure(error: string): void
    {
        const [title, message] = FAILURES[error] ?? ["Something Went Wrong", "Try again in a moment."];
        toast.error(title, message);
    }

    async function invite(event: FormEvent): Promise<void>
    {
        event.preventDefault();
        if (busy)
        {
            return;
        }
        const name = form.name.trim();
        const email = normalizeEmail(form.email);
        const problems = [name.length < 2 ? "name" : "", isEmail(email) ? "" : "email"].filter(Boolean);
        if (problems.length)
        {
            toast.error("Check the Details", "Enter a full name and a valid email.");
            setInvalid(problems);
            setAttempt(value => value + 1);
            return;
        }
        setBusy(true);
        try
        {
            const result = await addClinician({ name, email });
            if (result.status === "complete")
            {
                toast.success("Invitation Sent", `${email} will receive a temporary password.`);
                closeInvite();
            }
            else
            {
                failure(result.error);
                if (result.error === "EMAIL_TAKEN")
                {
                    setInvalid(["email"]);
                    setAttempt(value => value + 1);
                }
                if (result.error === "EMAIL_FAILED")
                {
                    closeInvite();
                }
            }
        }
        catch
        {
            failure("");
        }
        setBusy(false);
    }

    async function confirm(): Promise<void>
    {
        if (!pending || busy)
        {
            return;
        }
        setBusy(true);
        try
        {
            const result = await resetClinician({ userID: pending.clinician.id });
            if (result.status === "complete")
            {
                toast.success(pending.kind === "reset" ? "Reset Email Sent" : "Invitation Sent Again", pending.clinician.email);
                setPending(null);
            }
            else
            {
                failure(result.error);
            }
        }
        catch
        {
            failure("");
        }
        setBusy(false);
    }

    return (
        <div className={styles.admin}>
            <div className={styles.head}>
                <h1>
                    Clinicians
                    {clinicians.length > 0 && <span className={styles.count}>{clinicians.length}</span>}
                </h1>
                <div className={styles.tools}>
                    <label className={styles.search}>
                        <Search />
                        <input type="search" placeholder="Search clinicians" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search Clinicians" />
                    </label>
                    <Button icon={<UserPlus />} onClick={() => setInviting(true)}>Add Clinician</Button>
                </div>
            </div>
            {visible.length > 0 && (
                <ul className={styles.list}>
                    <AnimatePresence initial={false}>
                        {visible.map(clinician => (
                            <motion.li
                                key={clinician.id}
                                layout
                                className={styles.row}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                            >
                                <span className={styles.person}>
                                    <Avatar name={clinician.name} size={40} />
                                    <span>
                                        <strong>{clinician.name}</strong>
                                        <small>{clinician.email}</small>
                                    </span>
                                </span>
                                <span className={`${styles.status} ${styles[clinician.status]}`}>
                                    <i aria-hidden="true" />
                                    {clinician.status === "active" ? "Active" : "Invited"}
                                </span>
                                <span className={styles.meta}>
                                    <small>Added</small>
                                    {fullDate(clinician.addedAt)}
                                </span>
                                <span className={styles.meta}>
                                    <small>Last Active</small>
                                    {clinician.lastActiveAt === undefined ? "Not Yet" : relative(clinician.lastActiveAt)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="small"
                                    icon={clinician.status === "active" ? <Mail /> : <Send />}
                                    onClick={() => setPending({ kind: clinician.status === "active" ? "reset" : "resend", clinician })}
                                >
                                    {clinician.status === "active" ? "Send Password Reset" : "Resend Invitation"}
                                </Button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}
            {data !== undefined && clinicians.length === 0 && (
                <motion.div className={styles.empty} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={EMPTY_TRANSITION}>
                    <strong>No Clinicians Yet</strong>
                    <p>Add a clinician to send them an invitation with a temporary password.</p>
                    <Button icon={<UserPlus />} onClick={() => setInviting(true)}>Add Clinician</Button>
                </motion.div>
            )}
            {clinicians.length > 0 && visible.length === 0 && <p className={styles.none}>No clinicians match your search.</p>}
            <Dialog open={inviting} title="Add Clinician" onClose={closeInvite}>
                <form className={styles.form} onSubmit={invite} noValidate>
                    <p className={styles.note}>They receive an email with a temporary password and set their own when they first sign in.</p>
                    <Field
                        label="Full Name"
                        icon={<User />}
                        autoComplete="off"
                        invalid={invalid.includes("name")}
                        shake={attempt}
                        value={form.name}
                        onChange={(event) =>
                        {
                            setForm(current => ({ ...current, name: event.target.value }));
                            setInvalid(current => current.filter(entry => entry !== "name"));
                        }}
                        autoFocus
                    />
                    <Field
                        label="Email"
                        type="email"
                        icon={<Mail />}
                        autoComplete="off"
                        spellCheck={false}
                        invalid={invalid.includes("email")}
                        shake={attempt}
                        value={form.email}
                        onChange={(event) =>
                        {
                            setForm(current => ({ ...current, email: event.target.value }));
                            setInvalid(current => current.filter(entry => entry !== "email"));
                        }}
                    />
                    <div className={styles.actions}>
                        <Button type="button" variant="ghost" onClick={closeInvite}>Cancel</Button>
                        <Button type="submit" icon={<Send />} busy={busy}>Send Invitation</Button>
                    </div>
                </form>
            </Dialog>
            <Dialog open={pending !== null} title={pending?.kind === "reset" ? "Send Password Reset" : "Resend Invitation"} onClose={() => setPending(null)}>
                <p className={styles.note}>
                    {pending?.kind === "reset"
                        ? `${pending.clinician.name} will get a temporary password by email and be signed out everywhere until they choose a new one.`
                        : `${pending?.clinician.name ?? ""} will get a new invitation with a fresh temporary password, and the old one stops working.`}
                </p>
                <div className={styles.actions}>
                    <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
                    <Button icon={<Send />} busy={busy} onClick={() => void confirm()}>Send Email</Button>
                </div>
            </Dialog>
        </div>
    );
}

export default function Admin()
{
    const [inviting, setInviting] = useState(false);
    return (
        <Shell
            role="maintainer"
            home="/admin"
            page="/admin"
            menu={close => (
                <Button
                    icon={<UserPlus />}
                    role="menuitem"
                    onClick={() =>
                    {
                        close();
                        setInviting(true);
                    }}
                >
                    Add Clinician
                </Button>
            )}
        >
            {() => <Clinicians inviting={inviting} setInviting={setInviting} />}
        </Shell>
    );
}
