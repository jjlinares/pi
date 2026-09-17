---
name: create-skill
description: Create or update agent skills, including their instructions and supporting resources.
metadata:
  short-description: Create or update a skill
---

# Skill Creator

Create skills that give agents useful, non-obvious guidance without constraining unrelated work.

## Instruction Design

- **Assume capable agents.** Include only information that changes decisions or improves results. Remove generic advice, repeated rules, and speculative edge cases.
- **Preserve intent and scope.** Support the requested task without replacing the user's chosen product, modifying unrelated configuration, or implying permission for additional actions. Do not turn an example, past failure, or personal preference into a universal requirement.
- **Match specificity to risk.** Describe outcomes and decision criteria for open-ended work. Reserve fixed sequences, deterministic scripts, and strict constraints for concrete reliability or safety needs. Preserve non-obvious operational invariants and distinguish requirements from recommendations. Define stopping conditions for retrying or externally mutating workflows.
- **Keep dependencies deliberate.** Keep skills self-contained. Refer to another skill or tool only when the workflow requires it and it is available in the target environment. Specialized reviews and audits should apply when requested or genuinely needed, not merely because a task touches the subject.

## Skill Structure

Every skill needs a folder containing `SKILL.md`. Add supporting resources only when they serve the workflow:

```text
skill-name/
|-- SKILL.md                Instructions with YAML frontmatter
|-- agents/openai.yaml      Optional, where supported: UI metadata and invocation policy
|-- scripts/                Reusable or deterministic executable helpers
|-- references/             Documentation read only for relevant tasks
`-- assets/                 Files copied or adapted into generated output
```

Avoid placeholders, copied manuals, and auxiliary documentation without a concrete task or packaging need. Before removing existing resources, inspect their callers and purpose.

### Naming and Discovery

Use lowercase letters, digits, and hyphens for the name. Keep it under 64 characters and match the folder name. Prefer short action-oriented names; namespace by tool or domain when it improves discovery.

The required frontmatter fields are `name` and `description`. Preserve supported optional fields, such as existing `metadata`, when appropriate.

Names and descriptions are available before the skill is loaded. Describe the capability and when it applies. Add exclusions only to prevent likely misrouting; avoid exhaustive capability lists and catchalls. Put workflows and tool choices in the body rather than the description.

### Instructions and References

Keep purpose, common workflow, essential constraints, and routing in `SKILL.md`. Move substantial mode-specific procedures, schemas, or examples into `references/` when that reduces irrelevant context. A short skill can remain one file.

Link each reference from the instructions or another relevant resource, stating what it contains and when to read it. For example:

```markdown
For tracked changes, read [references/redlining.md](references/redlining.md).
```

Load only references needed for the current task. Keep each rule in one place rather than duplicating it across the entrypoint and references. For large references, add search terms or a short contents section when useful.

### Scripts and Assets

Use `scripts/` when logic would otherwise be rewritten repeatedly or deterministic execution materially improves reliability. Run new or changed scripts to verify their behavior within the task's permitted scope.

Use `assets/` for templates, images, fonts, or other output materials. Do not load them as instructions unless the task requires inspection.

## Create or Update

Adapt the work to the request. A narrow update may need only a focused edit and validation. For a new or substantially revised skill, identify realistic requests it should handle and resources that would materially help. If the task is already clear, proceed without requesting more examples.

Before finishing, check that:

- The description routes the intended requests without attracting unrelated work.
- Instructions preserve user choices and contain no redundant rules or unnecessary fixed steps.
- Resource links resolve and explain when to use their targets.
- Supporting files justify their maintenance and context cost.

## Modernize an Existing Skill

When adapting a skill to more capable agents, reassess which instructions still improve results rather than merely shortening the text.

- **Separate durable knowledge from scaffolding.** Preserve domain facts, non-obvious operational invariants, authorization boundaries, and fragile tool requirements. Reconsider basic tutorials, prescribed reasoning steps, and workarounds for older model limitations. Remove rules already enforced by the target environment.
- **Replace unnecessary prescriptions with decision criteria.** Where the agent can choose reliably, state the outcome and constraints instead of a fixed sequence. Retain scripts that provide deterministic correctness or useful automation, not just compensation for a weaker model.
- **Verify uncertain removals.** When warranted, compare the existing and simplified skill on representative requests using the target agent. Check observable outcomes and meaningful invariants, not matching wording or headings. A newer model alone is not evidence that a safeguard is obsolete. Use the independent evaluation guidance below when needed.
- **Correct narrowly.** Improve the skill from real usage or demonstrated failures. Restore or refine guidance where it materially helps instead of accumulating universal rules for individual examples. Preserve the skill's scope and invocation policy unless the user requests a change.

## Independent Forward-Testing

Use an independent subagent evaluation when complexity or risk makes behavioral validation worthwhile and delegation is available and authorized. Ordinary creation and small edits do not automatically require it.

Give the evaluator a realistic user request, the skill, and the minimum raw artifacts needed. Withhold the intended answer, suspected bug, proposed fix, and prior conclusions unless the evaluation requires them.

Keep evaluation within permitted resources and side effects. Isolate generated artifacts from the working tree and later evaluations. Seek approval for additional authorization, live production effects, or substantial time or cost. Review the outcome and artifacts, then make only changes supported by observed behavior.
