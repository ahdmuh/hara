import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { storedAccount, useLinkClinician, useProfile, useRegister, useSignOut } from "./Account";
import { bridge } from "./Bridge";
import DebugView from "./DebugView";
import type { IDeviceStatus } from "../main/DeviceConnection";
import { createDeviceSource } from "./DeviceSource";
import type { IGame } from "./Games";
import { InputContext } from "./InputContext";
import { startIntents } from "./Intents";
import { createKeyboardSource } from "./KeyboardSource";
import { music, storedVolume, VOLUME_STEPS } from "./Music";
import { sounds } from "./Sounds";
import Calibration from "./screens/Calibration";
import Home, { type DockID } from "./screens/Home";
import Link from "./screens/Link";
import Play from "./screens/Play";
import Progress from "./screens/Progress";
import Settings from "./screens/Settings";
import SignUp from "./screens/SignUp";
import Start from "./screens/Start";
import Backdrop from "./ui/Backdrop";
import { SCREEN, type ITravel } from "./ui/Motion";
import Toasts from "./ui/Toast";

const INPUT = import.meta.env.VITE_INPUT ?? (import.meta.env.DEV ? "keyboard" : "device");

const DEPTH: Record<string, number> = {
    start: 0,
    signUp: 1,
    calibration: 2,
    home: 3,
    settings: 4,
    progress: 4,
    link: 5,
    play: 5,
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
    | { name: "signUp" }
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

    const setView = useCallback((next: View) =>
    {
        setViewState((current) =>
        {
            setTravel(travelBetween(current.name, next.name));
            return next;
        });
    }, []);
    const [patient, setPatient] = useState<string | null>(() => storedAccount()?.name ?? null);
    const register = useRegister();
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
    const source = useMemo(() => INPUT === "keyboard" ? createKeyboardSource(window) : createDeviceSource(bridge), []);

    useEffect(() =>
    {
        void bridge.version().then(setVersion);
        void bridge.deviceStatus().then(setDevice);
        return bridge.onDeviceStatus(setDevice);
    }, []);

    useEffect(() => startIntents(window, source), [source]);

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
        if (!patient)
        {
            setView({ name: "signUp" });
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
            case "signUp":
                return (
                    <SignUp
                        onBack={showStart}
                        onDone={async (details) =>
                        {
                            const result = await register(details);
                            if (typeof result === "string")
                            {
                                return result;
                            }
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
                        onDone={() =>
                        {
                            setCalibrated(true);
                            setCalibratedAt(new Date());
                            goHome();
                        }}
                    />
                );
            case "home":
                return (
                    <Home
                        name={patient ?? ""}
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
                        onLink={() => setView({ name: "link" })}
                        onBack={goHome}
                        onRecalibrate={() => setView({ name: "calibration" })}
                        onSignOut={() =>
                        {
                            void signOut();
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
                return <Progress calibratedAt={calibratedAt} achieved={profile?.linked ?? linked ? ["linked"] : []} onBack={goHome} />;
        }
    }

    return (
        <InputContext value={source}>
            <main style={{ position: "relative", height: "100%" }}>
                <div className="titleBar" aria-hidden="true" />
                {ready && <Backdrop />}
                <AnimatePresence mode="wait" initial={false} custom={travel}>
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
