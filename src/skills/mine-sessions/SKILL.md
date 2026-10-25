---
name: mine-sessions
description: Mine recent Pi sessions for repeated work, corrections, and failures, then propose scripts, checks, skill changes, or instructions that remove them. Use when reviewing past agent work for improvements.
disable-model-invocation: true
---

# Mine sessions

Find work that agents repeat, mistakes the user corrects more than once, and failures that recur across Pi sessions. Propose the cheapest durable fix for each. Prefer a tool or check over more instructions: a script runs the same way every time, and a check catches a broken rule that prose only asks agents to follow.

Propose only. Build nothing until the user picks.

## 1. Digest the sessions

Default scope is the last 14 days across all projects. Honor any days, projects, or exclusions the user gives. Exclude `projects/finance` unless the user asks for it; it holds sensitive personal data.

```bash
scripts/digest.mjs --days 14 --exclude projects/finance [--cwd TEXT]... [--out DIR]
```

It prints the path of `index.md`, which lists every kept session with counts, plus skill use and the most frequent bash commands. Each session gets a digest in `sessions/` with user messages, tool calls, tool errors, and the final reply per turn. The script drops subagent completion notices and the history that forks copy from their parent. Invoked skills appear as `[skill:name]`. Subagent sessions are kept; their names start with `subagent:`.

## 2. Find candidates

Read `index.md` first. If the digests total more than about 150 KB, split them into batches of about 300 KB and give each batch to a read-only subagent in parallel, with the signals and return shape below. Otherwise read them yourself.

Look for these signals:

- **Repeated corrections.** The user says no, wrong, again, or "I said", reverts agent work, or rewrites its output. The same correction in two or more sessions is a candidate.
- **Repeated procedures.** The same command sequence, ad hoc script (`python3` heredocs, polling loops with `sleep`, long `gh` or `kubectl` pipelines), or manual check across sessions.
- **Repeated failures.** The same tool error, failing command, or retry loop.
- **Repeated context.** The user pastes the same background, links, or instructions into new sessions.
- **Skill problems.** A skill was loaded and its guidance was ignored or wrong, a fitting skill was never used, or the user fixed a skill's output by hand.
- **Rediscovery.** Agents spend many calls finding the same facts about a repo or environment.

Return shape per candidate: signal, one-sentence summary, evidence as a list of digest file, turn number, and a short quote, and a suggested fix. Report single occurrences separately as weak candidates.

In `subagent:` sessions, the user message is a brief written by the parent agent. Look there only for repeated procedures, failures, and rediscovery, not corrections.

## 3. Choose the fix form

Pick the first form that fits:

1. **Check:** a lint, test, or validator script, when the rule can be checked mechanically.
2. **Script:** in a skill's `scripts/` when the procedure belongs to that skill, or in a repo's `scripts/` when it belongs to one repo.
3. **Pi extension:** a tool or hook in `~/projects/pi/src/extensions/` when agents need it everywhere, or when a rule must be enforced at tool-call time.
4. **Skill change:** edit a skill, or add one, for judgment-heavy workflows.
5. **Instruction:** a line in an `AGENTS.md`, only for a broad rule that nothing can check.

Pi configuration lives in `~/projects/pi/src/`. Project-specific fixes go in that project's repo.

## 4. Drop what is already fixed

Before you propose a candidate, read the current skill, script, or `AGENTS.md` it would change, and check the git log since the session date. Drop candidates that a later change already fixed.

## 5. Report

Rank candidates by how often they occur times what each occurrence costs, against the cost to build the fix. For each, give:

- What happens, in one or two sentences.
- Evidence: occurrence count, then session files with short quotes.
- The proposed fix, its form, and where it lives.
- Effort: small, medium, or large.

List weak candidates in one short section after the ranked list. End by asking which to build. Delete the digest directory when the run ends; it copies private session content.
