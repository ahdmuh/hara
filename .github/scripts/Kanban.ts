import { readFileSync } from "node:fs";

export interface IPullRequest
{
    title: string;
    body: string | null;
    draft: boolean;
    merged: boolean;
    html_url: string;
    head: { ref: string };
}

export interface IPullRequestEvent
{
    action: string;
    pull_request: IPullRequest;
}

interface IStoryPage
{
    id: string;
    properties: { Status?: { status?: { name: string } } };
}

const STATUS_ORDER = ["Backlog", "Ready", "In Progress", "In Review", "Accepted"];
const STORY_PATTERN = /HARA-(\d+)/gi;
const NOTION_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const token = process.env.NOTION_TOKEN;
const databaseID = process.env.NOTION_DATABASE_ID;

function readEvent(): IPullRequestEvent
{
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath)
    {
        throw new Error("GITHUB_EVENT_PATH is not set.");
    }
    return JSON.parse(readFileSync(eventPath, "utf8")) as IPullRequestEvent;
}

export function findStoryIDs(pullRequest: IPullRequest): number[]
{
    const text = [pullRequest.title, pullRequest.head.ref, pullRequest.body].filter(Boolean).join(" ");
    const storyIDs = [...text.matchAll(STORY_PATTERN)].map(match => Number(match[1]));
    return [...new Set(storyIDs)];
}

function targetStatus(event: IPullRequestEvent): string | null
{
    if (event.action === "closed")
    {
        return event.pull_request.merged ? "Accepted" : null;
    }
    return event.pull_request.draft ? "In Progress" : "In Review";
}

export function nextStatus(event: IPullRequestEvent, current: string | undefined): string | null
{
    const target = targetStatus(event);
    const currentRank = current ? STATUS_ORDER.indexOf(current) : -1;
    return target !== null && STATUS_ORDER.indexOf(target) > currentRank ? target : null;
}

async function notion<TResponse>(path: string, method: string, body: object): Promise<TResponse>
{
    const response = await fetch(`${NOTION_URL}/${path}`, {
        method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const json = await response.json() as TResponse & { message?: string };
    if (!response.ok)
    {
        throw new Error(`${response.status} ${json.message}`);
    }
    return json;
}

async function syncStory(storyID: number, event: IPullRequestEvent): Promise<void>
{
    const query = { filter: { property: "Story ID", unique_id: { equals: storyID } } };
    const { results } = await notion<{ results: IStoryPage[] }>(`databases/${databaseID}/query`, "POST", query);
    const page = results[0];
    if (!page)
    {
        console.log(`HARA-${storyID}: no story found.`);
        return;
    }

    const current = page.properties.Status?.status?.name;
    const next = nextStatus(event, current);
    const properties: Record<string, object> = { PR: { url: event.pull_request.html_url } };
    if (next)
    {
        properties.Status = { status: { name: next } };
    }

    await notion(`pages/${page.id}`, "PATCH", { properties });
    console.log(`HARA-${storyID}: PR linked${next ? `, ${current} -> ${next}` : ""}.`);
}

async function main(): Promise<number>
{
    if (!token)
    {
        console.log("NOTION_TOKEN is not set, skipping.");
        return 0;
    }

    const event = readEvent();
    const storyIDs = findStoryIDs(event.pull_request);
    if (storyIDs.length === 0)
    {
        console.log("No HARA-<id> found in the title, branch or description.");
        return 0;
    }

    let failed = false;
    for (const storyID of storyIDs)
    {
        try
        {
            await syncStory(storyID, event);
        }
        catch (error)
        {
            failed = true;
            console.error(`HARA-${storyID}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return failed ? 1 : 0;
}

if (import.meta.main)
{
    process.exit(await main());
}
