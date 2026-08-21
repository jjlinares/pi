#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
temporary="$(mktemp -d)"
trap 'rm -rf "${temporary}"' EXIT

feature_root="${temporary}/features/pi"
"${ROOT}/scripts/stage-feature.sh" "${feature_root}" >/dev/null

node -e '
const fs = require("fs");
const metadata = JSON.parse(fs.readFileSync(process.argv[1]));
if (metadata.id !== "pi" || metadata.version !== "1.0.0") process.exit(1);
if (metadata.options?.piAgentDir?.default !== "~/.pi/agent") process.exit(1);
' "${feature_root}/devcontainer-feature.json"
test -f "${feature_root}/profile/AGENTS.md"
test -d "${feature_root}/profile/agents"
test -d "${feature_root}/profile/skills"
test -d "${feature_root}/profile/extensions"
if find "${feature_root}" -type d -name node_modules -print -quit | grep -q .; then
    printf 'staged Feature contains node_modules\n' >&2
    exit 1
fi

workspace="${temporary}/workspace"
home="${temporary}/home"
agent_dir="${home}/.pi/agent"
mkdir -p "${workspace}" "${agent_dir}/skills"
printf 'custom\n' > "${agent_dir}/skills/custom.txt"
printf '~/.pi/agent\n' > "${feature_root}/pi-agent-dir"
HOME="${home}" \
JJ_PI_SHARE_DIR="${feature_root}" \
    "${ROOT}/devcontainer-feature/runtime/post-start.sh" >/dev/null

test "$(readlink "${agent_dir}/AGENTS.md")" = "${feature_root}/profile/AGENTS.md"
test "$(readlink "${agent_dir}/agents")" = "${feature_root}/profile/agents"
test "$(readlink "${agent_dir}/skills")" = "${feature_root}/profile/skills"
test "$(readlink "${agent_dir}/extensions")" = "${feature_root}/profile/extensions"
test "$(find "${agent_dir}" -path '*/.jj-pi-backup.*/skills/custom.txt' -exec cat {} \;)" = "custom"
test ! -e "${workspace}/.pi"

custom_agent_dir="${temporary}/custom-agent"
printf '%s\n' "${custom_agent_dir}" > "${feature_root}/pi-agent-dir"
HOME="${home}" \
JJ_PI_SHARE_DIR="${feature_root}" \
    "${ROOT}/devcontainer-feature/runtime/post-start.sh" >/dev/null
test "$(readlink "${custom_agent_dir}/AGENTS.md")" = "${feature_root}/profile/AGENTS.md"

environment_agent_dir="${temporary}/environment-agent"
HOME="${home}" \
JJ_PI_SHARE_DIR="${feature_root}" \
PI_CODING_AGENT_DIR="${environment_agent_dir}" \
    "${ROOT}/devcontainer-feature/runtime/post-start.sh" >/dev/null
test "$(readlink "${environment_agent_dir}/AGENTS.md")" = "${feature_root}/profile/AGENTS.md"

bin_dir="${temporary}/bin"
mkdir -p "${bin_dir}"
cp "${ROOT}/devcontainer-feature/runtime/pi-wrapper.sh" "${bin_dir}/pi"
cat > "${bin_dir}/pi.upstream" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "${PI_CODING_AGENT_DIR:-}"
SH
chmod +x "${bin_dir}/pi" "${bin_dir}/pi.upstream"
printf '~/.pi/agent\n' > "${feature_root}/pi-agent-dir"
test "$(HOME="${home}" JJ_PI_SHARE_DIR="${feature_root}" "${bin_dir}/pi")" = "${agent_dir}"
test "$(HOME="${home}" JJ_PI_SHARE_DIR="${feature_root}" PI_CODING_AGENT_DIR=relative-agent "${bin_dir}/pi")" = "relative-agent"

echo 'tests passed'
