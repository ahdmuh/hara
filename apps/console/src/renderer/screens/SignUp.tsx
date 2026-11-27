import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useIntent } from "../Intents";
import { sounds } from "../Sounds";
import { filterName, isEmail, MAXIMUM_NAME, nameError, normalizeEmail, normalizeLinkCode } from "@hara/accounts";
import type { IRegistration } from "../Account";
import { eraseDigit, entryColumn, finishEntry, partialLabel, typeText, type IDateEntry } from "../DateEntry";
import DateWheel, { DATE_COLUMNS, formatISO, stepDate, type DateColumn } from "../ui/DateWheel";
import Hints, { type IHint } from "../ui/Hints";
import { useShake } from "../ui/Shake";
import { notify } from "../ui/Toast";
import { EASE } from "../ui/Motion";
import Wordmark from "../ui/Wordmark";
import screen from "./Screen.module.css";
import styles from "./SignUp.module.css";

const MINIMUM_PASSWORD = 8;
const MAXIMUM_PASSWORD = 128;

const FILTERS: Record<string, (value: string) => string> = {
    name: filterName,
    password: value => value.slice(0, MAXIMUM_PASSWORD),
    email: value => value.replace(/\s/g, "").slice(0, 254),
    pin: (value) =>
    {
        const characters = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
        return characters.length > 4 ? `${characters.slice(0, 4)}-${characters.slice(4)}` : characters;
    },
};

const STEPS = [
    { id: "name", title: "What Is Your Name?", note: "", type: "text", label: "Full Name" },
    { id: "email", title: "What Is Your Email?", note: "", type: "email", label: "Email" },
    { id: "birthday", title: "When Is Your Birthday?", note: "", type: "text", label: "Birthday" },
    { id: "password", title: "Choose a Password", note: `At least ${MINIMUM_PASSWORD} characters.`, type: "password", label: "Password" },
    {
        id: "pin",
        title: "Link Your Clinician",
        note: "Optional. Enter the code from your clinician to share your progress, or link one later in Settings.",
        type: "text",
        label: "Clinician Code",
    },
] as const;

type StepID = typeof STEPS[number]["id"];

function problem(step: StepID, value: string): string
{
    switch (step)
    {
        case "name":
            return nameError(value) ?? "";
        case "email":
            return "Enter a Valid Email";
        case "birthday":
            return "Finish Entering Your Birthday";
        case "password":
            return `Use at Least ${MINIMUM_PASSWORD} Characters`;
        case "pin":
            return "Clinician Codes Have 8 Letters and Numbers";
    }
}

function isValid(step: StepID, value: string): boolean
{
    switch (step)
    {
        case "name":
            return nameError(value) === null;
        case "email":
            return isEmail(normalizeEmail(value));
        case "birthday":
            return /^\d{4}-\d{2}-\d{2}$/.test(value);
        case "password":
            return value.length >= MINIMUM_PASSWORD;
        case "pin":
            return value === "" || normalizeLinkCode(value) !== null;
    }
}

interface ISignUpProps
{
    onDone: (details: IRegistration) => Promise<string | null>;
    onBack: () => void;
}

