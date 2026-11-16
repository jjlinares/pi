# design-engineering

Adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills) at [`64eb3de`](https://github.com/emilkowalski/skills/commit/64eb3de).

## Local changes

- **Router**: the 18 upstream skills are combined into one skill. `SKILL.md` routes each request to one guide in `references/<name>/GUIDE.md`. Reason: one skill entry instead of 18 in the prompt.
- **Renames**: each upstream `SKILL.md` is now `GUIDE.md`, so harnesses that scan recursively do not load guides as separate skills. `emil-design-eng` is now `ui-polish`. Links and mentions of `SKILL.md` inside guides point to `GUIDE.md`.
- **No `ask-emil`**: upstream's router skill is not copied. `SKILL.md` already routes.
- **No greeting**: each guide's "Initial Response" section is removed. Reason: a routed guide should start on the task.
- **No attribution in prose**: sentences crediting Emil Kowalski's philosophy are reworded or removed, and guide descriptions drop it. Links to his essays and libraries stay.
- **Cheatsheets**: the upstream `ui-cheatsheet.md` and `performance-cheatsheet.md` are in `references/`.
