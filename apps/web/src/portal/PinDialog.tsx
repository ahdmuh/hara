import { motion } from "motion/react";
import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import { Copy, Key } from "../ui/Icons";
import { EASE } from "../ui/Motion";
import { useToast } from "../ui/Toast";
import styles from "./PinDialog.module.css";

const LIFETIME_SECONDS = 15 * 60;

interface IPin
{
    code: string;
    expiresAt: number;
}

function generate(): IPin
{
    const values = crypto.getRandomValues(new Uint32Array(1));
    const code = ((values[0] ?? 0) % 1_000_000).toString().padStart(6, "0");
    return { code, expiresAt: Date.now() + LIFETIME_SECONDS * 1000 };
}

function useNow(active: boolean): number
{
    const [now, setNow] = useState(() => Date.now());
    useEffect(() =>
    {
        if (!active)
        {
            return;
        }
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [active]);
    return now;
}

export default function PinDialog({ open, onClose }: { open: boolean; onClose: () => void })
{
    const toast = useToast();
    const [pin, setPin] = useState<IPin | null>(null);
    const now = useNow(open && pin !== null);
    const remaining = pin ? Math.max(0, Math.ceil((pin.expiresAt - now) / 1000)) : 0;
    const expired = pin !== null && remaining === 0;

    async function copy(): Promise<void>
    {
        if (!pin)
        {
            return;
        }
        try
        {
            await navigator.clipboard.writeText(pin.code);
            toast.success("PIN Copied");
        }
        catch
        {
            toast.error("Could Not Copy", "Select the PIN and copy it manually.");
        }
    }

    return (
        <Dialog open={open} title="Link a New Patient" onClose={onClose}>
            <p className={styles.note}>The patient enters this PIN when they sign up in the HARA app. It works once and expires after 15 minutes.</p>
            <div className={`${styles.pin} ${expired ? styles.expired : ""}`} aria-live="polite">
                {(pin?.code ?? "------").split("").map((digit, index) => (
                    <motion.span
                        key={`${pin?.code ?? "empty"}-${index}`}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
                    >
                        {digit}
                    </motion.span>
                ))}
            </div>
            <p className={styles.timer}>
                {pin === null ? "No PIN Yet" : expired ? "Expired" : `Expires in ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`}
            </p>
            <div className={styles.actions}>
                <Button variant="ghost" icon={<Copy />} onClick={() => void copy()} disabled={pin === null || expired}>Copy</Button>
                <Button icon={<Key />} onClick={() => setPin(generate())}>{pin === null ? "Generate PIN" : "New PIN"}</Button>
            </div>
        </Dialog>
    );
}
