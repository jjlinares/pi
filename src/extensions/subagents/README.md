# Subagents

Tiny subagent launcher for Pi.

## Philosophy

A subagent is not a special object type. It is a child Pi session launched with:

- a task
- an optional system-prompt append
- optional Pi config such as model, thinking, tools, cwd, and context mode

This extension provides orchestration infrastructure only. It does not own your agent taxonomy. The parent session decides what child roles are needed for the current problem and passes those roles as prompts.

The default workflow is orchestration fanout: launch focused children to inspect, critique, research, validate, or implement as explicitly instructed, then let the parent synthesize the results and decide what to do. Children are helpers, not decision owners.

The extension adds no default child role or safety policy. If a child should be read-only, the parent must say so in `appendSystemPrompt` and/or restrict `tools`.

When `appendSystemPrompt` is provided, it is always appended to Pi's core system prompt. The extension never replaces Pi's core system prompt.

Runs default to foreground/blocking so the parent sees all child results before answering. Use `async: true` when the parent should keep working while children run in the background.

## Tool and dashboard

Registers one tool, `subagent`, and one command, `/subagents`.

Runs are foreground by default. Set `async: true` for background execution that returns a run id immediately. `/subagents` opens a live dashboard containing only children owned by the current parent Pi session—not arbitrary Pi sessions or runs launched by another parent session. It defaults to owned children whose effective cwd matches the current Pi directory; press Tab to toggle all owned persisted subagents across directories. It remains available while a foreground `subagent` tool call is running; opening or closing it does not pause the child or parent tool.

Dashboard keys:

| Key | Action |
|---|---|
| Configured select up/down keys (defaults: `↑` / `↓`), plus `Home` / `End` | Navigate children or scroll detail. |
| Configured select confirm key (default: `Enter`) | Open detail or confirm a cancellation request. |
| Configured Tab key (default: `Tab`) | Toggle between the current directory and all persisted subagents. |
| `a` | Request best-effort cancellation of the selected queued/running child; literal `y`/`n` also confirm/dismiss. |
| Configured select cancel keys (defaults: `Esc`, `Ctrl+C`) | Return from detail or close the dashboard. Closing does not request child cancellation. |

The dashboard is TUI-only. In other Pi modes the command returns safely (and warns where UI notifications are available).

## Basic use

Single child:

```ts
subagent({
  subagents: [
    {
      task: "Review the current diff for correctness. Return findings only.",
      appendSystemPrompt: "You are a correctness reviewer."
    }
  ],
  context: "fresh"
})
```

Parallel fanout:

```ts
subagent({
  subagents: [
    {
      name: "correctness",
      task: "Review the current diff for correctness and regressions. Return findings only.",
      appendSystemPrompt: "You are a correctness reviewer."
    },
    {
      name: "simplicity",
      task: "Review the current diff for unnecessary complexity. Return findings only.",
      appendSystemPrompt: "You are a simplicity reviewer."
    },
    {
      name: "architecture",
      task: "Review the current diff for architectural boundary issues. Return findings only.",
      appendSystemPrompt: "You are an architecture reviewer."
    }
  ],
  context: "fresh",
  concurrency: 3
})
```

Profile-backed child:

```ts
subagent({
  subagents: [
    {
      profile: "agents/correctness-reviewer.yaml",
      task: "Review the current diff."
    }
  ]
})
```

Inspect and control background work:

```ts
subagent({ action: "status" })
subagent({ action: "status", id: "abc123" })
subagent({ action: "check", id: "abc123-0" })
subagent({ action: "wait", ids: ["abc123-0", "abc123-1"] })
subagent({ action: "cancel", ids: ["abc123-1"] })
```

`wait` and `cancel` also accept a run id or unique run-id prefix, which expands to all children in that run. Use `id` or `ids`, never both.

## Parameters

Top-level:

| Field | Meaning |
|---|---|
| `subagents` | Required non-empty array. Each entry launches one child Pi session. Use one entry for a single child. |
| `appendSystemPrompt` | Optional default role/config prompt appended to Pi's core system prompt. Used by subagents that omit their own. If omitted, no prompt override is passed. |
| `context` | `fresh` default, or `fork`. |
| `model` | Child model override. Thinking suffixes like `sonnet:high` also work. |
| `thinking` | Child thinking level: `off`, `minimal`, `low`, `medium`, `high`, or `xhigh`. Default `medium`. Passed as `--thinking`. |
| `tools` | Child tool allowlist string/array, or `false` for `--no-tools`. Omit for normal Pi tools. |
| `cwd` | Child working directory. |
| `concurrency` | Parallel concurrency. Default `4`. |
| `timeoutMs` | Per-child timeout in milliseconds. Omit for no timeout. |
| `includeJsonl` | Write raw child JSONL files, capped at 50 MB per child. Default `false`. |
| `async` | `false` default. Set `true` to run in background and return immediately. |
| `notify` | Background completion behavior: `tui` default, `followUp`, or `none`. Ignored for foreground runs. |
| `action` | `status`, `check`, `wait`, or `cancel` for existing session-owned work. Omit to launch. |
| `id` | One run/child selector. `status` accepts only a run id/prefix. |
| `ids` | Run ids/prefixes or child ids for `wait` and `cancel`; run selectors expand to all children. |

