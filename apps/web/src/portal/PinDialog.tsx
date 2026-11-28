import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { Check, Close, Copy, Key, Mail } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import { useAccount } from "./Auth";
import { fullDate, relative } from "./Format";
import { formatPin, inviteMessage, VALID_DAYS, type ILinkPin } from "./Links";
import styles from "./PinDialog.module.css";

const CONFIRM_MILLISECONDS = 3000;

export default function PinDialog({ open, onClose }: { open: boolean; onClose: () => void })
{
    const toast = useToast();
    const { account } = useAccount();
    const pending = useQuery(api.Clinician.pins) ?? [];
    const createPin = useMutation(api.Clinician.createPin);
    const revokePin = useMutation(api.Clinician.revokePin);
    const [busy, setBusy] = useState(false);
    const [created, setCreated] = useState<ILinkPin | null>(null);
    const [confirming, setConfirming] = useState<string | null>(null);

    function close(): void
    {
        setCreated(null);
        setConfirming(null);
        onClose();
    }

    async function create(event: FormEvent): Promise<void>
    {
        event.preventDefault();
        if (busy)
        {
            return;
        }
        setBusy(true);
        try
        {
            setCreated(await createPin({}));
        }
        catch
        {
            toast.error("Could Not Create Code", "Try again in a moment.");
        }
        setBusy(false);
    }

    async function copy(text: string, title: string): Promise<void>
    {
        try
        {
            await navigator.clipboard.writeText(text);
            toast.success(title);
        }
        catch
        {
            toast.error("Could Not Copy", "Select the text and copy it manually.");
        }
    }

    async function revoke(code: string): Promise<void>
    {
        if (confirming !== code)
        {
            setConfirming(code);
            window.setTimeout(() => setConfirming(current => (current === code ? null : current)), CONFIRM_MILLISECONDS);
            return;
        }
        setConfirming(null);
        try
        {
            await revokePin({ code });
        }
        catch
        {
            toast.error("Could Not Revoke Code", "Try again in a moment.");
            return;
        }
        if (created?.code === code)
        {
            setCreated(null);
        }
        toast.success("Code Revoked", "It can no longer be used to link.");
    }

    const message = created ? inviteMessage(created, account?.name ?? "your clinician", fullDate(created.expiresAt)) : "";

    return (
        <Dialog open={open} title="Link a New Patient" onClose={close}>
            <p className={styles.note}>
                {`Create a link code for each new patient. They enter it once when signing up in HARA, which links their account to you. A code stays valid until it is used, revoked, or ${VALID_DAYS} days pass.`}
            </p>
            <AnimatePresence mode="wait" initial={false}>
                {created
                    ? (
                            <motion.div
                                key="created"
                                className={styles.created}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
                                exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
                            >
                                <div className={styles.pin} aria-live="polite">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.span
                                            key={created.code}
                                            initial={{ opacity: 0, filter: "blur(6px)" }}
                                            animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: EASE } }}
                                            exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.2 } }}
                                        >
                                            {formatPin(created.code)}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                                <p className={styles.valid}>
                                    {`Valid until ${fullDate(created.expiresAt)}`}
                                </p>
                                <div className={styles.actions}>
                                    <Button variant="ghost" icon={<Copy />} onClick={() => void copy(created.code, "Code Copied")}>Copy Code</Button>
                                    <Button icon={<Mail />} onClick={() => void copy(message, "Message Copied")}>Copy Message</Button>
                                </div>
                                <button type="button" className={styles.another} onClick={() => setCreated(null)}>Create Another Code</button>
                            </motion.div>
                        )
                    : (
                            <motion.form
                                key="form"
                                className={styles.form}
                                onSubmit={event => void create(event)}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
                                exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
                            >
                                <Button type="submit" icon={<Key />} busy={busy}>Create Code</Button>
                            </motion.form>
                        )}
            </AnimatePresence>
            <section className={styles.pending}>
                <h3>Pending Codes</h3>
                {pending.length === 0
                    ? <p className={styles.none}>No codes are waiting to be used.</p>
                    : (
                            <ul>
                                <AnimatePresence initial={false}>
                                    {pending.map(pin => (
                                        <motion.li
                                            key={pin.code}
                                            layout
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: EASE }}
                                        >
                                            <span className={styles.row}>
                                                <span className={styles.code}>{formatPin(pin.code)}</span>
                                                <span className={styles.meta}>
                                                    <strong>{`Created ${relative(pin.createdAt)}`}</strong>
                                                    <small>{`Until ${fullDate(pin.expiresAt)}`}</small>
                                                </span>
                                                <button type="button" className={styles.icon} aria-label={`Copy code ${pin.code}`} onClick={() => void copy(pin.code, "Code Copied")}>
                                                    <Copy />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.revoke} ${confirming === pin.code ? styles.confirm : ""}`}
                                                    aria-label={confirming === pin.code ? `Confirm revoking code ${pin.code}` : `Revoke code ${pin.code}`}
                                                    onClick={() => void revoke(pin.code)}
                                                >
                                                    {confirming === pin.code ? <Check /> : <Close />}
                                                    <span>{confirming === pin.code ? "Revoke" : ""}</span>
                                                </button>
                                            </span>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
            </section>
        </Dialog>
    );
}
