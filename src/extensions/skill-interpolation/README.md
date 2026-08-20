# pi-skill-interpolation-local

Shell interpolation for Pi skills.

A skill opts in with `allowed-tools` frontmatter, then `!`command`` blocks are replaced before the model sees the skill.

```markdown
---
name: pr-summary
description: Summarize current PR
allowed-tools: Bash(git:*) Bash(gh:*)
---

Branch: !`git branch --show-current`
Files: !`gh pr diff --name-only`
```

## Behavior

- `/skill:name` invocations are intercepted before Pi's built-in skill expansion.
- `read` results for markdown files are also interpolated when the file frontmatter opts in.
- Commands run from the skill file directory.
- Default timeout: 10s per command.
- Default output cap: 50KB / 2000 lines.
- Failures render inline as `[error: ...]`.

## Security model

No `allowed-tools` Bash entry, no interpolation.

- `allowed-tools: Bash` allows any interpolation command.
- `allowed-tools: Bash(git:*) Bash(gh:*)` only allows commands matching those command prefixes.

This is still shell execution from markdown. Treat opted-in skills as executable code.
