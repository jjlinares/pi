---
name: show-with-html
description: Explain concepts, systems, comparisons, or analysis in a visual HTML page.
disable-model-invocation: true
---

# Show with HTML

Create an HTML page when it will communicate with the user more clearly than Markdown. Treat the page as the answer, not as an incidental attachment. Exercise judgment over its design, structure, behavior, and dependencies.

## Communication

- This is not a landing page.
- Skip the preamble and keep prose brief.
- Use the smallest set of views that makes the key point clear.
- Use real labels and data when available.
- Place supporting text beside the visual it explains.
- Include only details needed for the current question.
- Combine visual forms when useful, but do not overwhelm the user.

## Composition follows the question

- Identify what the reader needs to understand, compare, or manipulate. Make that answer, relationship, or working tool the focus of the first viewport, not an oversized title and introduction.
- Choose geometry before components: aligned columns for alternatives, connections for dependencies, sequence for a process, shared scales for magnitude, and controls beside results for a model the reader can explore. Use prose when a visual adds no understanding.
- Reject the obvious template unless the material earns it. When the structure is unclear, compare two genuinely different arrangements, not two palettes for the same card grid.
- Give each major view one focal relationship. Supporting objects should explain it rather than compete with it. Equal boxes imply equal importance; rank or group materially unequal findings instead.
- Support a quick read through headings, decisive values, and captions. Keep exact records, assumptions, and methodology available below or in disclosure when needed, without making them compete with the explanation.
- Give each claim one primary home. Every additional section or view must answer a new question, not repeat the same summary in another format.

## Visual hierarchy and restraint

- Compose a continuous canvas using shared edges, alignment, typography, and spacing. Add a card, surface, or border only for a real grouping, interaction, selection, or warning that spacing cannot communicate.
- Make spacing express relationships: tight within a group, larger between groups. Let one container own each gap. Rebalance underfilled columns instead of leaving accidental empty rectangles.
- Keep equivalent labels, values, and comparison rows aligned and typographically consistent. Give prose a readable measure, but let diagrams, tables, and other evidence use the width they need.
- Start with a restrained palette. Use color to encode meaning or direct attention, with a non-color cue where interpretation depends on it. Strengthen a weak focal point through scale, position, or contrast rather than adding decoration.
- Avoid generic centered heroes followed by card grids, repeated metric boxes, metadata pills, decorative eyebrows, icon tiles, nested panels, gradients, glows, and ornamental shadows. Use a specific visual relationship from the subject instead.
- Restraint is not a sparse template. Vary density where the material calls for it; preserve readable text and a clear focal point rather than shrinking everything or adding large empty margins.

## Evidence and interaction

- Choose tables for exact lookup and charts for relationships that become faster to understand visually. Use diagrams to expose structure, not to repeat a paragraph as boxes.
- Keep comparable values on a shared basis. Show units and material qualifiers near the evidence. Length encodings normally start at zero; clearly label any range or delta view. Repeated bars share label, plot, and value lanes, with only the encoded length changing.
- Prefer direct chart labels. Give labels their own space, and use captions for the takeaway or limitation. Distinguish observations from projections and recommendations; never invent certainty to make the page more decisive.
- Align numerical table headers and cells consistently, preserve comparable precision, and give evidence tables the available width before shrinking text or wrapping short labels.
- Add interaction only when it removes work or reveals something: filtering evidence, tracing a dependency, changing an assumption, or inspecting detail. Keep controls beside the result they affect and start from a useful visible state.
- For calculators, derive outputs from one full-precision state and format afterward. Preserve invalid input with feedback rather than silently replacing it. Use labeled, keyboard-accessible controls. Motion should explain a change, not delay reading.

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

## Design review

When inspecting the rendered page:

- Check the first viewport: does it explain the central relationship or expose the useful tool, rather than merely announce the topic?
- Squint or blur the text mentally. The focal point, grouping, and reading order should remain apparent. If every block has equal weight, change the composition.
- Remove any section, surface, icon, or effect that adds no meaning or useful behavior. Fix accidental whitespace and competing emphasis before polishing details.

Keep this review internal unless requested. Deliver the explanation, not a design-process report.

## Output

- Write to the requested path. Otherwise, use a descriptive timestamped filename in `${TMPDIR:-/tmp}`.
- Open the completed file in browser.
- Return a link or path to the file without repeating the page in chat. If opening or inspecting it was unavailable, say so.