Per-subagent overrides inside `subagents[]`:

| Field | Meaning |
|---|---|
| `profile` | Optional local YAML profile path for subagent defaults. |
| `name` | Child label. |
| `task` | Required task for this child subagent. |
| `appendSystemPrompt` | Optional subagent-specific role/config prompt appended to Pi's core system prompt. If omitted, inherits the top-level prompt if present. |
| `context` | Override top-level `context`. |
| `model` | Override top-level `model`. |
| `thinking` | Override top-level `thinking`. |
| `tools` | Override top-level `tools`. |
| `cwd` | Relative to top-level resolved cwd. |

## Profiles

Profiles are local YAML files for reusable subagent defaults. The task always stays in the tool call.

```yaml
name: correctness-reviewer
description: Use when reviewing diffs for bugs and regressions.
appendSystemPrompt: |
  You are a correctness reviewer.
  Return findings only.
context: fresh
model: sonnet
thinking: high
tools: "read,bash"
cwd: .
```

Allowed profile fields: `name`, `description`, `appendSystemPrompt`, `context`, `model`, `thinking`, `tools`, `cwd`.

Rules:

- `description` is ignored at runtime; it exists to help the parent decide when to use the profile.
- `task` is rejected in profiles.
- nested `profile` is rejected.
- remote URLs are rejected; profiles are local files only.
- profile paths resolve relative to the parent session cwd.
- config precedence is `top-level defaults < profile < inline subagent fields`.

Actions:

| Action | Meaning |
|---|---|
| `status` | List recent runs, or show one run by `id`/prefix. Detailed status includes each child id. |
| `check` | Inspect one child without blocking. Returns state, activity, and up to 2 KiB/20 lines of output. |
| `wait` | Wait for selected children to settle, then return bounded final output. Tool interruption leaves children running. |
| `cancel` | Request best-effort cancellation for selected queued/running children. Returns without waiting for settlement. |

## Foreground vs background

Default foreground behavior:

```ts
subagent({ subagents: [{ task: "Review the diff" }] })
```

The tool waits for all children, streams status updates, then returns a bounded aggregate result to the parent. Child output is capped at 16 KiB each and the complete tool result is capped at 48 KiB. Truncation notices link to the complete `output-*.md` or `result.md` file. `/subagents` can be opened during this wait; foreground execution continues behind the overlay.

Background behavior:

```ts
subagent({ subagents: [{ task: "Review the diff" }], async: true })
```

The tool returns a run id immediately. Inspect later with `subagent({ action: "status", id })`.

## Background notifications

Default for background runs:

```ts
notify: "tui"
```

Shows a Pi TUI notification when the run completes.

Opt into parent wake-up:

```ts
notify: "followUp"
```

When settled, sends a user follow-up message containing the result path and status command. If parent Pi is busy, it queues as `followUp`.

Disable notifications:

```ts
notify: "none"
```

Background status and its parent Pi session ID are persisted under the run directory. On session start or resume, the read model recovers only background runs owned by that session and notifies once if they later settle. Other parent sessions cannot contribute dashboard rows, footer counts, status listings, cancellation targets, or notifications. Historical terminal runs owned by the session remain visible but do not replay notifications. Legacy run files without ownership metadata remain on disk but are not attached to a session. Newly launched runs are tracked before their first status poll.

The footer only summarizes children whose parent run is currently active, with running/queued/completed/cancelled/failed counts and a `/subagents` hint. It clears after those parent runs settle.

## Context

### `fresh`

Starts a new child Pi process with no parent conversation history. The child is saved as a normal Pi session, and completed output includes `pi --session <id>` so it can be resumed.

Use for isolated or adversarial work. This is the default.

### `fork`

Creates a branched Pi session from the parent session leaf and starts the child from that session file.

Use when inherited conversation matters. Fork fails if the parent session is not persisted or has no current leaf. It does not silently downgrade to fresh.

## Safety and tool boundaries

