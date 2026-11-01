---
name: plex
description: Search and inspect jj's Plex servers, including shared servers.
---

# Plex

Use the Plex API, not the browser, unless the user asks for browser work.

`PLEX_TOKEN` is jj's Plex account token. It is stored in `~/.config/shell/env.local`; source that file if the variable is missing. Never print, commit, or paste the token.

## Helper

Run the bundled helper from this skill directory:

```bash
uv run --no-project scripts/plex.py servers
uv run --no-project scripts/plex.py search "Verity" --type movie
uv run --no-project scripts/plex.py search "Severance" --server TUF-SERVER --type show
uv run --no-project scripts/plex.py get /library/sections --server jj
```

- `servers` lists every server the account can access. `owner: "me"` means jj owns it; other owners are shared servers.
- `search` queries all accessible servers unless `--server` is given. Plex search is fuzzy, so confirm returned titles and years before claiming a match.
- `get` reads any server API path with that server's own access token and prints JSON.

## Topology

- `jj` is the Plex Media Server on this machine, also reachable at `http://localhost:32400`. Its advertised `plex.direct` address may not resolve here; the helper falls back to localhost after checking its machine identifier.
- Shared servers, such as `TUF-SERVER`, are discovered from `https://clients.plex.tv/api/v2/resources`. Use each resource's `accessToken` and connection URIs. The account token alone may not authorize shared servers.

## Boundaries

Treat shared servers as read-only. Ask before actions that change Plex state, such as scans, deletions, metadata edits, playback control, sharing, or settings changes.
