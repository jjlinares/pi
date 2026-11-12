# create-verification-skill

Adapted from [cursor/plugins](https://github.com/cursor/plugins) `pstack/skills/create-verification-skill` at [`c49b37a`](https://github.com/cursor/plugins/commit/c49b37a2c0e7bede60a71ad7322e3f12c337a3da).

## Local changes

- **Import**: generated skills go in `.agents/skills/` instead of `.cursor/skills/`, commands use Pi's `/skill:` prefix, and the description and prose follow our writing rules. Reason: run under Pi.
- **In-place launch**: generated server and UI skills run in the agent's worktree by default, with hot reload and persistent data, and refuse the user's primary checkout; `--snapshot` keeps the disposable copy for the primary checkout, side-by-side comparisons, and empty-state recipes. Cleanup in place kills only the launched process tree, ownership probes must not create files the app validates, and the example map's baseline launches a snapshot. Reason: building Mel's `verify-mel` showed that frozen snapshots go stale under active work, forcing a restart and reseed per change.
