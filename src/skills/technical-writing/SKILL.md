---
name: technical-writing
description: Write and review technical prose using Diátaxis structure and a few clarity rules. Use for docs, RFCs, or READMEs.
disable-model-invocation: true
---

# Technical writing

Write so a tired engineer understands on the first read.

## Pick the mode first (Diátaxis)

One document, one mode. Two questions pick it: does the content inform action or understanding, and does it serve learning or work?

- Action + learning: **tutorial**.
- Action + work: **how-to**.
- Understanding + work: **reference**.
- Understanding + learning: **explanation**.

**Tutorial: learning by doing.** The learner's success is your job, not theirs. Open with what they will build. Every step produces a visible result. Tell them what they should see: the expected output, the prompt change, the log line. Cut explanation to one clause and a link.

**How-to: steps to a goal.** Solve a problem the reader has, not an operation the machine can perform. Assume competence. Action only: no digressions, no background, no completeness for its own sake; link those instead. Allow forks: "If you want x, do y." Name the guide by the task: "How to calibrate the radar array", not "Radar array calibration".

**Reference: facts for lookup.** Describe only: no instruction, persuasion, or opinion. Be complete and sure. Mirror the structure of the thing described, so code and docs can be navigated together. Generate from code where possible.

**Explanation: understanding and why.** One bounded topic, readable away from the product. Anchor on a real why question. Give context: design decisions, history, constraints, alternatives. Opinion belongs here and nowhere else.

Don't mix modes: no reference tables inside a tutorial, no tutorial hand-holding inside reference, no arguing inside a how-to. Split and link instead.

## Rules agents still miss

- Use the real symbol, file, flag, or command name, not a synonym or a description of it.
- Don't invent jargon. Define a named pattern the first time you use it.
- Be specific: "a column rename fails the build", not "schema changes can cause issues".
- Use the short, everyday word: "use", not "utilize"; "help", not "facilitate".
- Make every count or tree claim true at the commit that lands it, and include the command that regenerates it.

## Worked example

Before:

> Configuration of the proto import ratchet budget script parameters is performed via budget.json. Note that it's important to remember that running with --write, which updates the committed budget to reflect the current count, should only be done when lowering it. If exceeded, CI fails.

After:

> `budget.mjs` reads the committed budget from `budget.json` and counts the files that import protos. If the count exceeds the budget, CI fails. Run `budget.mjs --write` only to lower the budget.
