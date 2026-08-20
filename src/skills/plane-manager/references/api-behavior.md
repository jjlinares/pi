# Plane API Behavior Notes

Use this file when the task depends on route selection, create semantics, or response parsing.

## Docs vs Live Behavior Seen In This Workspace

- Plane hierarchy in practice is `Project -> Epic -> Task`, but epics still behave like work items under the API model rather than a completely separate object family.
- Docs for work item types referenced `/work-item-types/`
- Live instance responded on `/issue-types/`
- Docs implied project epics collection create semantics
- Live instance did not reliably support epic creation through `/projects/{project_id}/epics/`

## Response Shape Quirks

- Projects list: paginated envelope with `results`
- Members list: plain array
- Project members list: docs show nested arrays, live route `/projects/{project_id}/project-members/` returns a flat array of member objects
- Type list: plain array on the live route
- Work items list: paginated envelope with `results`
- Epics list: paginated envelope with `results`
- Expanded reads may return `type` as an object, while create responses may return `type_id` and `type` differently

## Open Caveats

- Epic create contract is still instance-specific here
- Route naming may vary by Plane version or deployment
