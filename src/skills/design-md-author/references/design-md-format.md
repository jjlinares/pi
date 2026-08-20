# DESIGN.md Format Reference

## Canonical Structure

Use this skeleton:

```markdown
---
version: alpha
name: Brand-design-analysis
description: One dense paragraph describing the recognizable visual language.

colors:
  primary: "#000000"

typography:
  display-xl:
    fontFamily: "Font, system-ui, sans-serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: -2px

rounded:
  sm: 4px

spacing:
  sm: 8px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm} {spacing.md}"
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
## Responsive Behavior
## Iteration Guide
## Known Gaps
```

## Frontmatter Rules

Keep frontmatter tokenized and reusable:
- `version`: usually `alpha`.
- `name`: source name plus `design-analysis`.
- `description`: single paragraph, 2–4 sentences, high-density visual summary.
- `colors`: semantic roles with hex values from site evidence where possible.
- `typography`: complete type tokens with family, size, weight, line height, letter spacing.
- `rounded`: radius scale from none/small to pill/full.
- `spacing`: practical spacing scale.
- `components`: reusable UI recipes that reference token groups.

Prefer token references over repeated raw values inside `components`.

### Inferred Value Callouts

Mark only inferred values. Do not label observed/computed values as exact. Absence of an inferred callout means the value came from site evidence such as CSS variables, computed styles, assets, or screenshots.

Use inline YAML comments for inferred tokens:

```yaml
typography:
  display-logo:
    letterSpacing: 8px # inferred from SVG/logo appearance

spacing:
  section: 96px # inferred normalized large section rhythm
```

Use prose/table callouts for inferred narrative values:

```markdown
| Mobile | < 640px (inferred) | Stack grids; collapse nav. |
```

List all inferred tokens again in `Known Gaps` so future agents know where not to over-trust the values.

## Markdown Section Requirements

### Overview
Summarize the brand's design posture. Name the strongest visual signatures: canvas color, type attitude, accent use, density, shape, image treatment, motion/depth if relevant.

### Colors
Group by role: Brand & Accent, Surface, Text, Semantic, Gradient if applicable. For every color, include token name, hex, and usage. Avoid dumping swatches with no role.

### Typography
Document font families, hierarchy table, principles, and substitutes. Include use cases for each token. State casing, tracking, weight limits, and where mono/serif/display faces belong.

### Layout
Document base spacing unit, section padding, grid/container width, column patterns, whitespace philosophy, and density rules.

### Elevation & Depth
Define shadow/border levels and where each appears. If the brand is flat, say so and define the flatness as a rule.

### Shapes
Document radius scale, pill behavior, image/card geometry, icon container shape, avatar shape, and any sharp-corner exceptions.

### Components
Describe buttons, cards, inputs/forms, navigation, chips/tags, modals, tables, and signature brand-specific components. Include states when visible.

### Do's and Don'ts
Write specific guardrails. Bad: "Do make it clean." Good: "Do use one electric-blue CTA per viewport; don't add purple gradients or rounded glassmorphism cards."

### Responsive Behavior
Provide breakpoint table and collapse rules. Cover nav, hero, grids/cards, images, and touch targets.

### Iteration Guide
Give concrete prompts an agent can use to build in the style. Include quick rules for extending pages without breaking the language.

### Known Gaps
List uncertain values, inaccessible proprietary fonts, missing states, untested breakpoints, and estimated tokens. Include every inferred value already called out inline. Do not create a parallel "exact values" list.

## Extraction Checklist

Before writing, inspect:
- Homepage hero, nav, footer.
- Product/feature page cards.
- Pricing or form page if available.
- Mobile viewport.
- Hover/focus states if possible.
- CSS variables and loaded font files.
- Repeated motifs: gradients, lines, photography, illustrations, icons, grids.
- Values that could not be observed but are useful as normalized design tokens; mark these with `# inferred` and repeat them in `Known Gaps`.

## Writing Rules

Write like a design engineer, not a marketer:
- Use observed values where available.
- Use token references.
- Explain where each choice appears.
- State prohibitions.
- Mark inferred values only; do not label observed values as exact.
- Keep prose dense and useful.

Avoid:
- Generic adjectives without implementation meaning.
- Invented colors unsupported by evidence.
- Huge exhaustive CSS dumps.
- Components with no states or usage.
- Brand worship. Extract the system; don't advertise it.
