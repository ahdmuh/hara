import type { IHandFrame } from "./Hand";

export type FrameListener = (frame: IHandFrame) => void;

export interface IInputSource
{
    subscribe(listener: FrameListener): () => void;
}
