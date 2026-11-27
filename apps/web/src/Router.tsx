import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const NAVIGATE_EVENT = "hara:navigate";

function subscribe(listener: () => void): () => void
{
    window.addEventListener("popstate", listener);
    window.addEventListener(NAVIGATE_EVENT, listener);
    return () =>
    {
        window.removeEventListener("popstate", listener);
        window.removeEventListener(NAVIGATE_EVENT, listener);
    };
}

function pathname(): string
{
    return window.location.pathname;
}

export function usePath(): string
{
    return useSyncExternalStore(subscribe, pathname);
}

export function navigate(path: string, options: { replace?: boolean } = {}): void
{
    if (path === window.location.pathname)
    {
        return;
    }
    if (options.replace)
    {
        window.history.replaceState(null, "", path);
    }
    else
    {
        window.history.pushState(null, "", path);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function matchPath(pattern: string, path: string): Record<string, string> | null
{
    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = path.split("/").filter(Boolean);
    if (patternParts.length !== pathParts.length)
    {
        return null;
    }
    const parameters: Record<string, string> = {};
    for (const [index, part] of patternParts.entries())
    {
        const actual = pathParts[index] ?? "";
        if (part.startsWith(":"))
        {
            parameters[part.slice(1)] = decodeURIComponent(actual);
        }
        else if (part !== actual)
        {
            return null;
        }
    }
    return parameters;
}

interface ILinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>
{
    to: string;
}

export function Link({ to, onClick, ...rest }: ILinkProps)
{
    function handleClick(event: MouseEvent<HTMLAnchorElement>): void
    {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        {
            return;
        }
        event.preventDefault();
        navigate(to);
    }

    return <a href={to} onClick={handleClick} {...rest} />;
}
