---
name: plane-manager
description: This skill should be used when the user asks to "list Plane projects", "create a Plane epic", "add Plane tasks", "assign work in Plane", "update a Plane issue", "check Plane work item types", or otherwise create, update, search, retrieve, or manage Plane resources through the API.
---

# Plane Manager

Use this skill to work with Plane through the raw REST API. Prefer live API confirmation over trusting docs alone.

## Workflow

Start every Plane task with this order:
1. Verify `PLANE_URL`, `PLANE_API_PAT`, and `PLANE_WORKSPACE` exist. Check existence only. Never print values.
2. Discover the current docs tree from the GitHub Contents API:
   `https://api.github.com/repos/makeplane/developer-docs/contents/docs/api-reference?ref=master`
3. Read only the doc pages needed for the task.
4. Resolve live IDs before any write:
   - project UUID
   - member UUIDs for assignees
   - work item type IDs
5. Test the target project with a low-risk read if writes are expected.
6. Prefer write patterns already proven on the live instance for this workspace.
7. Verify writes by readback or list query.

## Practical Guidance

- Use raw REST API unless the user explicitly asks for an SDK.
- Authenticate with `X-API-Key: ${PLANE_API_PAT}`.
- Replace doc examples that use `https://api.plane.so` with `${PLANE_URL}`.
- Use `${PLANE_WORKSPACE}` anywhere docs show `{workspace_slug}`.
- Resolve IDs live rather than inferring from names.
- Confirm method support before writes when a route is unfamiliar.
- Expect docs and live behavior to diverge. Confirm route, method, and response shape against the live instance before relying on them.
- Users need to be added to projects to interact with them. Workspace-level permissions are not enough for project-specific actions.
- Many project features are opt-in. A new or lightly configured project usually has only basic work items enabled.
- Expect epics, cycles, modules, custom work item types, and similar features to be unavailable until that project explicitly enables them.
- Expect project-specific work item types and custom fields even within the same workspace.
- We typically enable custom work item types and use `Feature` as a grouping item for multiple child work items.
- Use `parent` to build hierarchy in the usual sequence: epic-like item first when epics are enabled, then `Feature` with `parent = epic_id`, then task or other child work item with `parent = feature_id`.

# Common API Routes
- List projects:
  `GET /api/v1/workspaces/{workspace_slug}/projects/`
- List members:
  `GET /api/v1/workspaces/{workspace_slug}/members/`
- List project members:
  `GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/project-members/`
- List work item types on the live instance:
  `GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/issue-types/`
- Create work item:
  `POST /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/`
- Read work item:
  `GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/?expand=type`

## Additional Resources

Reference files:
- `references/api-behavior.md` - hierarchy semantics, live API quirks, doc mismatches, permission lessons

## Maintenance

Surface any discrepancy between Plane docs, this skill's instructions, and live API behavior. Call it out clearly in the response so the skill can be updated after repeated or important mismatches.
