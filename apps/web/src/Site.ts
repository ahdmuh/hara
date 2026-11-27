const SITE_HOST = "projecthara.ca";
const PORTAL_HOST = `portal.${SITE_HOST}`;

export function isPortalHost(): boolean
{
    return window.location.hostname === PORTAL_HOST;
}

export function portalHref(path: string): string
{
    return window.location.hostname === SITE_HOST ? `https://${PORTAL_HOST}${path}` : path;
}

export function siteHref(path: string): string
{
    return isPortalHost() ? `https://${SITE_HOST}${path}` : path;
}
