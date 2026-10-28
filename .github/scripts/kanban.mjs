// Links a PR to its HARA story in Notion and moves the story's Status.
// Finds story IDs like HARA-42 in the PR title, branch name, or description.
//   Draft PR    -> In Progress
//   Open PR     -> In Review
//   Merged PR   -> Accepted
// Status only moves forward, never back.

import { readFileSync } from "node:fs";

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const pr = event.pull_request;

if (!token) {
  console.log("NOTION_TOKEN not set, skipping.");
  process.exit(0);
}

const text = [pr.title, pr.head?.ref, pr.body].filter(Boolean).join(" ");
const ids = [...new Set([...text.matchAll(/HARA-(\d+)/gi)].map((m) => Number(m[1])))];

if (ids.length === 0) {
  console.log("No HARA-<id> found in title, branch, or description.");
  process.exit(0);
}

const order = ["Backlog", "Ready", "In Progress", "In Review", "Accepted"];
let target = null;
if (event.action === "closed") target = pr.merged ? "Accepted" : null;
else target = pr.draft ? "In Progress" : "In Review";

async function notion(path, method, body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${json.message}`);
  return json;
}

let failed = false;

for (const id of ids) {
  try {
    const { results } = await notion(`databases/${databaseId}/query`, "POST", {
      filter: { property: "Story ID", unique_id: { equals: id } },
    });
    const page = results[0];
    if (!page) {
      console.log(`HARA-${id}: no story found.`);
      continue;
    }

    const properties = { PR: { url: pr.html_url } };
    const current = page.properties.Status?.status?.name;
    if (target && order.indexOf(target) > order.indexOf(current)) {
      properties.Status = { status: { name: target } };
    }

    await notion(`pages/${page.id}`, "PATCH", { properties });
    console.log(`HARA-${id}: PR linked${properties.Status ? `, ${current} -> ${target}` : ""}.`);
  } catch (err) {
    failed = true;
    console.error(`HARA-${id}: ${err.message}`);
  }
}

process.exit(failed ? 1 : 0);
