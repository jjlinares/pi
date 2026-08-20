#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
temporary="$(mktemp -d)"
trap 'rm -rf "${temporary}"' EXIT

feature_root="${temporary}/features/pi"
"${ROOT}/scripts/stage-feature.sh" "${feature_root}" >/dev/null

node -e 'const fs=require("fs"); const p=JSON.parse(fs.readFileSync(process.argv[1])); if (p.id !== "pi" || p.version !== "1.0.0") process.exit(1)' "${feature_root}/devcontainer-feature.json"
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
mkdir -p "${workspace}" "${home}"
printf 'keep\n' > "${workspace}/existing-auth"
HOME="${home}" \
JJ_PI_SHARE_DIR="${feature_root}" \
JJ_PI_STATE_DIR="${temporary}/state" \
    "${ROOT}/devcontainer-feature/runtime/post-start.sh" "${workspace}" >/dev/null

test "$(readlink "${workspace}/.pi/agent/AGENTS.md")" = "${feature_root}/profile/AGENTS.md"
test "$(readlink "${workspace}/.pi/agent/agents")" = "${feature_root}/profile/agents"
test "$(readlink "${workspace}/.pi/agent/skills")" = "${feature_root}/profile/skills"
test "$(readlink "${workspace}/.pi/agent/extensions")" = "${feature_root}/profile/extensions"
test "$(cat "${temporary}/state/workspace")" = "${workspace}"
test "$(cat "${workspace}/.pi/.gitignore")" = '*'

echo 'tests passed'
