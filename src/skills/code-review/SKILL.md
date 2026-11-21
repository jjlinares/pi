---
name: code-review
description: Review code changes, codebase areas, plans, docs, or research evidence with independent reviewers. Use for orchestrated reviews of commits, branches, PRs, audits, designs, agent instructions, or spike results.
---

# Code Review

Reviewer with an assigned lane: read your lane guide below, and [references/reviewer.md](references/reviewer.md) if you have no standing reviewer instructions. The rest of this file is for the orchestrator.

Use independent reviewers to find issues; own the judgment about which findings matter. Review-only by default. Implement fixes only when requested, and keep publication subject to the user's authorization.

## Establish scope

Resolve the exact target and revision, or the audit area and focus, and the claim under review before delegating. Ask when ambiguity would materially change the review.

## Choose reviewers

Start each reviewer as the environment's reviewer agent, with its defaults, when one exists. Otherwise follow the environment's subagent model guidance and tell each reviewer to read [references/reviewer.md](references/reviewer.md) first. Never present a self-review as independent.

Always run the target's main lane: correctness for code, otherwise the plan, docs, or evidence guide. Add a comments and docs reviewer only when the change touches docs, recipes, or agent instructions, or adds notable comments or suppressions; otherwise the correctness reviewer checks changed comments. Add architecture, security, or performance reviewers when the change raises meaningful risk there or the user asks. Draw lanes so no two investigate the same question. Honor an explicitly limited scope. Do not launch a panel merely because several perspectives apply.

Lane guides:

- [Correctness](references/correctness.md): wrong behavior, broken contracts, silent failures, unprotected behavior.
- [Comments and docs](references/comments.md): comments and suppressions hiding unclear code; docs the change touches.
- [Architecture](references/architecture.md): fit, simplicity, conventions. Advisory by default.
- [Security boundaries](references/security-boundary.md): trust-boundary failures and sensitive-data exposure.
- [Performance](references/performance.md): consequential costs under plausible workloads.
- [Plans and designs](references/plan.md): steps that fail against the installed system.
- [Docs and instructions](references/docs.md): docs that do not produce their stated result.
- [Evidence](references/evidence.md): research or spike results that do not support their claim.

## Brief each reviewer

The brief carries only what is specific to this review:

- **Target:** exact checkout, revision or diff range, or file.
- **Claim at risk:** the contract, invariant, or decision rule, stated so it can be disproved: "one keypress must not navigate".
- **Authority** to compare against: spec, prototype, installed dependency, a tool's actual behavior.
- **Settled decisions** and limits the author disclosed.
- **Lanes:** the path to its lane guide and what the other reviewers cover.
- **Checks already run** and their results, so it reruns them only with a reason.
- **Permissions:** exactly which environments, services, and data it may touch. Check what each really is before granting it; "local" can point at production.

Do not share one reviewer's findings with another, except prior findings in a re-review.

## Validate findings

Treat reviewer findings as leads, not votes. Inspect the evidence and confirm impact yourself before accepting one. Agreement between reviewers is not proof. A reproduced mechanism also needs a shown path by which the application reaches it.

Deduplicate findings and distinguish defects from unresolved product decisions. Cite evidence without reproducing secrets.

## Finding bar

Accept findings that are:

- **In scope:** introduced or exposed by the reviewed changes, including unmet requirements. Audits may include pre-existing issues.
- **Concrete:** supported by a reachable code path, input, state, environment, or explicit requirement, not guessed intent.
- **Consequential:** meaningfully affect behavior, security, reliability, performance, or maintenance.
- **Actionable:** with a safe fix direction worth its complexity.

Reject by default:

- Speculative failures without a plausible trigger, or intentional behavior presented as a defect.
- Style preferences, generic best practices, and redundant lint, formatting, or type-check output.
- Tests for trivial or already-covered behavior.
- Security claims without a trust-boundary consequence, performance claims without a plausible workload, and doc nits that would not mislead anyone.
- Speculative abstractions, or fixes whose complexity outweighs their value.

Judge likelihood, consequence, and fix cost together. Rare but reachable security failures or data loss still matter. Prefer fewer well-supported findings over noisy completeness.

Assign each accepted finding a severity from the scale in [references/reviewer.md](references/reviewer.md#report). P2 blocks only when acceptance criteria or explicit project constraints require it.

## Report and follow through

Lead with accepted findings by severity, each actionable without a separate plan, or say none qualify. State verification limits, skipped areas, and unresolved decisions; include rejected findings only when their disposition matters. Keep ordinary reviews in the conversation, not in files.

When fixes are requested, address accepted findings within the agreed scope and verify affected behavior.

- **Validate fixes** with a new reviewer, briefed with the old and new commits, the prior findings, and what was done about each.
- **Retry** a run that ended without a verdict. It is not a clean result, and a retry does not validate fixes.

Stop when further review produces no new actionable evidence; do not keep spawning reviewers until one approves. Do not hold a ready, independently mergeable change for another round when the remaining risk does not justify it.
