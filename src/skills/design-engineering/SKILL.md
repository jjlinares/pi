---
name: design-engineering
description: Apply design-engineering guidance to UI polish and motion. Use when building, reviewing, auditing, adding, removing, or fixing web or React Native animations; drag, swipe, and sheet gestures; janky motion; mobile-web feel; worst-case UI data; Apple-style fluid interfaces; or modern Swift.
---

# Design Engineering

Router for design-engineering guides. Each guide lives in `references/<name>/GUIDE.md` and was written as a standalone skill.

## Routing

Pick the guide that matches the request. Read only that guide, then any file it links. Resolve links relative to the guide's directory. When a guide refers to another skill by name, such as `review-animations`, read `references/<name>/GUIDE.md`.

| Request | Guide |
| --- | --- |
| Build a web animation or transition | `animate` |
| Build animation, gestures, haptics, or screen transitions in React Native or Expo | `animate-expo` |
| Coordinate several moving elements: stagger, sequence, crossfade, hero or list entrance | `choreograph` |
| Build or fix drag, swipe, fling, sheet, drawer, or hold gestures on the web | `gestures` |
| Fix animations that stutter or drop frames, or choose properties for performance | `animation-performance` |
| Find places that should animate (read-only proposals) | `find-animation-opportunities` |
| Remove or tone down excess animation | `remove-animations` |
| Audit a codebase's motion and write implementation plans (read-only) | `improve-animations` |
| Review specific animation or motion code | `review-animations` |
| Name a motion effect the user describes | `animation-vocabulary` |
| Apple-style fluid interfaces: springs, momentum, materials, typography | `apple-design` |
| Make a web app feel native on phones | `mobile-native` |
| Stress-test UI with worst-case data | `break-ui` |
| Set up, style, or troubleshoot Sonner | `ask-sonner` |
| Write, review, or migrate Swift | `write-swift` |
| General UI polish, component design, or design taste | `ui-polish` |
| Recommend a frontend library | `pick-ui-library` |
| Build several UI variants behind a picker | `prototype` |
| Turn this session's design corrections into rules | `learn-taste` |

If a request spans guides, start with the one for the primary outcome and load others only when their decisions are needed.

`review-animations`, `pick-ui-library`, `prototype`, and `learn-taste` are explicit-only. Use them only when the user asks for that workflow, not as a side step of another task.

For a quick symptom-to-fix lookup, see [references/ui-cheatsheet.md](references/ui-cheatsheet.md) and [references/performance-cheatsheet.md](references/performance-cheatsheet.md).
