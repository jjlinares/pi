# Code Reviewer Selection

Select reviewers by changed surface area and user-requested depth. The orchestrator chooses the reviewer set unless the user explicitly names reviewers or focus areas. Do not run every reviewer by default. Narrow reviewers produce better signal.

## User-directed selection

When the user explicitly requests reviewers or focus areas, honor that request and do not silently add unrelated reviewers. An explicitly exclusive reviewer set overrides all defaults. Otherwise, keep `correctness-regression` only when the target is behavior-affecting and it materially protects the requested review. If the requested reviewer is irrelevant to the target, say so and ask whether to run it anyway.

Examples:

- `review security` → run `security-boundary` plus correctness only for behavior-affecting changes.
- `review tests and architecture` → run `test-coverage` and `architecture-simplicity`; add correctness only if needed to evaluate changed behavior.
- `review only docs-dx` → run `docs-dx` only.

## Default set

When the user does not name reviewers, run:

- `correctness-regression` for behavior-affecting changes, including code, executable configuration, schemas, migrations, generated metadata, and executable documentation examples.

Skip `correctness-regression` for docs-only or cosmetic-only changes.

## Conditional reviewers

| Reviewer | Run when |
|---|---|
| `spec-compliance` | PR body, issue, PRD, task, roadmap item, or explicit user intent exists. |
| `standards-conventions` | `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, ADRs, style docs, or strong local conventions exist. |
| `security-boundary` | Auth, authorization, permissions, secrets, shell, filesystem, network, deserialization, uploads, user input, cookies, tokens, privacy data, or path handling changed. |
| `test-coverage` | Behavior changed, tests changed, bug fix lacks regression test, or public contract changed. |
| `silent-failure` | Error handling, fallback, retries, null/default handling, logging, catch blocks, cleanup, cancellation, or background jobs changed. |
| `type-contracts` | Public types, schemas, validation, serialization, APIs, CLI/config contracts, DB migrations, or domain invariants changed. |
| `architecture-simplicity` | Large/risky diff, strict/deep mode, file growth, cross-module seams, abstraction churn, duplicated helpers, or user asks for architecture review. |
| `performance` | Loops, queries, caching, concurrency, payload sizes, rendering, IO, startup, or hot paths changed. |
| `docs-dx` | README, docs, examples, setup, scripts, CLIs, dev tooling, or onboarding changed. |
| `codebase-direction` | `codebase`, `next`, roadmap, or improvement-audit mode. |

## Thinking level

Thinking level controls subagent reasoning budget only. It does not choose reviewers, widen scope, or lower the finding bar.

Accepted values:

- `low`
- `medium`
- `high`
- `xhigh`

Default to each selected reviewer profile's configured thinking level when the user does not specify one.

Use higher thinking as an inline subagent override for harder analysis inside selected reviewers: caller tracing, security boundaries, architectural tradeoffs, and ambiguous spec compliance. Do not add unrelated reviewers just because the user asked for higher thinking.

`strict` is not a thinking level. Treat it as a review focus that selects `architecture-simplicity` and raises the maintainability bar.

## Batch rules

- Run independent reviewers in parallel when available.
- Run later reviewers only when their output can change the final decision.
- Do not launch architecture after a diff is already blocked by a clear P1 unless the user requested strict review.
- Do not re-check linter/formatter/typechecker facts unless tooling is absent or the changed code bypasses tooling.

## Code Reviewer profiles

Each reviewer is a `pi-subagents` profile. The profile owns the reviewer identity, trigger-facing `description`, system prompt, default thinking level, context mode, and tool defaults. The review run owns the dynamic task: target, context, protocol, allowed commands, and output handling.

Select only relevant profiles:

- [`reviewers/correctness-regression.yaml`](reviewers/correctness-regression.yaml)
- [`reviewers/spec-compliance.yaml`](reviewers/spec-compliance.yaml)
- [`reviewers/standards-conventions.yaml`](reviewers/standards-conventions.yaml)
- [`reviewers/security-boundary.yaml`](reviewers/security-boundary.yaml)
- [`reviewers/test-coverage.yaml`](reviewers/test-coverage.yaml)
- [`reviewers/silent-failure.yaml`](reviewers/silent-failure.yaml)
- [`reviewers/type-contracts.yaml`](reviewers/type-contracts.yaml)
- [`reviewers/architecture-simplicity.yaml`](reviewers/architecture-simplicity.yaml)
- [`reviewers/performance.yaml`](reviewers/performance.yaml)
- [`reviewers/docs-dx.yaml`](reviewers/docs-dx.yaml)
- [`reviewers/codebase-direction.yaml`](reviewers/codebase-direction.yaml)
