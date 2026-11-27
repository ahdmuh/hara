import Admin from "./Admin";
import Backend from "./Backend";
import Login from "./Login";
import Portal from "./Portal";

export type PortalScreen = "login" | "portal" | "admin";

export default function PortalApp({ screen }: { screen: PortalScreen })
{
    return (
        <Backend>
            {screen === "login" && <Login />}
            {screen === "portal" && <Portal />}
            {screen === "admin" && <Admin />}
        </Backend>
    );
}
