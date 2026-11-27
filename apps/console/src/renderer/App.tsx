import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { rememberName, storedAccount, useLinkClinician, useProfile, useRegister, useSignIn, useSignOut } from "./Account";
import { bridge } from "./Bridge";
import DebugView from "./DebugView";
import type { IDeviceStatus } from "../main/DeviceConnection";
import { createDeviceRawSource, createDeviceSource, createProvisionalRawSource, PROVISIONAL } from "./DeviceSource";
import type { IGame } from "./Games";
import { InputContext } from "./InputContext";
import { startIntents } from "./Intents";
import { useSync } from "./Sync";
import { CALIBRATED_THRESHOLDS, GENEROUS_THRESHOLDS } from "./TapDetector";
import type { HandCalibration } from "@hara/input";
import { createKeyboardSource } from "./KeyboardSource";
import { music, storedVolume, VOLUME_STEPS } from "./Music";
import { sounds } from "./Sounds";
import Calibration from "./screens/Calibration";
import Home, { type DockID } from "./screens/Home";
import Link from "./screens/Link";
import SignIn from "./screens/SignIn";
import Welcome from "./screens/Welcome";
import Play from "./screens/Play";
import Progress from "./screens/Progress";
import Settings from "./screens/Settings";
import SignUp from "./screens/SignUp";
import Start from "./screens/Start";
import Backdrop from "./ui/Backdrop";
import { SCREEN, type ITravel } from "./ui/Motion";
import Toasts, { notify } from "./ui/Toast";

const INPUT = import.meta.env.VITE_INPUT ?? (import.meta.env.DEV ? "keyboard" : "device");

const DEPTH: Record<string, number> = {
    start: 0,
    welcome: 1,
    signUp: 2,
    signIn: 2,
    calibration: 4,
    home: 5,
    settings: 6,
    progress: 6,
    link: 7,
    play: 6,
};

function travelBetween(from: string, to: string): ITravel
{
    if (from === "calibration" && to === "home")
    {
        return { x: 0, mode: "zoom" };
    }
    if (to === "play")
    {
        return { x: 0, mode: "dive" };
    }
    if (from === "play")
    {
        return { x: 0, mode: "surface" };
    }
    if (to === "settings" || from === "settings")
    {
        return { x: to === "settings" ? -1 : 1, mode: "slide" };
    }
    if (to === "progress" || from === "progress")
    {
        return { x: to === "progress" ? 1 : -1, mode: "slide" };
    }
    return { x: Math.sign((DEPTH[to] ?? 0) - (DEPTH[from] ?? 0)) || 1, mode: "slide" };
}

type View =
    | { name: "start" }
    | { name: "welcome" }
    | { name: "signUp" }
    | { name: "signIn" }
    | { name: "calibration" }
    | { name: "home" }
    | { name: "play"; game: IGame }
    | { name: "settings" }
    | { name: "link" }
    | { name: "progress" };

