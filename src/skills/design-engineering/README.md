# design-engineering

Adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills) at [`f7ce8c0`](https://github.com/emilkowalski/skills/commit/f7ce8c0).

## Local changes

- **Router**: the 18 upstream skills are combined into one skill. `SKILL.md` routes each request to one guide in `references/<name>/GUIDE.md`. Reason: one skill entry instead of 18 in the prompt.
- **Renames**: each upstream `SKILL.md` is now `GUIDE.md`, so harnesses that scan recursively do not load guides as separate skills. `emil-design-eng` is now `ui-polish`, with cross-references updated.
- **Cheatsheets**: the upstream `ui-cheatsheet.md` and `performance-cheatsheet.md` are in `references/`.
