import { useState } from "react";
import { useIntent } from "../Intents";
import Hints from "../ui/Hints";
import { useShake } from "../ui/Shake";
import { notify } from "../ui/Toast";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import form from "./SignUp.module.css";

export default function Link({ onLinked, onBack }: { onLinked: () => void; onBack: () => void })
{
    const [pin, setPin] = useState("");
    const [field, shakeField] = useShake<HTMLLabelElement>();

    function link(): void
    {
        if (/^\d{6}$/.test(pin))
        {
            onLinked();
        }
        else
        {
            shakeField();
            notify("Clinician PINs Have 6 Digits");
        }
    }

    useIntent((intent) =>
    {
        if (intent === "select")
        {
            link();
            return true;
        }
        if (intent === "back")
        {
            onBack();
            return true;
        }
        return false;
    });

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
            </div>
            <div className={form.stage}>
                <form
                    className={form.card}
                    onSubmit={(event) =>
                    {
                        event.preventDefault();
                        link();
                    }}
                >
                    <div className={screen.heading}>
                        <h1>Link Your Clinician</h1>
                        <p>Enter the 6-digit PIN from your clinician to share your progress.</p>
                    </div>
                    <label ref={field} className={form.field}>
                        <span>Clinician PIN</span>
                        <input
                            autoFocus
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoComplete="off"
                            value={pin}
                            onChange={(event) =>
                            {
                                const digits = event.target.value.replace(/\D/g, "");
                                if (digits.length < event.target.value.length)
                                {
                                    notify("Clinician PINs Only Use Digits");
                                }
                                setPin(digits.slice(0, 6));
                            }}
                        />
                    </label>
                </form>
            </div>
            <div className={screen.foot}>
                <Hints hints={[{ key: "Enter", label: "Link" }, { key: "Esc", label: "Back" }]} />
            </div>
        </div>
    );
}
