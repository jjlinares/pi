# Docs and instructions

Review whether a doc, recipe, or agent instruction gets its reader to the result it promises.

Useful investigation angles:
- each step followed in a scratch environment with only what the doc provides: missing prerequisites, wrong order, unstated state, commands that fail
- each step reaching its stated result, not merely running without error
- claims about behavior, flags, defaults, paths, and limits checked against the implementation or the installed tool
- examples that would not run, or would produce different output
- links and pointers that do not resolve, or do not contain what they promise
- agent instructions that would lead a capable agent to the wrong action, conflict with each other, or route the wrong tasks

Name the step, what the reader gets, and what the doc says they get. Wording is a finding only when it would mislead the reader.
