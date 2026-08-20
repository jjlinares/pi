# Orchestration

Use `pi-subagents` as the required launch mechanism. If the `subagent` tool is unavailable, exit the review and tell the user that profile-backed subagents are required.

## Run directory

```bash
run_dir=".agents/reviews/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$run_dir/reports" "$run_dir/plans"
touch "$run_dir/findings.md" "$run_dir/report.md"
repo="$(git rev-parse --show-toplevel)"
run_abs="$repo/$run_dir"
skill_dir="$(realpath ~/.pi/agent/skills/code-review)"
```

`target.md` must record `review_cwd`. For pinned targets this may be a detached worktree. For local targets it is the current repo.

## Primary launch: `subagent` profiles

Each selected reviewer maps to a YAML profile under:

```text
<skill_dir>/references/reviewers/<role>.yaml
```

Launch reviewers with profile-backed subagents. Do not pass reviewer identity as top-level settings. Let profile defaults apply; use inline subagent fields only for intentional one-off overrides.

```ts
subagent({
  cwd: review_cwd,
  concurrency: Math.min(selectedReviewers.length, 4),
  subagents: selectedReviewers.map((role) => ({
    profile: `${skill_dir}/references/reviewers/${role}.yaml`,
    task: `# Role: ${role}

Review the pinned target using your loaded reviewer profile only.

Inputs:
- Review cwd: ${review_cwd}
- Target manifest: ${run_abs}/target.md
- Review context: ${run_abs}/context.md
- Protocol: ${skill_dir}/references/subagent-protocol.md
- Reviewer profile: ${skill_dir}/references/reviewers/${role}.yaml already loaded as your system prompt

Task:
- Read target.md, context.md, and the protocol.
- Inspect the diff or codebase scope only for your loaded reviewer role.
- Return candidate findings only. Do not fix. Do not write plans.
- Cite changed files and lines when possible.
- For diff targets, report only issues introduced or exposed by the target.
- For codebase target, report only high-leverage issues with concrete evidence.
- Use the exact markdown return shape from the protocol.
- If clean, write: No findings.`
  }))
})
```

If the user requested a thinking level, apply it as an inline override on each selected subagent, not as a top-level setting:

```ts
{ profile, task, thinking: "xhigh" }
```

## Saving reports

The `subagent` tool writes aggregate runtime artifacts under `/tmp/pi-subagents-*/runs/<id>/`. After it returns, copy each child output into:

```text
.agents/reviews/<run-id>/reports/<role>.md
```

Do not ask subagents to write these files themselves. Review subagents are read-only.

## Safety rules

- Start reviewers only after `target.md` and `context.md` are complete.
- Do not edit source while reviewers are running.
- Do not enable `edit` or `write` in reviewer profiles.
- Do not apply fixes in review worktrees.
- Do not auto-remove worktrees; record cleanup commands for the user.
- If a report contains tool/launch errors, retry once or mark the role `not run`.
- If a reviewer reports plans or patches instead of findings, ignore those sections and adjudicate only concrete findings.

## Unavailable subagent tool

Do not fall back to direct Pi, tmux, or parent-only simulated subagents. Exit the review and tell the user that profile-backed subagents are required.
