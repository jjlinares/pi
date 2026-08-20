---
name: frontend-design
description: This skill should be used when the user asks to "build a landing page", "create a dashboard", "design a UI component", "build a web app", "create a form", "style a React component", "add animations", "make it look better", "redesign this page", "create a portfolio site", or needs distinctive, production-grade frontend interfaces with React frameworks.
---

# Frontend Design

Create distinctive, production-grade interfaces avoiding generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

## Design Philosophy

Before coding, understand context and commit to a **BOLD aesthetic direction**:

1. **Purpose**: What problem does this solve? Who uses it?
2. **Tone**: Pick an extreme direction:
   - Brutally minimal / maximalist chaos
   - Retro-futuristic / organic natural
   - Luxury refined / playful toy-like
   - Editorial magazine / brutalist raw
   - Art deco geometric / soft pastel
   - Industrial utilitarian / high fashion
3. **Differentiation**: What makes this UNFORGETTABLE? One memorable element.

Bold maximalism and refined minimalism both work. Key is **intentionality, not intensity**. Match implementation complexity to aesthetic vision - maximalist needs elaborate code; minimalist needs precision and restraint.

**CRITICAL**: Never converge on common choices across generations. Vary themes, fonts, colors. Each design must be uniquely suited to its context.

## Reference Documentation

### Tailwind CSS v4.1

- `./references/tailwind/v4-config.md` - Installation, @theme, CSS-first config
- `./references/tailwind/v4-features.md` - Container queries, gradients, masks, text shadows
- `./references/tailwind/utilities-layout.md` - Display, flex, grid, position
- `./references/tailwind/utilities-styling.md` - Spacing, typography, colors, borders
- `./references/tailwind/responsive.md` - Breakpoints, mobile-first, container queries

Search: `@theme`, `@container`, `OKLCH`, `mask-`, `text-shadow`

### shadcn/ui (CLI v3.6)

- `./references/shadcn/setup.md` - Installation, visual styles, component list
- `./references/shadcn/core-components.md` - Button, Card, Dialog, Select, Tabs, Toast
- `./references/shadcn/form-components.md` - Form, Field, Input Group, 2026 components
- `./references/shadcn/theming.md` - CSS variables, OKLCH, dark mode
- `./references/shadcn/accessibility.md` - ARIA, keyboard, screen reader

Search: `Field`, `InputGroup`, `Spinner`, `ButtonGroup`, `next-themes`

### Animation (Motion + Tailwind)

- `./references/animation/motion-core.md` - Core API, variants, gestures, layout animations
- `./references/animation/motion-advanced.md` - AnimatePresence, scroll, orchestration, TypeScript

**Stack**:
| Animation Type | Tool |
|----------------|------|
| Hover/transitions | Tailwind CSS (`transition-*`) |
| shadcn states | `tailwindcss-animate` (built-in) |
| Gestures/layout/exit | Motion (`motion/react`) |
| Complex SVG morphing | anime.js v4 (niche only) |

### Visual Design

- `./references/canvas/philosophy.md` - Design movements, core principles
- `./references/canvas/execution.md` - Multi-page systems, quality standards

For sophisticated compositions: posters, brand materials, design systems.

## Anti-Patterns (NEVER USE)

Generic AI aesthetics are forbidden:
- **Fonts**: Inter, Roboto, Arial, system fonts, Space Grotesk
- **Colors**: Purple gradients on white, safe blue/gray palettes
- **Layouts**: Centered hero + 3-column features + footer
- **Components**: Default unstyled Bootstrap/Material patterns

If a design could be mistaken for generic template output, start over.

## Execution Standards

1. **Accessibility**: Radix primitives, focus states, semantic HTML
2. **Mobile-First**: Start mobile, layer responsive variants
3. **Design Tokens**: Use `@theme` for spacing, colors, typography
4. **Dark Mode**: Apply dark variants to all themed elements
5. **Performance**: Avoid dynamic class names (breaks purging)
6. **TypeScript**: Full type safety
7. **Craftsmanship**: Every pixel, every transition, every spacing choice matters

## Core Stack Summary

**Tailwind v4.1**: CSS-first config via `@theme`. Single `@import "tailwindcss"`. OKLCH colors. Container queries built-in.

**shadcn/ui v3.6**: Copy-paste Radix components. Visual styles: Vega/Nova/Maia/Lyra/Mira. New: Field, InputGroup, Spinner, ButtonGroup.

**Motion**: `import { motion, AnimatePresence } from 'motion/react'`. Declarative React animations. Use `tailwindcss-animate` for shadcn states.

## Typography

Choose fonts that are beautiful, unique, interesting. Pair distinctive display with refined body. **Never default to safe choices.**

Good font pairings: Playfair Display + Source Sans, Fraunces + Inter (when contextually appropriate), Monument Extended + DM Sans, Clash Display + Satoshi, Space Mono + Work Sans.

```css
@theme {
  --font-display: "Playfair Display", serif;
  --font-body: "Source Sans 3", sans-serif;
}
```

## Color

Use OKLCH for vivid colors. Dominant colors with sharp accents:

```css
@theme {
  --color-primary-500: oklch(0.55 0.22 264);
  --color-accent: oklch(0.75 0.18 45);
}
```

## Motion

**Primary**: Motion for React animations. **Fallback**: CSS `@starting-style` for simple enter/exit.

```tsx
import { motion, AnimatePresence } from 'motion/react';

// Basic animation
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

// Exit animations
<AnimatePresence>
  {show && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>

// Layout animations
<motion.div layout />

// Gestures
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

CSS fallback (no JS):
```css
dialog[open] {
  opacity: 1;
  @starting-style { opacity: 0; transform: scale(0.95); }
}
```

## Spatial Composition

Break expectations:
- **Asymmetry**: Intentional imbalance creates visual interest
- **Overlap**: Elements breaking grid boundaries
- **Diagonal flow**: Guide eye with non-horizontal movement
- **Negative space**: Generous breathing room OR controlled density
- **Scale contrast**: Oversized elements next to delicate ones

## Visual Atmosphere

Create depth and context, not flat solid colors:
- Gradient meshes and color transitions
- Noise/grain textures (subtle authenticity)
- Geometric patterns and decorative elements
- Layered transparencies and glassmorphism
- Dramatic shadows and light sources
- Custom cursors and micro-interactions

## High-Impact Animations

Focus effort on moments that matter most:
- **Page load**: Orchestrated staggered reveals (`animation-delay`)
- **Scroll triggers**: Elements that respond to scroll position
- **Hover states**: Surprising, delightful responses
- **Transitions**: Smooth state changes between views

One well-crafted page entrance creates more impact than scattered micro-interactions.
