# pi

Juan's Pi configuration and Dev Container Feature.

## Layout

```text
src/                  Portable Pi instructions, agents, skills, and extensions
devcontainer-feature/ Feature source
install.sh             Host installer
```

Secrets and mutable Pi state are not stored in this repository.

## Host installation

Requires Node.js and npm:

```bash
./install.sh
```

This installs Pi, links `src/` resources into `~/.pi/agent`, and installs extension dependencies. Existing managed resources are backed up under `~/.local/state/pi/backups/`. Authentication, settings, sessions, and trust state are preserved.

## Dev Container Feature

```json
"features": {
  "ghcr.io/jjlinares/pi/pi:1": {}
}
```

The Feature installs Pi and packages `src/` into the image. At container start it activates the packaged profile and stores mutable state under the existing workspace mount:

```text
<workspace>/.pi/agent/     Authentication, settings, trust, and profile links
<workspace>/.pi/sessions/  Sessions
```

No host Pi directory is mounted. The workspace `.pi` directory is self-ignored by Git and survives container restarts and rebuilds as long as the workspace persists.

## Local Feature staging

```bash
./scripts/stage-feature.sh
```

This produces a standard Feature collection under `.build/features/pi/` without copying `node_modules`.

## Tests

```bash
./test/test.sh     # staging and workspace activation
./test/feature.sh  # complete Feature build and container test
```
