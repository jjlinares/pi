# Handoff: `pi-devcontainer`

## Objective

Implement a host-side Pi extension that automatically routes Pi's shell execution into the running VS Code Dev Container for the current project. Pi itself, authentication, sessions, file tools, and other extensions remain on the host.

The package scaffold is at:

- Source: `~/.local/share/chezmoi/dot_pi/agent/extensions/pi-devcontainer/`
- Chezmoi target: `~/.pi/agent/extensions/pi-devcontainer/`

Do not initialize a nested Git repository. The chezmoi source directory is already a Git repository.

## Approved design

### Activation and discovery

- Activate automatically only when Pi's canonical cwd is exactly a project root containing a standard Dev Container configuration:
  - `.devcontainer/devcontainer.json`, or
  - `.devcontainer.json`.
- Alternate config paths may be accepted only when confirmed by runtime Dev Container metadata.
- Deliberate behavior: if Pi starts in a subdirectory such as `project/src`, the extension is inactive and shell commands execute on the host without an ancestor warning.
- `--no-devcontainer` fully bypasses discovery and routing and restores ordinary host behavior.
- Local Docker only. No Podman, SSH Docker host, Codespaces, OpenShell, or container lifecycle management in v1.
- Attach only to an already-running container. Never start, build, rebuild, stop, or remove containers.
- Identify the workspace container by an exact canonical match against Docker label `devcontainer.local_folder`.
- Confirm `devcontainer.config_file` and inspect the actual runtime mount.
- Require exactly one running match and a writable bind mount covering the project root. Zero or duplicate matches fail; never guess by display name, Compose service, image, or container name.
- Cache the selected container ID, inspect it before each command, and rediscover when it stops, disappears, or its relevant metadata changes.
- If the container is rebuilt during a session, automatically bind to the unique replacement on the next command.

### Failure behavior

- At a Dev Container project root, missing Docker, denied Docker access, missing container, invalid mount, duplicate match, or missing required container primitives should visibly fail rather than fall back to host shell.
- Approved startup intent is to terminate Pi when initial activation cannot succeed. Pi's supported mechanism is `ctx.shutdown()`: it gracefully exits TUI/RPC while idle, but is documented as a no-op in print mode. Do not use `process.exit()`; in noninteractive modes, at minimum keep routed bash blocked and return a clear error.
- If a previously valid container disappears mid-session, fail the command and retain the Pi session; retry discovery on the next command.
- If another extension overrides `bash`, refuse activation instead of relying on uncertain tool load order.

### Routed surface

Route only:

- the built-in LLM `bash` tool; and
- user `!` / `!!` commands through `user_bash`.

Leave these host-side:

- `read`, `write`, `edit`, `grep`, `find`, and `ls` because the project is bind-mounted;
- extension `pi.exec()` calls;
- `skill-interpolation` subprocesses; and
- current subagents, which launch child Pi processes with `--no-extensions`.

This is integration, not security isolation.

### Execution semantics

- Use the final merged Dev Container `remoteUser` from runtime `devcontainer.metadata`; fallback to Docker `Config.User`. Permit root when it is the declared/default user and show it prominently.
- Invoke `docker exec --user <user> --workdir <mapped-cwd>` where a user is resolved.
- Let Docker derive identity environment naturally. Preserve container environment only. Do not synthesize `HOME`, `USER`, `LOGNAME`, or `SHELL`; do not apply Dev Container `remoteEnv`; do not forward host/Pi environment.
- Run `/bin/bash -c <command>`, falling back to `/bin/sh -c <command>`.
- Do not pass Docker `-i` or `-t`; stdin is closed and output remains stream-captured.
- Map only cwd from host mount source to container mount destination. Never rewrite arbitrary command text. Reject unmappable cwd values.
- Required container primitives for strict cancellation: `sh`, `setsid`, and `kill`. Preflight and fail; never install packages or weaken cleanup automatically.
- Run each command in a unique container process group. On abort or timeout: TERM the group, wait 2 seconds, then KILL it. Verify/report cleanup failure. Killing only the host `docker exec` client is insufficient and was experimentally shown to leave the container process alive.
- Permit concurrent bash calls using independent process groups and tokens.
- Use the Docker CLI via argument-safe Node `spawn`; no Docker SDK/runtime npm dependency.
- Preserve Pi's built-in bash result/rendering/truncation behavior by wrapping `createBashTool` with custom `BashOperations`. Do not implement a shape-incompatible custom bash result.

