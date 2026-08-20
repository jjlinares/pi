---
name: create-html
description: This skill should be used when the user asks to "create an HTML page", "make an HTML file", "generate local HTML", "create a standalone HTML document", or wants small well-designed HTML without a build step.
version: 0.1.0
---

# Create HTML

Create small, local HTML files that look good without a build system. Use CDN-loaded Tailwind CSS for styling. Add other CDN libraries only when the content needs them.

This skill is about **file mechanics and compact HTML authoring**, not deciding how to visualize a domain concept.

## Defaults

- Write generated files to `${TMPDIR:-/tmp}` unless the user asks for a repo file.
- Use a timestamped filename: `<name>-<timestamp>.html`.
- Open generated HTML files with `xdg-open <path>`; otherwise use the OS-appropriate HTML opener.
- Tell the user the absolute path.
- Do not create React/Vite/etc. unless explicitly requested.
- Keep custom CSS tiny. Prefer Tailwind utility classes.

## Minimal shell pattern

```bash
tmp=${TMPDIR:-/tmp}
path="$tmp/page-$(date +%Y%m%d-%H%M%S).html"
cat > "$path" <<'HTML'
<!doctype html>
<html lang="en">
  <!-- content -->
</html>
HTML
xdg-open "$path" >/tmp/html-open.log 2>&1 || true
printf '%s\n' "$path"
```

## HTML scaffold

Use this as the default skeleton:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Title</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Optional tiny custom CSS for things Tailwind cannot express cleanly. */
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900">
    <main class="mx-auto max-w-5xl px-6 py-12">
      <header>
        <h1 class="text-4xl font-semibold tracking-tight">Title</h1>
      </header>

      <section class="mt-8 grid gap-6 lg:grid-cols-2">
        <article class="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 class="text-2xl font-semibold">Card title</h2>
          <p class="mt-3 text-slate-700">Card body.</p>
        </article>
      </section>
    </main>
  </body>
</html>
```

## Tailwind CDN usage

Load Tailwind with:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Then style with Tailwind utility classes instead of writing large CSS files. Choose classes freely for the content and tone; no house component system is required. The point is to leverage the CDN to keep the generated file small.

Use Tailwind heavily:

- Compose layout with classes: `mx-auto`, `max-w-*`, `grid`, `flex`, `gap-*`, `space-y-*`, responsive prefixes like `md:` and `lg:`.
- Build visual hierarchy with typography classes: `text-*`, `font-*`, `tracking-*`, `leading-*`, `text-slate-*`.
- Use cards, panels, badges, callouts, and sections as repeated HTML snippets, not custom CSS abstractions.
- Keep custom CSS for awkward cases only: gradients, dashed SVG strokes, absolute-positioned arrows, print tweaks.
- Avoid large `<style>` blocks. If a visual can be expressed clearly with Tailwind classes, use classes.

## Optional CDN libraries

Load only what the content needs. Tailwind is the default; everything else is optional.

- **Mermaid** — text-authored flowcharts, sequence diagrams, state diagrams, dependency graphs.
- **Chart.js** — simple bar, line, pie, doughnut, scatter, and radar charts.
- **Observable Plot** — elegant data visualizations with less ceremony than D3.
- **Tabulator** — sortable, filterable, interactive tables.
- **highlight.js** — syntax highlighting for code blocks.
- **KaTeX** — fast math rendering.
- **Lucide** — clean SVG icons.
- **Alpine.js** — tiny local interactivity: tabs, toggles, filters, disclosure panels.

### Mermaid snippet

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
</script>

<div class="rounded-xl border border-slate-200 bg-white p-4">
  <pre class="mermaid">
flowchart LR
  A[Start] --> B[Work]
  B --> C[Done]
  </pre>
</div>
```

Prefer left-aligned Mermaid source inside `<pre>`. Mermaid often tolerates leading indentation, but some diagram types use indentation semantically; left-aligning makes parse errors easier to spot.

## Small-file discipline

- Prefer CDN libraries over embedded generated CSS/JS.
- Prefer Tailwind classes over large `<style>` blocks.
- Use semantic HTML: `main`, `header`, `section`, `article`.
- Use one `<style>` block only for tiny custom rules.
- Avoid inline `style="..."` unless positioning absolutely for one local element.
- Avoid client-side app code. Static HTML is the point.
- Assume internet access is required for CDN assets.

## When not to use CDN HTML

Use a real frontend project only when the user asks for routing, persistent app state, reusable runtime components, bundling, tests, or deployment as an application. For local static content, CDN HTML is enough.
