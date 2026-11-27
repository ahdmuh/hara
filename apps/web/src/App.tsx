import { MotionConfig } from "motion/react";
import Landing from "./landing/Landing";
import { ToastProvider } from "./ui/Toast";

export default function App()
{
    return (
        <MotionConfig reducedMotion="user">
            <ToastProvider>
                <Landing />
            </ToastProvider>
        </MotionConfig>
    );
}
