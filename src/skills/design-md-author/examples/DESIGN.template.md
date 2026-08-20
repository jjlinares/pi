---
version: alpha
name: Example-design-analysis
description: A concise implementation-grade summary of the visual language — name the dominant canvas, primary accent, typography attitude, shape system, density, and one or two signature motifs. Keep this specific enough that an agent can imitate the style without seeing the original site.

colors:
  primary: "#000000"
  primary-hover: "#222222"
  ink: "#111111"
  body: "#444444"
  body-muted: "#777777"
  canvas: "#ffffff"
  canvas-soft: "#f7f7f7"
  hairline: "#e5e5e5"
  on-primary: "#ffffff"
  error: "#d92d20"

typography:
  display-xl:
    fontFamily: "Example Sans, system-ui, -apple-system, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -1.8px
  display-lg:
    fontFamily: "Example Sans, system-ui, -apple-system, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1px
  body-md:
    fontFamily: "Example Sans, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Example Sans, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: 0
  button-md:
    fontFamily: "Example Sans, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 16px
  pill: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "12px 20px"
  card-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

## Overview

Describe the source design as a reproducible system. Include canvas, accent behavior, type voice, density, radius, elevation, imagery/illustration, and signature motifs.

**Key Characteristics:**
- Characteristic one with token references.
- Characteristic two with implementation values.
- Characteristic three that prevents generic UI.

## Colors

### Brand & Accent
- **Primary** (`{colors.primary}` — `#000000`): Explain role and exact usage.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Default page/card surface.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f7f7f7`): Section band or inset surface.

### Text
- **Ink** (`{colors.ink}` — `#111111`): Headings and high-priority text.
- **Body** (`{colors.body}` — `#444444`): Paragraphs and secondary text.

### Semantic
- **Error** (`{colors.error}` — `#d92d20`): Validation/destructive state.

## Typography

### Font Family
Document primary face, secondary face, weight range, casing, tracking, and substitutes.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---:|---:|---:|---:|---|
| `{typography.display-xl}` | 56px | 600 | 1.05 | -1.8px | Hero headline. |
| `{typography.display-lg}` | 40px | 600 | 1.1 | -1px | Section headline. |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Body copy. |
| `{typography.caption}` | 12px | 500 | 1.35 | 0 | Labels and metadata. |

### Principles
- State tracking/casing/weight rules.
- State where each face must and must not appear.

### Note on Font Substitutes
List open-source/system alternatives.

## Layout

### Spacing System
Document base unit, token scale, section padding, card padding, and inline gaps.

### Grid & Container
Document max width, gutters, columns, and common grid patterns.

### Whitespace Philosophy
Explain density and rhythm.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 | No shadow; optional hairline. | Flat sections. |
| Level 1 | 1px border plus subtle shadow. | Cards and popovers. |

### Decorative Depth
Describe gradients, image layers, glows, shadows, or intentional flatness.

## Shapes

### Border Radius Scale
Document radius use by component.

### Image Geometry
Document aspect ratios, crops, masks, borders, and object-fit rules.

## Components

### Buttons
Describe primary, secondary, ghost, icon, hover/focus/active/disabled.

### Cards & Containers
Describe padding, border, shadow, radius, media, and content rhythm.

### Inputs & Forms
Describe labels, fields, focus rings, errors, helper text.

### Navigation
Describe nav height, link style, active state, mobile collapse.

### Signature Components
Describe source-specific motifs.

## Do's and Don'ts

### Do
- Use exact signature tokens and spacing.

### Don't
- Add generic gradients, glassmorphism, arbitrary rounded cards, or colors not in the palette.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---:|---|
| Mobile | < 640px | Stack grids; collapse nav. |
| Tablet | 640–1023px | Use 2-column grids. |
| Desktop | ≥ 1024px | Use full layout. |

### Touch Targets
State minimum target dimensions.

### Collapsing Strategy
Describe nav, hero, cards, media, forms.

### Image Behavior
Describe crop and aspect changes.

## Iteration Guide

Use these rules when extending the UI:
- Rule one.
- Rule two.

## Known Gaps

- List estimated values, missing states, inaccessible pages, proprietary fonts, or unverified breakpoints.
