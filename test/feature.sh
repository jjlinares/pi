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
check "standard agent directory exists" test -d "$HOME/.pi/agent"
check "AGENTS activated" test -L "$HOME/.pi/agent/AGENTS.md"
check "agents activated" test -L "$HOME/.pi/agent/agents"
check "skills activated" test -L "$HOME/.pi/agent/skills"
check "extensions activated" test -L "$HOME/.pi/agent/extensions"
check "workspace state absent" bash -c '! test -e "$PWD/.pi"'
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
