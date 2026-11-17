---
name: mine-sessions
description: Review recent Mel threads for repeated work, repeated corrections, and recurring failures, then propose checks, scripts, skill changes, or instructions that remove them. Use when asked to mine past agent work for workflow improvements.
disable-model-invocation: true
---

# Mine sessions

Find work that agents repeat, mistakes the user corrects more than once, and failures that recur across Mel threads. Propose the cheapest durable fix for each. Prefer a tool or check over more instructions: a script runs the same way every time, and a check catches a broken rule that prose only asks agents to follow.

Propose only. Build nothing until the user picks.

## 1. Digest the threads

Default scope is the last 14 days across all projects. Honor any days, projects, or exclusions the user gives. Exclude the finance project (folder `projects/finance`) unless the user asks for it; it holds sensitive personal data.

```bash
scripts/digest.mjs --days 14 --exclude projects/finance [--project TEXT]... [--out DIR]
```

The script reads Mel's API on `127.0.0.1:1370`, so it works only from a thread whose project is on the Mel server's machine. If it cannot reach Mel, say so and stop. It reads threads that are not archived and keeps only turns from the time window.

It prints the path of `index.md`, which lists every kept thread with its tree, kind, and counts, plus skill use, tool use, and the most frequent bash commands. Each thread gets a digest in `threads/<id>.md`. Threads with a parent are kept and placed next to the threads above them. Digests over 80 KB are compacted. The script skips earlier mining runs and the reviewers they started. It also writes `batch-N.txt` files of about 300 KB each.

## 2. Find candidates

Read `index.md` first. [`references/brief.md`](references/brief.md) defines the signals to look for and the reply shape.

With one batch, follow the brief yourself. With more, start one reviewer per batch with `agent_start`: agent `Minion`, title `mine-sessions batch N`, brief "Follow `<absolute path to references/brief.md>`. Work read-only. Your batch: `<absolute path to batch-N.txt>`." Start them all without `wait`: the calls return at once, and each answer arrives later as a report message. End your turn after starting them, and merge once every batch has reported. The same pattern often appears in several batches.

## 3. Choose the fix form

Pick the first form that fits:

1. **Check:** a lint, test, or validator, when the rule can be checked mechanically.
2. **Script:** in a skill's `scripts/` when the procedure belongs to that skill, or in a repo's `scripts/` when it belongs to one repo.
3. **Mel change:** in `~/projects/mel`, when Mel itself causes the problem, or every thread needs a tool or a rule enforced at tool-call time.
4. **Skill change:** edit a skill, or add one, for judgment-heavy workflows. Skills are authored in `~/projects/pi/src/skills/`; the user imports them into Mel in Settings > Skills.
5. **Instruction:** only for a broad rule nothing can check. Put it in the narrowest place that covers it: a project's `AGENTS.md`, one agent's instructions (Settings > Agents), or the Mel system prompt (Settings) for every thread.

## 4. Drop what is already fixed

Before you propose a candidate, read the current check, script, skill, or instructions it would change, and check the git log since the thread's date. Drop candidates a later change already fixed. A skill fixed in `~/projects/pi` but not yet imported into Mel is not live; say so instead of dropping it.

## 5. Report

Rank candidates by how often they occur times what each occurrence costs, against the cost to build the fix. For each, give:

- What happens, in one or two sentences.
- Evidence: occurrence count, then thread IDs and turns with short quotes.
- The proposed fix, its form, and where it lives.
- Effort: small, medium, or large.

List weak candidates in one short section after the ranked list. End by asking which to build. Delete the digest directory when the run ends; it copies private thread content.