The extension does not inject a read-only prompt. The parent/orchestrator owns child instructions and tool access.

Prompt-only safety is not a sandbox. If you allow `bash`, a child can mutate files no matter what the prompt says. Pass a restrictive `tools` allowlist if you want harder limits:

```ts
subagent({
  appendSystemPrompt: "You are a read-only reviewer. Do not modify files.",
  subagents: [{ task: "Review src/" }],
  tools: "read,grep,find,ls"
})
```

## Runtime model

Foreground and background runs share the same executor (`executor.mjs`). Foreground calls it in-process so status updates can stream back to the parent tool call. Background launches `runner.mjs`, which is only a thin detached wrapper around the same executor.

The dashboard and `cancel` action request cancellation through a private per-child control marker. This is best-effort, not an atomic guarantee: a child may settle before the owning executor observes the request. When observed in time, the executor handles it: queued children are not spawned; running children use the executor's normal process-group termination path. Cancellation is terminal `cancelled`, with `Cancelled by user` recorded as its reason rather than an execution error. A run is `failed` if any child actually fails; otherwise it is `cancelled` if any child is cancelled, and `complete` only when every child completes. Cancelled-only foreground results are not marked as tool errors. Repeated requests are idempotent. Configured dashboard cancel closes the overlay first; parent interrupt behavior remains separate.

Every child gets a sanitized normalized transcript, even when `includeJsonl` is false. It records assistant/tool/warning/error activity and is capped at **1 MiB per child** with an explicit truncation marker. Optional raw Pi JSONL remains separately capped at 50 MB. Final `output-*.md` and aggregate `result.md` files remain complete. Only the result returned to the parent model is bounded.

Runs and status survive Pi reload/restart while their temporary run directories remain present. Running detached jobs are rediscovered; old completed/cancelled/failed jobs are not announced again. `/tmp` cleanup by the OS can remove this history.

This subprocess transport is read-only after launch except for cancellation. It does **not** support steering, sending another message to a child, or continuing it in place. Use the displayed `pi --session ...` resume command after completion when available.

Foreground progress is rendered from structured status details, not raw child logs. Collapsed results show a fanout card with queued/running/complete/cancelled/failed states, current tool/path, per-subagent tools/turns/tokens/cost/runtime, recent tool use, and up to two output lines. Expanded results add more recent tools/output plus per-subagent output/jsonl paths.

## Runtime files

Runs are stored under:

```text
/tmp/pi-subagents-<scope>/runs/<run-id>/
```

Important files:

| File | Meaning |
|---|---|
| `config.json` | Runner config. |
| `status.json` | Current run/subagent state, including the owning parent Pi session ID. |
| `events.jsonl` | Compact runner subagent start/end/error events. Does not duplicate child JSON. |
| `result.md` | Aggregate result after completion. |
| `prompt-*.md` | Optional per-child system prompt append, only written when `appendSystemPrompt` is provided. |
| `input-*.md` | Per-child task input passed to Pi. |
| `output-*.md` | Per-child final output. |
| `transcript-*.jsonl` | Sanitized normalized live transcript; always written and capped at 1 MiB per child. |
| `subagent-*.jsonl` | Per-child raw Pi JSON stdout, only when `includeJsonl: true`; capped at 50 MB per child. |
| `subagent-*.stderr.log` | Per-child stderr. |

## Install

### Dotfiles setup

From the dotfiles repo root, run:

```bash
./pi/setup.sh
```

The setup script installs each package under `pi/extensions/*` with `pi install <local-path>`. It also removes the old legacy symlink for this extension if present.

Then restart Pi or run `/reload`.

### Manual local package install

Use the repo setup script; it installs runtime dependencies before registering the local Pi package:

```bash
./pi/setup.sh
```

If installing manually, install dependencies first:

```bash
npm --prefix pi/extensions/subagents ci --omit=peer --legacy-peer-deps
pi install ./pi/extensions/subagents
```

`"private": true` only prevents accidental npm publishing. It does not stop Pi from installing a local path package.

This extension registers the tool name `subagent`. Do not load another extension that registers the same tool name unless you intentionally want a collision.

## Tests

Run:

```bash
npm --prefix pi/extensions/subagents test
```

Coverage targets:

- shared executor success/failure behavior through the background runner
- status/result file writing
- config generation
- fresh/fork assignment
- defaults and overrides
- status formatting
- notification decisions
- read-model flattening/change notifications and dashboard selection/scroll/transcript parsing
- queued/running cancellation and transcript caps

Smoke-load extension through Pi:

```bash
pi --offline -e ./pi/extensions/subagents --list-models nosuchmodel
```
