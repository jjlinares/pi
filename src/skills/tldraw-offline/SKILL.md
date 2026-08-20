---
name: tldraw-offline
description: This skill should be used when the user asks to "edit a tldraw canvas", "inspect a .tldraw or .tldr file", "arrange or connect tldraw shapes", "lint a tldraw diagram", "script tldraw offline", "add interactive canvas behavior", or otherwise work with an open tldraw offline desktop canvas.
version: 0.1.0
---

# tldraw offline canvas operator

Operate open tldraw offline canvases through the app's authenticated local HTTP API. Inspect, edit, arrange, connect, lint, capture, and script canvases directly. Handle the task directly without delegation.

## Connect

Require tldraw offline to be running. Use the bundled `scripts/tq` helper for API calls. Resolve it relative to this skill's directory; the standard dotfiles installation exposes it here:

```bash
TQ="$HOME/.pi/agent/skills/tldraw-offline/scripts/tq"
sh "$TQ" POST /api/search 'return await api.getDocs()'
```

`tq` reads `port` and the per-launch `token` from `${XDG_CONFIG_HOME:-$HOME/.config}/tldraw/server.json` on every call, adds authentication, and selects JSON or raw-text content type. Never print or report the token.

Treat `server.json` as stale when its port does not respond; a clean app exit removes it. Ask the user to launch tldraw offline rather than guessing another connection.

If `tq` is unavailable, use raw `curl`. Re-read both values in every shell call because shell exports do not persist:

```bash
PORT=$(jq -r .port "$HOME/.config/tldraw/server.json")
TOKEN=$(jq -r .token "$HOME/.config/tldraw/server.json")
curl -sS "http://127.0.0.1:$PORT/readme"
```

Send `Authorization: Bearer $TOKEN` on raw requests except `GET /` and `GET /readme`.

## Core API

- `POST /api/search`: execute JavaScript with `api`; discover documents, inspect shapes and bindings, capture screenshots, query recipes, and search the Editor API.
- `POST /api/doc/:id/exec`: execute JavaScript with a live `editor` scoped to one document; use for static saved canvas edits.
- `POST /api/doc/:id/script-workspace`: expose live script paths for durable document behavior and asset edits.
- `GET /api/doc/:id/script-status`: inspect script watcher state and locate errors.

Send raw JavaScript as `text/plain` or `{ "code": "..." }` as JSON. Top-level `await` is supported.

Fetch `GET /readme` when an endpoint fails or details are missing. Search the full Editor API only when the standard operations and recipes do not cover the task. The search object is `api`, not `spec`.

## Discover and inspect

Resolve the target document by focused window, filename, or explicit user choice. Ask when multiple documents remain ambiguous.

```bash
sh "$TQ" POST /api/search 'return await api.getDocs()'
```

Inspect shape records before mutating them:

```bash
sh "$TQ" POST /api/search 'const doc = await api.getFocusedDoc(); const page = doc ? await api.getShapes(doc.id) : null; return { doc, shapes: page?.shapes.map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y, props: s.props, meta: s.meta })) ?? [] }'
```

Read bindings only when connection-dependent behavior matters:

```js
const doc = await api.getFocusedDoc()
return doc ? await api.getBindings(doc.id) : []
```

## Choose durability

Use `/exec` for static edits: create, move, resize, arrange, label, style, select, or delete shapes.

Use `/script-workspace` for behavior that must survive reopening: clickable UI, animations, reactive layouts, external-data integration, custom tools, or other run-on-open logic.

Never edit an open `.tldraw` archive directly. Never edit `db.sqlite`, `db.sqlite-wal`, `db.sqlite-shm`, `metadata.json`, `.lock`, or `.script-workspace/**` internals. Modify an open document only through the API and exposed script paths.

## Use recipes

Read a matching worked recipe before implementing complex behavior. Access recipes through `api.recipes['<id>']`:

- `stack-existing-boxes`
- `add-durable-behavior-with-a-document-script`
- `editable-furniture-with-anchored-internals`
- `clickable-card-or-button-ui`
- `connection-dependent-behavior`
- `animation-simulation-loop`
- `custom-shape-config-js`
- `custom-overlay-config-js`

## Create shapes

Use raw tldraw SDK records. Inspect existing records first. Import SDK primitives from `tldraw`; do not expect them in the editor-bound `helpers` bag.

```js
const { createShapeId, toRichText } = await import('tldraw')
const id = createShapeId('box1')
editor.createShape({
  id,
  type: 'geo',
  x: 100,
  y: 100,
  props: {
    geo: 'rectangle',
    w: 300,
    h: 200,
    richText: toRichText('Label'),
  },
})
return { created: [id] }
```

Read `api.imports` for available symbols.

Create every meaningful connection with `helpers.createArrowBetweenShapes(fromId, toId, options)` so both endpoints receive real bindings. Reserve raw unbound arrow shapes for explicitly decorative marks. Run `helpers.getLints()` before declaring a diagram complete and resolve every actionable result.

## Build durable behavior

Call `/script-workspace`, read the reported `mainJsPath`, then edit `script/main.js`. Respect `isDefaultScript`: replace only the untouched starter; extend a pre-existing script instead of clobbering it.

Check `/script-status` after edits:

- `state: "applied"`: success.
- `state: "pending"`: watcher has not caught up; retry once.
- `state: "error"`: read `lastApplyError` and `errorLogPath`.

For editable scripted layouts:

- Create user-facing furniture with stable IDs and `helpers.createShapeIfMissing` or `helpers.createShapesIfMissing`.
- Keep one visible anchor per interactive system.
- Follow anchor movement with `helpers.onShapeTranslate(anchorId, callback, { signal })`.
- Move script-owned internals with `helpers.translateShapes(..., dx, dy)`.
- Wrap other script-owned writes in `editor.run(fn, { history: 'ignore' })`.
- Avoid broad store listeners that react to the script's own writes and recurse.

## Customize the editor

Add `script/config.js` for custom shapes, tools, overlays, UI components, or config-level behavior. Keep run-on-mount behavior in `main.js`.

Export a function receiving `{ config }`; return the updated config. Extend its `shapeUtils`, `bindingUtils`, `assetUtils`, `overlayUtils`, `tools`, `components`, or `options`. Place custom classes in sibling modules and import them. Read the matching custom-shape or custom-overlay recipe before implementation.

Expect changes to `config.js` or its imports to rebuild the editor while preserving document, camera, and selection but resetting undo history. Changes to `main.js` do not remount the editor.

## Capture screenshots

Prefer records for verification. Use `api.getScreenshot(docId, opts)` only for uncertain visual placement or an explicit screenshot request.

- `size`: `small`, `medium`, `large`, or `full`.
- `mode: "canvas"`: capture shapes, optionally within page-coordinate `bounds`.
- `mode: "window"`: capture canvas and application UI.

Open the returned `filePath`; the API returns a JPEG path, not image bytes.

## Workflow

1. Restate the intended result in concrete canvas terms.
2. Resolve the target document.
3. Inspect relevant shapes, bindings, and existing scripts.
4. Choose static `/exec` edits or durable script-workspace edits.
5. Read a matching recipe before complex implementation.
6. Apply the smallest coherent change.
7. Verify once using shape records, bindings, script status, lints, or a screenshot.
8. Stop after successful verification unless debugging was requested.

## Bundled utility

- `scripts/tq`: authenticated local API wrapper; invoke with `sh`.
- `scripts/test_tq.py`: deterministic tests using a local mock server.

Report the document ID/name, changed shape IDs or script path, and one verification result. On failure, quote the server error, script digest mismatch, or relevant error-log line without exposing the bearer token.
