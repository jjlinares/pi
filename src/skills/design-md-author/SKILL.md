---
name: design-md-author
description: This skill should be used when the user asks to "create a DESIGN.md", "write a DESIGN.md", "make a DESIGN.md like awesome-design-md", "extract a design system", "analyze a website's design language", "create design tokens from a website", "document UI style", or "turn this brand/site into DESIGN.md".
version: 0.1.0
---

# DESIGN.md Author

Prefer browser automation for website-derived design docs. If the `browser` skill / CDP / Playwright / Puppeteer / DevTools-style access is unavailable for a live website, stop and tell the user reliable token extraction needs an inspectable browser or equivalent tool; screenshots alone only support approximation.

Create implementation-grade `DESIGN.md` files that let coding/design agents reproduce a visual language from tokens, rules, and guardrails.

A good `DESIGN.md` is not brand fluff. It is a compact design-system spec: YAML token catalog first, then markdown instructions explaining where tokens appear, how layouts behave, what to imitate, and what to avoid.

## Use Cases

Use this skill to:
- Create a new `DESIGN.md` from a public website, product, app, screenshot set, or existing UI.
- Improve a weak `DESIGN.md` with better tokens, clearer component rules, or sharper do/don't guidance.
- Match the `awesome-design-md` repository style: tokenized frontmatter plus detailed narrative sections.
- Produce a project-local design contract for agents building UI.

## Required Output Shape

Write one file named `DESIGN.md` unless the user requests another path.

Use this order:
1. YAML frontmatter delimited by `---`.
2. `version`, `name`, `description`.
3. Token groups: `colors`, `typography`, `rounded`, `spacing`, `components`.
4. Closing `---`.
5. Markdown sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts, Responsive Behavior, Iteration Guide, Known Gaps.

Consult `references/design-md-format.md` for the canonical structure and quality rules. Start from `examples/DESIGN.template.md` when no existing file exists.

## Workflow

### 1. Confirm the Target

Identify the source brand/site/app and available evidence. If the target is ambiguous, ask for one source URL or screenshots. If the user wants a repo-local style, inspect existing UI files, CSS variables, Tailwind config, components, and screenshots before writing.

### 2. Collect Visual Evidence

Extract real values whenever possible:
- Colors from CSS variables, computed styles, SVGs, screenshots, or browser devtools.
- Typography from loaded fonts, computed `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`.
- Radius, spacing, shadows, borders, grid widths, breakpoints, and component dimensions from CSS/computed styles.
- Component states: hover, focus, active, disabled, selected, error, success.

Use browser automation when available for public websites. Capture at least desktop and mobile evidence when responsive behavior matters.

### 3. Build the Token Catalog

Name tokens semantically, not visually-only. Prefer `primary`, `ink`, `canvas`, `hairline`, `surface-soft`, `body-muted`, `button-primary`, `card-feature`, `nav-link`. Avoid meaningless names like `blue1` unless the source system uses them.

Reference tokens inside components with `{colors.*}`, `{typography.*}`, `{rounded.*}`, and `{spacing.*}`. Keep YAML practical, not exhaustive. Include tokens needed to rebuild the visible interface.

Mark inferred values only. Do not label observed/computed values as "exact". Use inline YAML comments for inferred token values, e.g. `section: 96px # inferred normalized section rhythm` or `letterSpacing: 8px # inferred from SVG/logo appearance`. In prose, say "inferred" only where the value is normalized, estimated, conventional, or visually derived.

### 4. Write the Narrative Spec

Explain the design language in concrete terms:
- What makes the brand recognizable.
- Which colors do real jobs.
- Which typographic choices carry the voice.
- How spacing, grid, density, elevation, and shapes behave.
- Which components are signature.
- What agents must never do when imitating the style.

Use direct, implementation-grade language. Prefer: "Use 1px hairlines and stacked low-opacity shadows for cards." Avoid: "The design feels modern and clean."

### 5. Mark Uncertainty Honestly

Do not fabricate precision when evidence is missing. Use best estimates only when needed. Mark those values as inferred inline where they appear and list them under `Known Gaps`.

Use this pattern:
- Observed/computed/CSS values: write the value with no label.
- Inferred/normalized/estimated values: append `# inferred ...` in YAML and mention "inferred" in prose/tables.
- `Known Gaps`: collect every inferred token, unverified state, inaccessible page, proprietary font, or untested breakpoint.

Examples:
```yaml
spacing:
  section: 96px # inferred normalized large section rhythm

typography:
  display-logo:
    letterSpacing: 8px # inferred from SVG/logo appearance
```

### 6. Validate

Run:

```bash
python3 "$HOME/.pi/agent/skills/design-md-author/scripts/validate_design_md.py" DESIGN.md
```

Fix reported errors before finalizing. Warnings may remain only when intentionally scoped.

## Quality Bar

A finished `DESIGN.md` must:
- Contain exact hex colors and pixel/rem values where available.
- Include typography hierarchy with sizes, weights, line heights, tracking, and use cases.
- Define reusable component tokens, not just prose descriptions.
- Explain responsive behavior with breakpoints and collapse rules.
- Include do/don't guardrails specific enough to prevent generic AI UI.
- Name any missing evidence under `Known Gaps`.

## Additional Resources

- `references/design-md-format.md` — Canonical structure, writing rules, extraction checklist.
- `examples/DESIGN.template.md` — Starter file matching the expected format.
- `scripts/validate_design_md.py` — Lightweight structural validator.
- `scripts/test_validate_design_md.py` — Unit tests for the validator.
