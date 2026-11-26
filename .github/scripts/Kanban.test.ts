import { describe, expect, test } from "bun:test";
import { findStoryIDs, nextStatus, type IPullRequest } from "./Kanban";

function pullRequest(overrides: Partial<IPullRequest> = {}): IPullRequest
{
    return {
        title: "",
        body: null,
        draft: false,
        merged: false,
        html_url: "https://github.com/ahdmuh/hara/pull/1",
        head: { ref: "" },
        ...overrides,
    };
}

describe("findStoryIDs", () =>
{
    test("collects each story once across the title, branch and description", () =>
    {
        const ids = findStoryIDs(pullRequest({
            title: "HARA-2: Run Checks on Every Pull Request",
            head: { ref: "HARA-2_PullRequestChecks" },
            body: "Unblocks hara-1 and HARA-17.",
        }));
        expect(ids).toEqual([2, 1, 17]);
    });

    test("finds nothing when no story is referenced", () =>
    {
        expect(findStoryIDs(pullRequest({ title: "chore: bump bun" }))).toEqual([]);
    });
});

describe("nextStatus", () =>
{
    test.each([
        ["opened", { draft: true }, "Ready", "In Progress"],
        ["opened", {}, "Ready", "In Review"],
        ["ready_for_review", {}, "In Progress", "In Review"],
        ["closed", { merged: true }, "In Review", "Accepted"],
        ["opened", {}, undefined, "In Review"],
    ] as const)("%s %o moves %s to %s", (action, overrides, current, expected) =>
    {
        expect(nextStatus({ action, pull_request: pullRequest(overrides) }, current)).toBe(expected);
    });

    test.each([
        ["closed", { merged: false }, "In Review"],
        ["converted_to_draft", { draft: true }, "In Review"],
        ["edited", {}, "Accepted"],
    ] as const)("%s %o leaves %s alone", (action, overrides, current) =>
    {
        expect(nextStatus({ action, pull_request: pullRequest(overrides) }, current)).toBeNull();
    });
});