### Agent guidance and UX

- Add concise `before_agent_start` guidance while active:
  - exact host-to-container workspace mapping;
  - selected user and shell;
  - file tools use host paths;
  - shell uses the mapped container cwd;
  - prefer relative paths; and
  - only `bash` and `!` are routed.
- Show compact active/error footer status.
- Register `/devcontainer` diagnostics showing root, container name, mapping, user, shell, and health. In ordinary host projects, report inactive.
- Do not implement `/devcontainer reconnect`; command-time validation already rediscoveries automatically.
- No v1 JSON configuration file.

## Verified environment facts

- Installed Pi version during design: `0.81.1`.
- Relevant installed Pi docs:
  - `docs/containerization.md`
  - `docs/security.md`
  - `docs/extensions.md`, especially Remote Execution
  - `examples/extensions/ssh.ts`
  - `examples/extensions/gondolin/index.ts`
- `BashOperations.exec(command, cwd, { onData, signal, timeout, env })` must stream stdout/stderr via `onData`, honor abort and timeout, and return `{ exitCode }`.
- Use `pi.on("user_bash", ...)` for `!` and `!!`; a bash tool override alone does not cover them.
- Resolve CLI flags during `session_start`, not extension factory initialization.
- Project-local configuration is trust-gated; this is a global auto-discovered extension managed by chezmoi.
- Current Docker examples verified during design:
  - `infosource/datahub` and `infosource/datahub-1` can run simultaneously.
  - Both use Dev Container name/service `datahub` and container destination `/workspace`, so those values cannot identify the project.
  - Their distinct `devcontainer.local_folder` labels point to their respective host roots.
  - Their workspace containers have the Dev Container labels; PostgreSQL siblings do not.
  - Runtime bind mounts map each exact host root to `/workspace`.
  - Both resolve to user `node`, home `/home/node`, shell `/bin/bash`.
- Do not bake observed container IDs into code or tests; IDs are ephemeral.

## Chezmoi integration

- Add implementation only under `~/.local/share/chezmoi/dot_pi/agent/extensions/pi-devcontainer/` plus the existing dependency-install template when needed.
- Existing template: `~/.local/share/chezmoi/run_onchange_after_install-pi-extension-dependencies.sh.tmpl`.
- It has a hardcoded extension list. Add `pi-devcontainer` so future manifest changes trigger dependency setup, even though v1 has no runtime dependencies.
- After implementation and tests, apply only the new target rather than performing a full chezmoi apply or repairing unrelated configuration drift.
- Do not use `pi install`; chezmoi deploys this auto-discovered extension directly.

## Package structure and validation

Approved structure:

- `index.ts`: Pi lifecycle/tool/command wiring.
- Pure core modules: Docker metadata parsing, discovery, mount/path mapping, user/shell resolution, and process-group execution.
- Deterministic unit tests with injected/fake Docker responses.
- Explicit `npm run test:integration` for live Docker tests; normal `npm test` must not require Docker.
- No runtime npm dependencies; Pi remains peer dependency `"*"`, matching sibling private extensions.
- Live tests may inspect currently running `datahub` and `datahub-1`, but must discover by labels and skip clearly if unavailable.
- Live tests may use `/tmp` for process cleanup probes but must never mutate either workspace.

## Current state

Created scaffold only:

- `package.json`
- `package-lock.json`
- `index.ts` with a no-op extension factory
- `README.md`

Routing, tests, scripts, and chezmoi dependency-template integration remain unimplemented.

## Suggested skills

- `codebase-design`: use before finalizing core/module seams and dependency injection boundaries.
- `commit`: use only when asked to create or review the commit message.

## Next action

Inspect the scaffold and sibling extension conventions, then implement the approved design with unit tests. Do not reopen settled product decisions unless source/API evidence makes them impossible or unsafe.
