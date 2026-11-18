---
name: create-pr
description: Prepare, open, and merge pull requests. Use when asked to create, submit, or merge a PR.
---

# Create PR

Write a concise, human-readable title that explains why the change matters.

- Conventional commit titles, plain language: `fix(web): new threads no longer spike CPU`.
- Body: the problem in a sentence or two, then how you fixed it. End with the model and harness that did the work.
- Rebase onto latest main before opening. Stale branches conflict and burn a review round.
- UI changes need before/after images. Motion or timing needs a short video.
- One concern per PR. If the description says "also", split it into stacked PRs.

Examples:

BAD
> ❌ perf(server): negotiate permessage-deflate on the websocket

GOOD
> ✅ perf(server): cut websocket frame size by 70%+ with gzipping

Open the description with a simple explanation of the problem based on the user's original prompt, then briefly explain the solution. Do not lead with an implementation inventory.

BAD
> ❌ Removed implicit workspace carry-over from every "new thread" entry point (cmd+n / cmd+shift+o, sidebar v1/v2 buttons, command palette). New threads inherit only the project from context; branch, worktree, and env mode always come from the configured defaults. Deleted buildContextualThreadOptions, startNewThreadInProjectFromContext, and the v1 sidebar's seed-context machinery.

GOOD
> ✅ My "new worktree" default was ignored when starting new threads on existing worktrees. Super unintuitive. Now your preferences always apply.

## Merge

Merge only when the user asks. From the repo or a worktree, run this skill's `scripts/merge-pr [PR]`; it defaults to the current branch's PR. It waits for checks on the current head, squash-merges on GitHub pinned to that head, keeps the branch, fast-forwards the local base branch when safe, and prints the merge commit SHA. Do not merge with git or a bare `gh pr merge`. If it exits non-zero, report its message instead of working around it.
