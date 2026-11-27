# Development

## Setup

```sh
bun install
bun run check
bun run dev
```

Run `bunx convex dev` once to sign in to Convex and write `.env.local`.

Create the first admin with `bunx convex run Accounts:bootstrapAdmin '{"name": "…", "email": "…"}'`. It emails a temporary password.

`bun run dev` uses keyboard input: keys 1 to 5 close the thumb to pinky (hold Shift to open), so a quick press is a finger tap. Arrows, Enter and Esc also navigate. Run `VITE_INPUT=device bun run dev` to read the device.

## Commits

Prefix commit messages with a type and an optional scope: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

- `feat: add calibration screen`
- `fix(dev): correct grip sensor offset`

## Pull Requests

### Story ID

Every PR must reference its associated story ID (`HARA-<id>`) in the branch name and PR title. Branches use PascalCase after the ID.

- Branch: `HARA-42_CalibrationFlow`
- PR title: `HARA-42: Calibration Flow`

### Description

```md
## Objective

<One or two sentences on the purpose of this PR and why.>

## Overview

**<Feature / Change>:** <What was added, changed, or removed.>

**Misc. Changes:** <Smaller changes that don't warrant their own entry.>

## Testing

- As a user of <Feature>, I expect that when I <action>, <result> happens.

**Reviewer Note:** <Where the meaningful changes are and what deserves the most attention.>

**Edit:** <Only if the PR changed after the description was written.>
```

Testing should cover the story's acceptance criteria.

Installers are built by the **Release** workflow, which runs only when started from the Actions tab or when a `v*` tag is pushed. A tag also publishes a GitHub release. Participant install steps are in [INSTALLING.md](INSTALLING.md).
