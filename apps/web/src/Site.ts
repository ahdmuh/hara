import { PORTAL_HOST, SITE_HOST } from "./Routes";

export function isPortalHost(): boolean
{
    return window.location.hostname === PORTAL_HOST;
}

export function isSiteHost(): boolean
{
    return window.location.hostname === SITE_HOST || window.location.hostname === `www.${SITE_HOST}`;
}

export function portalHref(path: string): string
{
    return isSiteHost() ? `https://${PORTAL_HOST}${path}` : path;
}

export function siteHref(path: string): string
{
    return isPortalHost() ? `https://${SITE_HOST}${path}` : path;
}
