import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import Field from "../ui/Field";
import { Mail, Search, Send, User, UserPlus } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import styles from "./Admin.module.css";
import { fullDate, relative } from "./Format";
import { now } from "./MockData";
import Shell from "./Shell";

type Status = "active" | "invited";

interface IClinician
{
    id: string;
    name: string;
    email: string;
    status: Status;
    addedAt: number;
    lastActiveAt?: number;
}

const DAY = 86_400_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SEED: [string, Status, number, number?][] = [
    ["Dr. Amara Okafor", "active", 120, 1],
    ["Dr. Daniel Chen", "active", 96, 3],
    ["Grace Moreau", "active", 88, 0],
    ["Dr. Hiro Tanaka", "active", 61, 9],
    ["Priya Kaur", "invited", 4],
    ["Samuel Fischer", "active", 40, 2],
    ["Dr. Elena Vargas", "invited", 1],
];

function seed(): IClinician[]
{
    return SEED.map(([name, status, addedDaysAgo, activeDaysAgo], index) => ({
        id: `C${100 + index}`,
        name,
        email: `${name.replace(/^Dr\.\s+/, "").toLowerCase().replace(/\s+/g, ".")}@clinic.example`,
        status,
        addedAt: now() - addedDaysAgo * DAY,
        lastActiveAt: activeDaysAgo === undefined ? undefined : now() - activeDaysAgo * DAY,
    }));
}

function wait(): Promise<void>
{
    return new Promise(resolve => window.setTimeout(resolve, 600));
}

type Pending = { kind: "reset" | "resend"; clinician: IClinician } | null;

function Clinicians({ inviting, setInviting }: { inviting: boolean; setInviting: (open: boolean) => void })
{
    const toast = useToast();
    const [clinicians, setClinicians] = useState(seed);
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

    async function invite(event: FormEvent): Promise<void>
    {
        event.preventDefault();
        const name = form.name.trim();
        const email = form.email.trim().toLowerCase();
        const problems = [name.length < 2 ? "name" : "", EMAIL_PATTERN.test(email) ? "" : "email"].filter(Boolean);
        if (clinicians.some(clinician => clinician.email === email))
        {
            problems.push("email");
            toast.error("Clinician Already Added", "That email already has an account.");
        }
        else if (problems.length)
        {
            toast.error("Check the Details", "Enter a full name and a valid email.");
        }
        if (problems.length)
        {
            setInvalid(problems);
            setAttempt(value => value + 1);
            return;
        }
        setBusy(true);
        await wait();
        setBusy(false);
        setClinicians(current => [{ id: `C${100 + current.length}`, name, email, status: "invited", addedAt: Date.now() }, ...current]);
        toast.success("Invitation Sent", `${email} will receive a temporary password.`);
        closeInvite();
    }

    async function confirm(): Promise<void>
    {
        if (!pending)
        {
            return;
        }
        setBusy(true);
        await wait();
        setBusy(false);
        toast.success(pending.kind === "reset" ? "Reset Email Sent" : "Invitation Sent Again", pending.clinician.email);
        setPending(null);
    }

    return (
        <div className={styles.admin}>
            <div className={styles.head}>
                <h1>
                    Clinicians
                    <span className={styles.count}>{clinicians.length}</span>
                </h1>
                <div className={styles.tools}>
                    <label className={styles.search}>
                        <Search />
                        <input type="search" placeholder="Search by name or email" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search Clinicians" />
                    </label>
                    <Button icon={<UserPlus />} onClick={() => setInviting(true)}>Add Clinician</Button>
                </div>
            </div>
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
            {visible.length === 0 && <p className={styles.empty}>No clinicians match your search.</p>}
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
                        ? `${pending.clinician.name} will get an email with a link to choose a new password.`
                        : `${pending?.clinician.name ?? ""} will get a new temporary password, and the old one stops working.`}
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
            role="admin"
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
