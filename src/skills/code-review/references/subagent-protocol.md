# Subagent Protocol

Give each subagent exactly one reviewer profile. Subagents return candidate findings only. The orchestrator accepts or rejects.

Reviewer profiles own stable identity: role name, description, system prompt, thinking default, context mode, and tool defaults. Dynamic tasks own run-specific facts: target, checkout, context, protocol, allowed commands, and output handling.

## Prompt skeleton

```markdown
# Role: <role-name>

Review the pinned target using your loaded reviewer profile only.

Read-only constraints:
- Do not edit files, even if edit/write tools are available.
- Do not run formatters, package installs, generators, commits, pushes, or mutation commands.
- Do not run tests unless the orchestrator explicitly allowed a specific command in context.md.
- Use bash for inspection only: git diff/show/log/status, rg/grep/find/ls/pwd, and approved test commands.
- Treat the base/head SHAs and commands in target.md as the source of truth.

Inputs:
- Review cwd: <checkout/worktree path>
- Target manifest: <run-dir>/target.md
- Review context: <run-dir>/context.md
- Protocol: <skill-dir>/references/subagent-protocol.md
- Reviewer profile: <skill-dir>/references/reviewers/<role>.yaml already loaded as your system prompt

Task:
- Read target.md, context.md, and this protocol.
- Inspect the diff or codebase scope only for your loaded reviewer role.
- Return candidate findings. Do not fix. Do not write plans.
- Cite changed files and lines when possible.
- For diff targets, report only issues introduced or exposed by the target.
- For codebase target, report only high-leverage issues with concrete evidence.

Return this exact markdown shape:

## Summary
<1-3 sentences>

## Candidate findings
- [P0|P1|P2|P3] <title> — <path>:<line>
  Evidence: <specific changed code, requirement, or path>
  Trigger: <caller/input/state/env>
  Impact: <what breaks or gets worse>
  Minimal fix direction: <smallest safe direction>
  Confidence: <high|medium|low>

If none, write: `No findings.`

## Non-findings / rejected
- <candidate considered and why rejected, or `None`>

## Open questions
- <question or `None`>

## Confidence
<high|medium|low> for the review pass and why.
```

## Subagent quality bar

Require:

- concrete trigger or violated requirement
- specific file/line evidence
- direct relation to target scope
- minimal fix direction
- confidence label

Reject reports that contain:

- broad summaries without findings
- style nits
- pure lint/typecheck output
- speculative security issues with no trust boundary
- architecture preferences without a cost
- missing tests without important changed behavior
- plans or patches instead of findings

## Context packing

Do not paste large docs into prompts. Point at files when subagents can read them. Paste only short critical requirements from PR bodies or specs when path resolution is uncertain.

Always include:

- absolute path to run directory
- absolute path to review checkout
- exact reviewer profile path
- exact target commands in `target.md`

## Output handling

After the `subagent` run returns, store each raw subagent output at:

```text
.agents/reviews/<run-id>/reports/<role>.md
```

Do not ask subagents to write report files themselves. They are read-only. If a subagent fails, retry once with a smaller prompt. If it fails again, mark the role `not run` in `report.md` and include residual risk.
