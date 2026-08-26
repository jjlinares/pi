---
name: show-with-html
description: This skill should be used when a visual, interactive, or spatial HTML explanation would communicate a complex concept, idea, system, comparison, or analysis more clearly than Markdown, or when the user asks to create an HTML page.
disable-model-invocation: true
---

# Show with HTML

Create an HTML page when it will communicate with the user more clearly than Markdown. Treat the page as the answer, not as an incidental attachment. Exercise judgment over its design, structure, behavior, and dependencies. Do not assume a visual style beyond what the content or user requests.

## Communication

- This is not a landing page.
- Skip the preamble and keep prose brief.
- Use the smallest set of views that makes the key point clear.
- Use real labels and data when available.
- Place supporting text beside the visual it explains.
- Include only details needed for the current question.
- Combine visual forms when useful, but do not overwhelm the user.

## Implementation

- Prefer Tailwind CSS via CDN for styling.
- Keep the HTML file small. Use other CDN libraries when they avoid substantial embedded CSS or JavaScript:
  - **Mermaid:** Flowcharts, sequence diagrams, state diagrams, and dependency graphs.
  - **Chart.js:** Bar, line, pie, doughnut, scatter, and radar charts.
  - **Observable Plot:** Concise data visualizations.
  - **Tabulator:** Sortable, filterable, interactive tables.
  - **highlight.js:** Syntax highlighting for code blocks.
  - **KaTeX:** Math rendering.
  - **Lucide:** SVG icons.
  - **Alpine.js:** Lightweight interactions such as tabs, toggles, filters, and disclosure panels.

## Output

- Write to the requested path. Otherwise, use a descriptive timestamped filename in `${TMPDIR:-/tmp}`.
- Open the completed file in browser.
