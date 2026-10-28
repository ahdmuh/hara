# Development

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
