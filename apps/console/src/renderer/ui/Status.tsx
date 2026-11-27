import { Usb } from "./Icons";
import styles from "./Status.module.css";

export default function Status({ connected }: { connected: boolean })
{
    return (
        <span className={`${styles.status} ${connected ? styles.connected : ""}`}>
            <Usb />
            {connected ? "Device Connected" : "No Device"}
        </span>
    );
}
