export const SITE_HOST = "projecthara.ca";
export const PORTAL_HOST = `portal.${SITE_HOST}`;

export type Correction = { kind: "stay" } | { kind: "replace"; path: string } | { kind: "portal"; path: string };

export function isPortalPath(path: string): boolean
{
    return path === "/login" || path === "/admin" || path === "/patients" || /^\/patients\/[A-Za-z0-9]+$/.test(path);
}

export function correctPath(path: string, host: string): Correction
{
    if (host === PORTAL_HOST)
    {
        return isPortalPath(path) ? { kind: "stay" } : { kind: "replace", path: "/login" };
    }
    if (host === SITE_HOST || host === `www.${SITE_HOST}`)
    {
        if (path === "/")
        {
            return { kind: "stay" };
        }
        return isPortalPath(path) ? { kind: "portal", path } : { kind: "replace", path: "/" };
    }
    return path === "/" || isPortalPath(path) ? { kind: "stay" } : { kind: "replace", path: "/" };
}
