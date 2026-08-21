#!/usr/bin/env bash
set -euo pipefail

readonly FEATURE_NAME="pi"
readonly PACKAGE_NAME="@earendil-works/pi-coding-agent"
readonly SHARE_DIR="/usr/local/share/jj-pi"
readonly PROFILE_SOURCE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/profile" && pwd)"

log() {
    printf '[%s] %s\n' "${FEATURE_NAME}" "$*"
}

fail() {
    printf '[%s] ERROR: %s\n' "${FEATURE_NAME}" "$*" >&2
    exit 1
}

[ "$(id -u)" -eq 0 ] || fail "installation must run as root"
[ "$(uname -s)" = Linux ] || fail "only Linux is supported"
[ -r /etc/os-release ] || fail "/etc/os-release is required"
# shellcheck disable=SC1091
. /etc/os-release
os_family=" ${ID:-} ${ID_LIKE:-} "
case "${os_family}" in
    *" debian "*|*" ubuntu "*) ;;
    *) fail "only Debian/Ubuntu-based images are supported" ;;
esac

command -v apt-get >/dev/null 2>&1 || fail "apt-get is required"
command -v node >/dev/null 2>&1 || fail "Node.js dependency was not installed"
command -v npm >/dev/null 2>&1 || fail "npm dependency was not installed"
[ "$(node -p 'process.versions.node.split(".")[0]')" = 24 ] || fail "Node.js 24 is required"
[ -f "${PROFILE_SOURCE}/AGENTS.md" ] || fail "packaged profile is missing"

export DEBIAN_FRONTEND=noninteractive
log "installing runtime dependencies"
apt_update_log="$(mktemp)"
if ! apt-get update 2>&1 | tee "${apt_update_log}"; then
    mapfile -t broken_yarn_sources < <(grep -lR 'dl\.yarnpkg\.com' /etc/apt/sources.list.d 2>/dev/null || true)
    if ! grep -q 'dl.yarnpkg.com' "${apt_update_log}" \
        || ! grep -Eq 'NO_PUBKEY|not signed' "${apt_update_log}" \
        || [ "${#broken_yarn_sources[@]}" -eq 0 ]; then
        rm -f "${apt_update_log}"
        fail "apt-get update failed"
    fi
    for source_file in "${broken_yarn_sources[@]}"; do
        mv "${source_file}" "${source_file}.disabled-by-pi"
        log "disabled stale Yarn APT source ${source_file}"
    done
    apt-get update || fail "apt-get update failed after disabling stale Yarn sources"
fi
rm -f "${apt_update_log}"
apt-get install -y --no-install-recommends ca-certificates git ripgrep util-linux
rm -rf /var/lib/apt/lists/*
rm -f /var/cache/apt/archives/*.deb

existing_pi="$(command -v pi 2>/dev/null || true)"
if [ -n "${existing_pi}" ] && [ -e "${existing_pi}.upstream" ]; then
    rm -f "${existing_pi}"
    mv "${existing_pi}.upstream" "${existing_pi}"
fi

pi_version="${PIVERSION:-latest}"
[ -n "${pi_version}" ] || fail "piVersion must not be empty"
pi_agent_dir="${PIAGENTDIR-~/.pi/agent}"
[ -n "${pi_agent_dir}" ] || fail "piAgentDir must not be empty"
case "${pi_agent_dir}" in
    /*|\~/*) ;;
    *) fail "piAgentDir must be an absolute path or begin with ~/" ;;
esac
log "installing ${PACKAGE_NAME}@${pi_version}"
npm install --global --ignore-scripts "${PACKAGE_NAME}@${pi_version}"
hash -r
pi_path="$(command -v pi)" || fail "Pi is unavailable after npm install"

rm -rf "${SHARE_DIR}"
mkdir -p "${SHARE_DIR}/profile"
cp -a "${PROFILE_SOURCE}/." "${SHARE_DIR}/profile/"
cp "$(dirname -- "${BASH_SOURCE[0]}")/runtime/post-start.sh" "${SHARE_DIR}/post-start.sh"
cp "$(dirname -- "${BASH_SOURCE[0]}")/runtime/pi-wrapper.sh" "${SHARE_DIR}/pi-wrapper.sh"
printf '%s\n' "${pi_agent_dir}" > "${SHARE_DIR}/pi-agent-dir"
chmod 0755 "${SHARE_DIR}/post-start.sh" "${SHARE_DIR}/pi-wrapper.sh"
chmod 0644 "${SHARE_DIR}/pi-agent-dir"

for extension in "${SHARE_DIR}/profile/extensions"/*; do
    [ -f "${extension}/package.json" ] || continue
    [ -f "${extension}/package-lock.json" ] || fail "missing package-lock.json: ${extension}"
    log "installing dependencies for ${extension##*/}"
    npm ci --prefix "${extension}" --omit=peer --legacy-peer-deps
done

mv -f "${pi_path}" "${pi_path}.upstream"
cp "${SHARE_DIR}/pi-wrapper.sh" "${pi_path}"
chmod 0755 "${pi_path}"
hash -r

log "installed $("${pi_path}.upstream" --version)"