export default function App()
{
    const [view, setViewState] = useState<View>({ name: "start" });
    const [travel, setTravel] = useState<ITravel>({ x: 1, mode: "slide" });
    const arrival = useRef<string>("start");

    const setView = useCallback((next: View) =>
    {
        setViewState((current) =>
        {
            setTravel(travelBetween(current.name, next.name));
            return next;
        });
    }, []);
    const [account, setAccount] = useState(() => storedAccount());
    const [patient, setPatient] = useState<string | null>(() => storedAccount()?.name ?? null);
    const register = useRegister();
    const signIn = useSignIn();
    const linkClinician = useLinkClinician();
    const profile = useProfile();
    const signOut = useSignOut();
    const [calibrated, setCalibrated] = useState(false);
    const [linked, setLinked] = useState(false);
    const [calibratedAt, setCalibratedAt] = useState<Date | null>(null);
    const [lastGame, setLastGame] = useState(1);
    const [version, setVersion] = useState("");
    const [ready, setReady] = useState(false);
    const [debugging, setDebugging] = useState(false);
    const [device, setDevice] = useState<IDeviceStatus>({ connected: false, firmware: null });
    const [calibration, setCalibration] = useState<HandCalibration | null>(null);
    const keyboard = useMemo(() => createKeyboardSource(window), []);
    const source = useMemo(() => INPUT === "keyboard" ? keyboard : createDeviceSource(bridge, calibration ?? PROVISIONAL), [keyboard, calibration]);
    const raw = useMemo(() => INPUT === "keyboard" ? createProvisionalRawSource(keyboard) : createDeviceRawSource(bridge), [keyboard]);

    useEffect(() =>
    {
        void bridge.version().then(setVersion);
        void bridge.deviceStatus().then(setDevice);
        return bridge.onDeviceStatus(setDevice);
    }, []);

    useEffect(() => startIntents(window, source, calibration ? CALIBRATED_THRESHOLDS : GENEROUS_THRESHOLDS), [source, calibration]);

    const owner = account?.username ?? null;
    const [synced, setSynced] = useState(0);
    useSync(owner, synced);

    useEffect(() =>
    {
        if (!owner)
        {
            return;
        }
        let active = true;
        void bridge.latestCalibration(owner).then((record) =>
        {
            if (active && record)
            {
                setCalibration(record.fingers);
                setCalibrated(true);
                setCalibratedAt(new Date(record.takenAt));
            }
        });
        return () =>
        {
            active = false;
        };
    }, [owner]);

    useEffect(() =>
    {
        if (profile?.name)
        {
            rememberName(profile.name);
        }
    }, [profile?.name]);

    useEffect(() =>
    {
        void document.fonts.ready.then(() => setReady(true));
    }, []);

    useEffect(() =>
    {
        music.setVolume(storedVolume() / VOLUME_STEPS);
        sounds.setVolume(storedVolume() / VOLUME_STEPS);
    }, []);

    useEffect(() =>
    {
        if (view.name === "settings" || view.name === "progress")
        {
            sounds.play("open");
        }
        if (view.name === "home" && arrival.current !== "settings" && arrival.current !== "progress")
        {
            sounds.play("welcome");
        }
        arrival.current = view.name;
        const onboarding = view.name === "start" || view.name === "welcome" || view.name === "signUp" || view.name === "signIn" || view.name === "calibration";
        music.setTheme(onboarding ? "onboarding" : "home");
        if (!ready || view.name === "play")
        {
            music.pause();
        }
        else
        {
            music.play();
        }
    }, [ready, view.name]);

    useEffect(() =>
    {
        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (import.meta.env.DEV && event.ctrlKey && event.shiftKey && event.code === "KeyD")
            {
                setDebugging(shown => !shown);
            }
        };
        const ignore = (event: DragEvent) => event.preventDefault();
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("dragover", ignore);
        window.addEventListener("drop", ignore);
        return () =>
        {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("dragover", ignore);
            window.removeEventListener("drop", ignore);
        };
    }, []);

    const showStart = useCallback(() => setView({ name: "start" }), [setView]);
    const goHome = () => setView({ name: "home" });

    function begin(): void
    {
        if (patient === null)
        {
            setView({ name: "welcome" });
        }
        else
        {
            setView(calibrated ? { name: "home" } : { name: "calibration" });
        }
    }

    function open(id: DockID): void
    {
        setView(id === "settings" ? { name: "settings" } : { name: "progress" });
    }

    function render()
    {
        switch (view.name)
        {
            case "start":
                return <Start connected={device.connected} version={version} returning={patient !== null} onStart={begin} />;
            case "welcome":
                return <Welcome onBack={showStart} onChoose={choice => setView(choice === "create" ? { name: "signUp" } : { name: "signIn" })} />;
            case "signIn":
                return (
                    <SignIn
                        onBack={() => setView({ name: "welcome" })}
                        onDone={async (id, password) =>
                        {
                            const result = await signIn(id, password);
                            if (typeof result === "string")
                            {
                                return result;
                            }
                            setAccount(result);
                            setPatient(result.name);
                            setView({ name: "calibration" });
                            return null;
                        }}
                    />
                );
            case "signUp":
                return (
                    <SignUp
                        onBack={() => setView({ name: "welcome" })}
                        onDone={async (details) =>
                        {
                            const result = await register(details);
                            if (typeof result === "string")
                            {
                                return result;
                            }
                            setAccount(result);
                            setPatient(result.name);
                            setLinked(details.code !== "");
                            setView({ name: "calibration" });
                            return null;
                        }}
                    />
                );
            case "calibration":
                return (
                    <Calibration
                        raw={raw}
                        onDone={(result) =>
                        {
                            if (result && owner)
                            {
                                void bridge.saveCalibration(owner, result).then(() => setSynced(count => count + 1));
                                setCalibration(result);
                                setCalibratedAt(new Date());
                            }
                            else if (!calibration)
                            {
                                notify("Calibration Was Skipped, So Default Limits Apply", "info");
                            }
                            setCalibrated(true);
                            goHome();
                        }}
                    />
                );
            case "home":
                return (
                    <Home
                        name={profile?.name ?? patient ?? ""}
                        connected={device.connected}
                        initial={lastGame}
                        onPlay={(game, index) =>
                        {
                            setLastGame(index);
                            setView({ name: "play", game });
                        }}
                        onOpen={open}
                    />
                );
            case "play":
                return <Play game={view.game} onHome={goHome} />;
            case "settings":
                return (
                    <Settings
                        connected={device.connected}
                        firmware={device.firmware}
                        linked={profile?.linked ?? linked}
                        email={profile?.email ?? null}
                        onLink={() => setView({ name: "link" })}
                        onBack={goHome}
                        onRecalibrate={() => setView({ name: "calibration" })}
                        onSignOut={() =>
                        {
                            void signOut();
                            setAccount(null);
                            setCalibration(null);
                            setPatient(null);
                            setCalibrated(false);
                            setLinked(false);
                            setLastGame(1);
                            showStart();
                        }}
                    />
                );
            case "link":
                return (
                    <Link
                        onBack={() => setView({ name: "settings" })}
                        onLink={async (code) =>
                        {
                            const message = await linkClinician(code);
                            if (!message)
                            {
                                setLinked(true);
                                setView({ name: "settings" });
                            }
                            return message;
                        }}
                    />
                );
            case "progress":
                return <Progress calibratedAt={calibratedAt} achieved={profile?.milestones ?? (linked ? ["linked"] : [])} onBack={goHome} />;
        }
    }

    return (
        <InputContext value={source}>
            <main style={{ position: "relative", height: "100%" }}>
                <div className="titleBar" aria-hidden="true" />
                {ready && <Backdrop />}
                <AnimatePresence mode={travel.mode === "dive" || travel.mode === "surface" ? "sync" : "wait"} initial={false} custom={travel}>
                    <motion.div
                        key={view.name}
                        style={{ position: "absolute", inset: 0, willChange: "transform, opacity" }}
                        variants={SCREEN}
                        custom={travel}
                        initial="hidden"
                        animate="shown"
                        exit="gone"
                    >
                        {ready && render()}
                    </motion.div>
                </AnimatePresence>
                <Toasts />
                {debugging && <DebugView source={source} />}
            </main>
        </InputContext>
    );
}
