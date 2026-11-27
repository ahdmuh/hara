import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";

let client: ConvexReactClient | null = null;

function backend(): ConvexReactClient
{
    client ??= new ConvexReactClient(import.meta.env.CONVEX_URL as string, { logger: false, unsavedChangesWarning: false });
    return client;
}

export default function Backend({ children }: { children: ReactNode })
{
    return (
        <ConvexAuthProvider
            client={backend()}
            storage={window.sessionStorage}
            ambientSignIns={[]}
            api={{ refreshSession: api.auth.refreshSession, signOut: api.auth.signOut, isAuthenticated: api.auth.isAuthenticated }}
        >
            {children}
        </ConvexAuthProvider>
    );
}
