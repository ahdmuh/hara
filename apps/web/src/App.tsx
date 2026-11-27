import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect } from "react";
import Landing from "./landing/Landing";
import Login from "./portal/Login";
import Portal from "./portal/Portal";
import { navigate, usePath } from "./Router";
import { isPortalHost } from "./Site";
import { PAGE } from "./ui/Motion";
import { ToastProvider } from "./ui/Toast";

type Screen = "landing" | "login" | "portal";

function screenFor(path: string): Screen
{
    if (path === "/login")
    {
        return "login";
    }
    if (path === "/patients" || path.startsWith("/patients/"))
    {
        return "portal";
    }
    return "landing";
}

export default function App()
{
    const path = usePath();
    const portalRoot = isPortalHost() && path === "/";
    const screen = screenFor(path);

    useEffect(() =>
    {
        if (portalRoot)
        {
            navigate("/patients", { replace: true });
        }
    }, [portalRoot]);

    return (
        <MotionConfig reducedMotion="user">
            <ToastProvider>
                <AnimatePresence mode="wait">
                    {!portalRoot && (
                        <motion.div key={screen} variants={PAGE} initial="hidden" animate="shown" exit="gone">
                            {screen === "landing" && <Landing />}
                            {screen === "login" && <Login />}
                            {screen === "portal" && <Portal />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </ToastProvider>
        </MotionConfig>
    );
}
