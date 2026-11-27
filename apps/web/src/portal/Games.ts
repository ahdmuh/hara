import type { Doc } from "../../../../convex/_generated/dataModel";

export type Game = Doc<"sessions">["game"];

export type MilestoneKind = Doc<"milestones">["kind"];

export const FINGER_NAMES = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;

export const GAMES: { id: Game; name: string; unit: string; maximum: number; digits: number }[] = [
    { id: "rangeOfMotion", name: "Range of Motion", unit: "%", maximum: 100, digits: 0 },
    { id: "strength", name: "Strength", unit: "N", maximum: 20, digits: 1 },
    { id: "speed", name: "Speed", unit: "taps/s", maximum: 6, digits: 1 },
];

export const GAME_INFO = Object.fromEntries(GAMES.map(game => [game.id, game])) as Record<Game, (typeof GAMES)[number]>;

export { MILESTONE_TITLES } from "@hara/badges";
