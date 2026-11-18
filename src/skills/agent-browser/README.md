# agent-browser

Adapted from [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) [`skills/agent-browser/SKILL.md`](https://github.com/vercel-labs/agent-browser/blob/main/skills/agent-browser/SKILL.md) at [`4720bc3`](https://github.com/vercel-labs/agent-browser/commit/4720bc3d).

Upstream's skill is a stub. The real guides ship inside the CLI and are served by `agent-browser skills get <name>`, so they always match the installed version. Upgrading the CLI updates them; this skill doesn't change.

## Local changes

- **Description**: short, instead of upstream's long trigger list. Reason: less prompt weight.
- **Visible**: no `hidden: true`. Reason: the skill must appear in the skill list to be picked.
- **No `allowed-tools`**: Pi and Mel don't enforce it.
- **Only points to `core`**: the core guide already lists its references and the specialized guides. Upstream's guide list, marketing, and install line are dropped. Reason: they duplicate the CLI and go stale.