export default function SignUp({ onDone, onBack }: ISignUpProps)
{
    const [index, setIndexState] = useState(0);
    const [travel, setTravel] = useState(1);

    function setIndex(next: number): void
    {
        setTravel(next >= index ? 1 : -1);
        setIndexState(next);
    }
    const [busy, setBusy] = useState(false);
    const [values, setValues] = useState<Record<StepID, string>>({ name: "", email: "", birthday: "", password: "", pin: "" });
    const [field, shakeField] = useShake<HTMLLabelElement>();
    const [wheel, shakeWheel] = useShake<HTMLDivElement>();
    const [entry, setEntry] = useState<IDateEntry>({ digits: "", date: { year: 1960, month: 1, day: 1 } });
    const [column, setColumn] = useState<DateColumn>("year");
    const [direction, setDirection] = useState(1);
    const [today] = useState(() =>
    {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    });
    const latest = useRef(entry);
    const birthday = entry.date;

    function updateEntry(next: IDateEntry): void
    {
        latest.current = next;
        setEntry(next);
        setColumn(entryColumn(next));
    }
    const step = STEPS[index] ?? STEPS[0];
    const value = step.id === "birthday" ? formatISO(birthday) : values[step.id];

    function stepBirthday(target: DateColumn, amount: number): void
    {
        setDirection(amount);
        const next = { digits: "", date: stepDate(latest.current.date, target, amount, today) };
        latest.current = next;
        setEntry(next);
    }

    function typeBirthday(text: string): void
    {
        const result = typeText(latest.current, text, today);
        setDirection(1);
        updateEntry(result.entry);
        if (result.rejected)
        {
            notify(result.reason ?? "That Date Doesn't Exist");
            shakeWheel(`[data-column="${entryColumn(result.entry)}"] [data-window]`);
        }
    }

    function eraseBirthday(): void
    {
        if (latest.current.digits.length > 0)
        {
            sounds.play("type");
        }
        updateEntry(eraseDigit(latest.current));
    }

    function moveColumn(amount: number): void
    {
        const index = DATE_COLUMNS.indexOf(column) + amount;
        setColumn(DATE_COLUMNS[Math.min(DATE_COLUMNS.length - 1, Math.max(0, index))] ?? "month");
    }

    function next(): void
    {
        if (step.id === "birthday")
        {
            const finished = finishEntry(latest.current, today);
            if (finished.rejected)
            {
                notify(finished.reason ?? "Finish Entering Your Birthday");
                shakeWheel(`[data-column="${entryColumn(latest.current)}"] [data-window]`);
                return;
            }
            updateEntry(finished.entry);
            setIndex(index + 1);
            return;
        }
        if (!isValid(step.id, value))
        {
            shakeField();
            notify(problem(step.id, value));
            return;
        }
        if (index === STEPS.length - 1)
        {
            setBusy(true);
            const details = {
                name: values.name.trim(),
                email: normalizeEmail(values.email),
                birthday: formatISO(latest.current.date),
                password: values.password,
                code: values.pin,
            };
            void onDone(details).then((message) =>
            {
                setBusy(false);
                if (message)
                {
                    shakeField();
                    notify(message);
                }
            });
            return;
        }
        setIndex(index + 1);
    }

    useIntent((intent) =>
    {
        if (busy)
        {
            return false;
        }
        if (step.id === "birthday" && (intent === "up" || intent === "down"))
        {
            const before = latest.current.date;
            stepBirthday(column, intent === "down" ? 1 : -1);
            return latest.current.date !== before;
        }
        if (step.id === "birthday" && (intent === "previous" || intent === "next"))
        {
            const before = column;
            moveColumn(intent === "next" ? 1 : -1);
            return DATE_COLUMNS[Math.min(DATE_COLUMNS.length - 1, Math.max(0, DATE_COLUMNS.indexOf(before) + (intent === "next" ? 1 : -1)))] !== before;
        }
        if (intent === "select")
        {
            next();
            return true;
        }
        if (intent === "back")
        {
            if (index === 0)
            {
                onBack();
            }
            else
            {
                setIndex(index - 1);
            }
            return true;
        }
        return false;
    });

    function change(raw: string): void
    {
        const filtered = FILTERS[step.id]?.(raw) ?? raw;
        const dropped = step.id === "pin"
            ? /[^A-Za-z0-9\s-]/.test(raw)
            : filtered.replace(/\s/g, "").length < raw.replace(/\s/g, "").length && filtered.length < MAXIMUM_PASSWORD;
        if (dropped)
        {
            notify(step.id === "pin" ? "Clinician Codes Use Letters and Numbers" : "Names Use Letters, Spaces, Hyphens and Apostrophes");
        }
        setValues({ ...values, [step.id]: filtered });
    }

    const hints: IHint[] = [
        ...(step.id === "birthday" ? [{ key: "↑ ↓", label: "Change" }, { key: "← →", label: "Move" }] : []),
        { finger: "middle", key: "Enter", label: index < STEPS.length - 1 ? "Continue" : value ? "Finish" : "Skip" },
        { finger: "thumb", key: "Esc", label: "Back" },
    ];

    return (
        <div className={screen.screen}>
            <div className={screen.top}>
                <Wordmark className={screen.brand} />
                <ol className={styles.dots} aria-label="Sign Up Steps">
                    {STEPS.map((entry, position) => (
                        <li key={entry.id} className={position <= index ? styles.done : ""} />
                    ))}
                </ol>
            </div>
            <div className={styles.stage}>
                <AnimatePresence mode="wait" initial={false} custom={travel}>
                    <motion.form
                        key={step.id}
                        className={styles.card}
                        custom={travel}
                        variants={{
                            enter: (sign: number) => ({ opacity: 0, x: sign * 60 }),
                            center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
                            leave: (sign: number) => ({ opacity: 0, x: sign * -60, transition: { duration: 0.2, ease: EASE } }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="leave"
                        onSubmit={(event) =>
                        {
                            event.preventDefault();
                            next();
                        }}
                    >
                        <div className={screen.heading}>
                            <h1>{step.title}</h1>
                            {step.note && <p>{step.note}</p>}
                        </div>
                        {step.id === "birthday"
                            ? (
                                    <div ref={wheel}>
                                        <DateWheel
                                            date={birthday}
                                            column={column}
                                            direction={direction}
                                            partial={target => partialLabel(entry, target)}
                                            onStep={stepBirthday}
                                            onColumn={setColumn}
                                            onType={typeBirthday}
                                            onErase={eraseBirthday}
                                            onMove={moveColumn}
                                        />
                                    </div>
                                )
                            : (
                                    <label ref={field} className={styles.field}>
                                        <span>{step.label}</span>
                                        <input
                                            autoFocus
                                            type={step.type}
                                            maxLength={step.id === "pin" ? 9 : step.id === "name" ? MAXIMUM_NAME : step.id === "email" ? 254 : MAXIMUM_PASSWORD}
                                            autoComplete="off"
                                            value={value}
                                            onChange={event => change(event.target.value)}
                                        />
                                    </label>
                                )}
                    </motion.form>
                </AnimatePresence>
            </div>
            <div className={screen.foot}>
                <Hints hints={hints} />
            </div>
        </div>
    );
}
