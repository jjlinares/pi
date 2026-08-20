#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly COLLECTION="${ROOT}/.build/test-collection"
readonly TMP="${ROOT}/.build/tmp"

rm -rf "${COLLECTION}" "${TMP}"
mkdir -p "${COLLECTION}/src/pi" "${COLLECTION}/test/pi" "${TMP}"
"${ROOT}/scripts/stage-feature.sh" "${COLLECTION}/src/pi" >/dev/null

cat > "${COLLECTION}/test/pi/test.sh" <<'TEST'
#!/usr/bin/env bash
set -euo pipefail
source dev-container-features-test-lib
check "Pi available" bash -c 'pi --version | grep -E "^[0-9]+\\.[0-9]+\\.[0-9]+"'
check "workspace state exists" test -d "$PWD/.pi/agent"
check "AGENTS activated" test -L "$PWD/.pi/agent/AGENTS.md"
check "agents activated" test -L "$PWD/.pi/agent/agents"
check "skills activated" test -L "$PWD/.pi/agent/skills"
check "extensions activated" test -L "$PWD/.pi/agent/extensions"
check "sessions persist in workspace" test -d "$PWD/.pi/sessions"
check "workspace Pi state ignored" grep -qxF '*' "$PWD/.pi/.gitignore"
check "no host mount contract" bash -c '! test -e /mnt/pi-host && ! test -e /mnt/pi-host-resolved'
reportResults
TEST
chmod +x "${COLLECTION}/test/pi/test.sh"

TMPDIR="${TMP}" npx --yes @devcontainers/cli@0.88.0 features test \
    --skip-scenarios \
    --features pi \
    --base-image mcr.microsoft.com/devcontainers/base:ubuntu \
    --remote-user vscode \
    "${COLLECTION}"
