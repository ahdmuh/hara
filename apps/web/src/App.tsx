import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect } from "react";
import Landing from "./landing/Landing";
import { navigate, scrollToTop, usePath } from "./Router";
import { correctPath } from "./Routes";
import { portalHref } from "./Site";
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
    const correction = correctPath(path, window.location.hostname);
    const portalRoot = correction.kind !== "stay";
    const target = correction.kind === "stay" ? "" : `${correction.kind}:${correction.path}`;
    const screen = screenFor(path);

    useEffect(() =>
    {
        const [kind, destination] = target.split(":");
        if (kind === "portal" && destination)
        {
            window.location.replace(portalHref(destination));
        }
        else if (kind === "replace" && destination)
        {
            navigate(destination, { replace: true });
        }
    }, [target]);

    return (
        <MotionConfig reducedMotion="user">
            <ToastProvider>
                <AnimatePresence mode="wait" onExitComplete={scrollToTop}>
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
