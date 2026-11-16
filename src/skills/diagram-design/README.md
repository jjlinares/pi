# diagram-design

Adapted from [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) `skills/diagram-design` at [`7a2e221`](https://github.com/cathrynlavery/diagram-design/commit/7a2e22170ee838e859d8142ba825d83f8b6375e6) (plugin version 2.6.74).

## Local changes

- **Skill only**: the upstream repository is a plugin package for Pi, Claude Code, Codex, and Factory. Only its skill folder is here. Reason: one skill in `src/skills` instead of an installed package.
- **No slash commands**: upstream's `commands/` (`/export-diagram`, `/import-mermaid`, `/import-drawio`, `/import-excalidraw`, `/doctor`, `/profile`) are not copied. Each only points at a reference in this skill (`references/export.md`, `import-*.md`, `doctor.md`, `profiles.md`), so ask for the task in words or with `/skill:diagram-design`. `references/doctor.md` still names those commands and repository-only checks.
- **No repository scripts**: upstream's `scripts/verify-*.py` are not copied. `SKILL.md` asks for them only "from a repository checkout", so those checks are skipped here.
- **Description**: rewritten. Upstream's listed every diagram type, about 900 characters. Reason: short routing text in the prompt; the types are in `SKILL.md`.
- **Licenses**: upstream's `license` frontmatter field is removed, and its `LICENSE` and `THIRD_PARTY_LICENSES.md` are not copied. Upstream is MIT and bundles Tabler Icons, Simple Icons, log-z/logos, and Devicon. Reason: private skill.

## Dependencies

- `python3` for `scripts/` (standard library only).
- Playwright with Chromium for PNG export only. Not installed by the skill.
- Diagrams link Google Fonts unless made with system fonts.
