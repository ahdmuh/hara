export type GameID = "range" | "strength" | "speed";

export interface IGame
{
    id: GameID;
    title: string;
    metric: string;
    body: string;
}

export const GAMES: IGame[] = [
    {
        id: "range",
        title: "Range of Motion",
        metric: "Range",
        body: "How far each finger opens and closes.",
    },
    {
        id: "strength",
        title: "Strength",
        metric: "Force",
        body: "How much force each finger can hold.",
    },
    {
        id: "speed",
        title: "Speed",
        metric: "Timing",
        body: "How quickly each finger moves and reacts.",
    },
];
