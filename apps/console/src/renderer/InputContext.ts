import { createContext, useContext } from "react";
import type { IInputSource } from "@hara/input";

export const InputContext = createContext<IInputSource | null>(null);

export function useInputSource(): IInputSource
{
    const source = useContext(InputContext);
    if (!source)
    {
        throw new Error("Missing input source.");
    }
    return source;
}
