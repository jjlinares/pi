# Finding Bar

Use this bar to adjudicate subagent candidates. The orchestrator owns the final decision.

## Accept for diff targets only when all are true

- Introduced or exposed by the reviewed target.
- Meaningfully affects correctness, security, reliability, performance, maintainability, test confidence, docs accuracy, DX, or documented requirements.
- Discrete and actionable.
- Has a concrete code path, caller, input, state, environment, or requirement.
- Does not depend on guessing intent.
- Would likely be fixed by a senior author if informed.
- Has a minimal safe fix direction.

## Accept for codebase target only when all are true

- Concrete evidence exists in code/docs/config.
- Impact is real, not generic best-practice sludge.
- Fix has clear leverage relative to effort.
- The plan can be scoped without rewriting the project.
- The finding is not already documented as intentionally accepted debt unless circumstances changed.

## Reject by default

Reject findings that are:

- pre-existing and not worsened by a diff target
- not introduced by the target
- speculative, no plausible trigger
- intentional behavior per spec/PR body
- pure style preference
- tooling-owned lint/format/type output
- broad rewrite with no concrete failure mode
- architecture taste with no locality/leverage cost
- missing test for trivial behavior or already-covered behavior
- security concern with no trust-boundary consequence
- docs nit with no user confusion or executable mismatch
- not worth the complexity of fixing

Prefer rejecting a low-confidence real-ish issue over polluting the output.

## Severity

Use the lowest honest severity:

- `P0` — blocks release or breaks major usage universally.
- `P1` — should fix before merge; likely affects security, data, core flows, compatibility, or important users.
- `P2` — normal actionable defect or maintainability issue with bounded impact.
- `P3` — real but optional cleanup/follow-up.

For plans:

- Every accepted finding gets a plan.
- Do not accept findings that are too trivial, speculative, broad, or low-leverage to plan.
- Use `needs-user-decision` when a real issue requires product/design input before a plan can be written.

## Adjudication checklist

For each candidate:

1. Read cited location and nearby code.
2. Re-run or inspect the relevant diff command from `target.md`.
3. Confirm whether the target introduced/exposed the issue.
4. Trace one caller, input, state, or requirement when needed.
5. Check relevant docs/spec/ADR only for the rule involved.
6. Decide `accepted`, `rejected`, or `needs-user-decision`.
7. Deduplicate overlaps across reviewers.
8. Write the smallest safe fix direction.
9. If accepted, write a plan. If not plan-worthy, reject or mark `needs-user-decision` instead of accepting.

## Rejection reasons

Use one concise reason:

- `pre-existing`
- `not introduced by target`
- `speculative/no trigger`
- `intentional behavior`
- `tooling-owned`
- `style preference`
- `over-broad rewrite`
- `already covered by tests`
- `not worth complexity`
- `needs product decision`
- `duplicate`
- `insufficient evidence`

## Accepted finding shape

```markdown
- [P1] Missing permission check for project import — src/projects/import.ts:87
  The target adds an import path that creates a project before verifying workspace membership. A user with a valid import token but no workspace membership can create data in that workspace. Move the membership check before creation and keep the existing error response. Plan: .agents/reviews/<run-id>/plans/001-import-permission-check.md
```

## No accepted findings

```markdown
No actionable findings accepted.

Residual risk: <tests not run, generated files not inspected, missing spec, skipped reviewer, etc.>
```
