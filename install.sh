#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly SOURCE_DIR="${ROOT}/src"
readonly AGENT_DIR="${PI_CODING_AGENT_DIR:-${HOME}/.pi/agent}"
readonly PACKAGE_NAME="@earendil-works/pi-coding-agent"
readonly PI_VERSION="${PI_VERSION:-latest}"

log() {
    printf '[pi] %s\n' "$*"
}

command -v node >/dev/null 2>&1 || { printf '[pi] ERROR: Node.js is required\n' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { printf '[pi] ERROR: npm is required\n' >&2; exit 1; }

log "installing ${PACKAGE_NAME}@${PI_VERSION}"
npm install --global "${PACKAGE_NAME}@${PI_VERSION}"

mkdir -p "${AGENT_DIR}"
backup_root="${HOME}/.local/state/pi/backups/$(date +%Y%m%d-%H%M%S)-$$"

for resource in AGENTS.md agents skills extensions; do
    source_path="${SOURCE_DIR}/${resource}"
    destination="${AGENT_DIR}/${resource}"

    if [ -L "${destination}" ] && [ "$(readlink -f -- "${destination}" 2>/dev/null || true)" = "$(readlink -f -- "${source_path}")" ]; then
        continue
    fi

    if [ -e "${destination}" ] || [ -L "${destination}" ]; then
        mkdir -p "${backup_root}"
        mv -- "${destination}" "${backup_root}/${resource}"
        log "backed up ${destination}"
    fi

    ln -s "${source_path}" "${destination}"
done

for extension in "${SOURCE_DIR}/extensions"/*; do
    [ -f "${extension}/package.json" ] || continue
    [ -f "${extension}/package-lock.json" ] || {
        printf '[pi] ERROR: missing package-lock.json: %s\n' "${extension}" >&2
        exit 1
    }
    log "installing dependencies for ${extension##*/}"
    npm ci --prefix "${extension}" --omit=peer --legacy-peer-deps
done

log "installed $(pi --version)"
