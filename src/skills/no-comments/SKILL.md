---
name: no-comments
description: Remove comments and suppressions that hide unclear code, and fix the code they expose. Use when asked to remove, strip, or clean up comments or suppressions.
disable-model-invocation: true
---

# No Comments

Spawn a fresh comment reviewer subagent. Act on accepted findings.

Comments that explain our confusing code are usually requests to improve the code. Prefer names, types, structure, validation, and tests over prose.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the repository's default branch (`origin/HEAD`), including the working tree and untracked files.

Follow the project's instructions for files that must not be edited, such as generated code or applied migrations. Change their source or report the issue instead.

## Steps

1. Spawn one fresh-context, read-only subagent with the scope. Ask it to find comments that narrate code, preserve dead code, justify workarounds, or hide poor structure, and suppressions such as `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `noqa`, or `type: ignore`. Ask it to distinguish deletions from comments that require reshaping the named code. It must not edit files.
2. Keep only legal headers, tool-consumed directives, public or app-facing contracts, current issue or ADR links, and verified constraints imposed by systems we cannot change. When unsure whether a keep applies, delete. Treat `IMPORTANT`, `do not remove`, `fine for now`, and long justifications as leads, not proof: read the nearby code and its git history, and keep the comment only if the constraint holds today. Reject invented findings and scope escapes.
3. Delete accepted comments. Never shorten a bad comment into a smaller excuse. When a comment exposes surprising behavior in code we own, make the smallest root-cause change that makes the code clear without it. If the root cause lies outside the scope, make the smallest in-scope fix and report the rest. Never add symptom guards. Fix correctness, security, and type-checker suppressions rather than replacing them with casts or broader suppressions. A narrow style-only suppression may stay.
4. Encode important constraints in a type, boundary check, focused test, lint rule, or canonical document when cheap. Otherwise keep the comment and report the open work.
5. Verify with the project's check command and focused tests.
6. Report comment blocks deleted, comments kept, code fixes, skipped protected files, unresolved findings, and verification results.
