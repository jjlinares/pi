---
name: handoff
description: Summarize the current conversation in a handoff document so another agent can continue. Use when transferring work to a fresh session or preserving context for the next agent.
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Do not duplicate content already captured in other artifacts (plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
