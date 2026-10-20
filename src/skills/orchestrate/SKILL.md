---
name: orchestrate
description: Divide agreed work into reviewable phases or PRs, delegate implementation and independent reviews, and judge findings and readiness. Use when asked to coordinate subagents through delivery rather than only plan, implement, or review.
disable-model-invocation: true
---

# Orchestrate

Own the judgment. Subagents implement bounded work and supply review evidence; you decide the decomposition, concurrency, actionable findings, and when the result is ready for the user.

## Establish the contract

Read project instructions and inspect the relevant code before dividing work. Consolidate the agreed behavior, latest user corrections, non-goals, and verification needs. Ask only about decisions that block safe progress; do not reopen settled choices.

Honor the requested stopping point. A planning-only request stops before implementation. Execution through this skill delegates implementation to subagents, including sequential phases; it does not require artificial parallelism. Branches, commits, published PRs, merges, and deployment remain subject to the user's authorization. 

State the delivery shape: one branch with coherent milestone commits, independent PRs, or a stack. Preserve existing user changes. If delegation is unavailable, report the limitation rather than silently replacing the requested workflow with solo implementation.

## Divide by reviewable outcomes

Choose the smallest coherent units a human can understand and verify. Prefer narrow end-to-end slices that expose uncertainty early. Use a foundation or contract phase when it genuinely unlocks later work; do not split mechanically by frontend/backend or arbitrary file counts.

For each phase establish:

- Outcome, scope, and explicit exclusions.
- Dependencies and shared contracts that must be settled first.
- Implementation ownership and checkout/branch; PR base when applicable.
- Verification that proves the outcome, including relevant failure behavior.
- Review checkpoint and completion evidence.

Keep lightweight coordination in the conversation. Use a temporary plan file when dependencies, parallel work, or a long execution make reconstructing state from messages costly or error-prone. Treat it as working memory, not project documentation; keep it outside committed deliverables. Track only what helps resume and coordinate the work: phase state, dependencies, child task IDs, revision references, verification, and unresolved decisions.

Distinguish implemented, reviewed, verified, and ready; a subagent's completion does not imply all four.

A PR should have one coherent purpose. Prefer GitHub's native stacked PR workflow for dependent phases, keeping each layer independently reviewable. Keep independent changes separate rather than forcing them into a stack.

Keep risky integration and recovery behavior visible in the relevant phases rather than postponing it all to a final integration bucket.

## Schedule deliberately

Parallelize only when tasks have stable inputs and independent ownership. Disjoint files alone do not prove independence. Research or planning for a later phase can overlap implementation of its prerequisite.

Use isolated worktrees for concurrent implementation when the projec supports it. With a shared checkout, assign non-overlapping ownership and serialize Git mutations. Do not switch branches, rebase, or commit another worker's partial changes beneath active workers.

A review can overlap later implementation if it inspects a stable snapshot and likely fixes will not invalidate that implementation. Freeze the reviewed revision, not the whole project. Reassess downstream work when a review changes a shared contract.

## Delegate bounded implementation

Give each implementer a self-contained brief:

- Agreed behavior, non-goals, and relevant project instructions.
- Owned scope, starting revision, checkout, and dependency contracts.
- Acceptance checks and any known baseline failures.
- Permission to edit, and whether it may commit; reserve publication and integration decisions to the orchestrator.
- Instructions to report blockers or needed contract changes rather than expand scope.

Prefer coherent commits as implementation deliverables when committing is authorized and ownership is isolated. Require a handoff with base and head commit IDs, a short summary, verification results, and remaining gaps. File inventories are unnecessary when the diff captures the scope. In shared or dirty checkouts, leave changes uncommitted if committing would mix ownership, and identify the reviewable diff explicitly.

Prefer fresh context. Keep routine implementation and accepted fixes delegated; handle integration and small cross-phase corrections yourself when that is simpler than another handoff.

## Review where evidence is useful

Choose checkpoints by risk and dependency: review consequential contracts before others build on them, coherent phases once inspectable, and cross-phase behavior after integration.

Use independent, read-only reviewers, not the implementer's self-assessment. Add specialist reviews when the changes raise meaningful risks in areas such as security, performance, or behavioral correctness. Not every change needs specialist review.

## Adjudicate, then fix

Treat findings as leads, not votes. Independently inspect the cited code and surrounding path. Confirm the trigger, consequence, requirement, and whether the work introduced or exposed it.

Record a concise disposition for each distinct finding:

- **Fix:** concrete, in-scope impact worth the complexity of correcting it.
- **Reject:** unsupported, intentional, already covered, stylistic, or not worth the added complexity.
- **Defer:** real but outside this delivery; make the residual risk explicit.

Weight likelihood, consequence, and fix cost. Do not engineer for edge cases without a credible path. Avoid speculative abstractions and tests that add no meaningful confidence.

Send accepted fixes back with evidence and a bounded scope. Verify the fixes and affected integration paths. Re-review material changes or unresolved risks; a mechanical correction may need only a targeted check. Carry prior findings, dispositions, fixes, and unresolved objections into subsequent review briefs so rejected ideas do not restart the loop without new evidence.

## Declare readiness

You own the final gate. Ready means the agreed scope is implemented, accepted blocking findings are resolved, relevant integrated checks pass, and remaining limitations are explicit. Missing verification is not a pass.

Report:

- What is ready and where: branch, commits, or PR links.
- Suggested review order and what each phase proves.
- Checks run and any unverified behavior.
- Important findings fixed, rejected, or deferred, with brief reasons.
- Remaining decisions or risks and relevant manual verification steps.
