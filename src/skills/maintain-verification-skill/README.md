# maintain-verification-skill

Adapted from [cursor/plugins](https://github.com/cursor/plugins) `pstack/skills/maintain-verification-skill` at [`c49b37a`](https://github.com/cursor/plugins/commit/c49b37a2c0e7bede60a71ad7322e3f12c337a3da).

## Local changes

- **Import**: targets `.agents/skills/verify-*/` instead of `.cursor/skills/`, commands use Pi's `/skill:` prefix, and the description and prose follow our writing rules. Reason: run under Pi.
- **In-place launch**: the live pass uses snapshot mode when recipes assume the map's baseline, and a server or UI launch without the in-place default, primary-checkout refusal, opt-in snapshot, or process-tree cleanup is a harness gap. Reason: match the launch contract that `create-verification-skill` now generates.
