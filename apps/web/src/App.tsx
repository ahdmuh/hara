import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect } from "react";
import Landing from "./landing/Landing";
import { navigate, usePath } from "./Router";
import { isPortalHost } from "./Site";
import { PAGE } from "./ui/Motion";
import { ToastProvider } from "./ui/Toast";

const PortalApp = lazy(() => import("./portal/PortalApp"));

type Screen = "landing" | "login" | "portal" | "admin";

function screenFor(path: string): Screen
{
    if (path === "/login")
    {
        return "login";
    }
    if (path === "/admin")
    {
        return "admin";
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
            navigate("/login", { replace: true });
        }
    }, [portalRoot]);

    return (
        <MotionConfig reducedMotion="user">
            <ToastProvider>
                <AnimatePresence mode="wait">
                    {!portalRoot && (
                        <motion.div key={screen} variants={PAGE} initial="hidden" animate="shown" exit="gone">
                            {screen === "landing"
                                ? <Landing />
                                : (
                                        <Suspense fallback={null}>
                                            <PortalApp screen={screen} />
                                        </Suspense>
                                    )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </ToastProvider>
        </MotionConfig>
    );
}
