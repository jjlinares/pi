---
name: code-review
description: Review changes or audit a codebase with independent reviewers. Use for orchestrated reviews of local changes, commits, branches, PRs, or codebase areas.
---

# Code Review

Use independent reviewers to find issues; own the judgment about which findings matter. Review-only by default. Implement fixes only when requested, and keep publication subject to the user's authorization.

## Establish scope

Resolve the target and intended behavior before delegating. For changes, identify the exact diff and revision; for an audit, define the codebase area and focus. Ask when ambiguity would materially change the review.

## Choose independent reviews

Use independent, read-only reviewers, not the implementer's self-assessment. Add specialist reviews when the changes raise meaningful risks in areas such as security, performance, or behavioral correctness, or when the user requests them. Not every change needs specialist review. Honor an explicitly limited review scope.

Use the environment's delegation tools and model-selection instructions. If independent review is unavailable, disclose that limitation rather than presenting a self-review as independent.

Give each reviewer a self-contained brief: exact target and checkout, intended behavior, relevant constraints, assigned scope, and checks already run. Ask for concrete findings with locations, triggers, and consequences. No findings is a valid result.

Reviewers may inspect code and run appropriate checks, but must not edit source or Git state. Parallelize independent reviews when useful; do not launch a panel merely because several perspectives could apply.

### Reviewer examples

Read these only when a selected review would benefit from the perspective. Adapt them to the target rather than treating them as a required roster.

- [Correctness and regressions](references/correctness-regression.md): incorrect behavior, broken contracts, and integration failures.
- [Security boundaries](references/security-boundary.md): exploitable trust-boundary failures and sensitive-data exposure.
- [Performance](references/performance.md): consequential costs under plausible workloads.
- [Silent failures](references/silent-failure.md): hidden failures, misleading success, and recovery or diagnosis problems.
- [Specification compliance](references/spec-compliance.md): gaps between requirements and actual behavior.
- [Standards and conventions](references/standards-conventions.md): project constraints and concrete maintenance costs.
- [Test coverage](references/test-coverage.md): important behavior left unprotected or misleading test confidence.
- [Type contracts](references/type-contracts.md): mismatches between types, validation, serialized data, and callers.

## Validate findings

Treat reviewer findings as leads, not votes. Independently inspect the evidence, trace the relevant behavior, and confirm impact before accepting a finding. Agreement between reviewers is not proof.

Deduplicate findings and distinguish defects from unresolved product decisions. Cite locations and evidence without reproducing secrets.

## Finding bar

Accept findings that are:

- **In scope:** introduced or exposed by the reviewed changes, including unmet requirements. Audits may include pre-existing issues.
- **Concrete:** supported by a reachable code path, input, state, environment, or explicit requirement, not guessed intent.
- **Consequential:** meaningfully affect behavior, security, reliability, performance, or maintenance. Test gaps and misleading docs need a concrete consequence too.
- **Actionable:** discrete enough to explain and address, with a safe fix direction worth its complexity.

Reject by default:

- Pre-existing issues not worsened or exposed by the reviewed changes.
- Speculative failures without a plausible trigger, or intentional behavior presented as a defect.
- Style preferences, generic best practices, and redundant lint, formatting, or type-check output.
- Test requests that add no meaningful confidence, including tests for trivial or already-covered behavior.
- Security claims without a trust-boundary consequence, performance claims without a plausible workload, and documentation nits that would not mislead anyone.
- Speculative abstractions for unproven needs, or fixes whose complexity outweighs their value.

Judge likelihood, consequence, and fix cost together. Rare but reachable security failures or data loss still matter. Prefer fewer well-supported findings over noisy completeness.

## Report and follow through

Lead with accepted findings, ordered by importance. Include enough location, trigger, consequence, and fix direction to act without a separate plan. If none qualify, say so. State verification limits, skipped areas, and important unresolved decisions; include rejected findings only when their disposition matters.

Keep ordinary reviews in the conversation. Use persistent notes or fix plans when requested or when the review's size or handoff needs justify them, not as mandatory output for every finding.

When fixes are requested, address accepted findings within the agreed scope, verify affected behavior, and re-review material changes or remaining risks. Carry prior findings and dispositions into follow-up reviews. Stop when further review produces no new actionable evidence; do not keep spawning reviewers until one approves.
