import { normalizeLinkCode } from "@hara/accounts";
import { useState } from "react";
import { useIntent } from "../Intents";
import Hints from "../ui/Hints";
import { useShake } from "../ui/Shake";
import { notify } from "../ui/Toast";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import form from "./SignUp.module.css";

export default function Link({ onLink, onBack }: { onLink: (code: string) => Promise<string | null>; onBack: () => void })
{
    const [code, setCode] = useState("");
    const [field, shakeField] = useShake<HTMLLabelElement>();

    const [busy, setBusy] = useState(false);

    function link(): void
    {
        if (busy)
        {
            return;
        }
        if (!normalizeLinkCode(code))
        {
            shakeField();
            notify("Clinician Codes Have 8 Letters and Numbers");
            return;
        }
        setBusy(true);
        void onLink(code).then((message) =>
        {
            setBusy(false);
            if (message)
            {
                shakeField();
                notify(message);
            }
        });
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
                        <p>Enter the code from your clinician to share your progress.</p>
                    </div>
                    <label ref={field} className={form.field}>
                        <span>Clinician Code</span>
                        <input
                            autoFocus
                            type="text"
                            maxLength={9}
                            autoComplete="off"
                            value={code}
                            onChange={(event) =>
                            {
                                const raw = event.target.value;
                                if (/[^A-Za-z0-9\s-]/.test(raw))
                                {
                                    notify("Clinician Codes Use Letters and Numbers");
                                }
                                const characters = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
                                setCode(characters.length > 4 ? `${characters.slice(0, 4)}-${characters.slice(4)}` : characters);
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
