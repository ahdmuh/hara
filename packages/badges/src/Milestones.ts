export const MILESTONE_KINDS = ["linked", "first", "sessions10", "sessions25", "sessions50", "difficulty", "range", "strength", "speed"] as const;

export type MilestoneKind = typeof MILESTONE_KINDS[number];

export const MILESTONE_TITLES: Record<MilestoneKind, string> = {
    linked: "Linked to Clinician",
    first: "First Session",
    sessions10: "10 Sessions",
    sessions25: "25 Sessions",
    sessions50: "50 Sessions",
    difficulty: "Unlocked Medium Difficulty",
    range: "Range of Motion Above 60%",
    strength: "New Strength Best",
    speed: "New Speed Best",
};
