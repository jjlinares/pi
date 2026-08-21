#!/usr/bin/env bash
set -euo pipefail

readonly SHARE_DIR="${JJ_PI_SHARE_DIR:-/usr/local/share/jj-pi}"
readonly PROFILE_DIR="${SHARE_DIR}/profile"

expand_pi_path() {
    case "$1" in
        \~) printf '%s\n' "${HOME}" ;;
        \~/*) printf '%s/%s\n' "${HOME}" "${1#\~/}" ;;
        *) printf '%s\n' "$1" ;;
    esac
}

configured_agent_dir="$(<"${SHARE_DIR}/pi-agent-dir")"
agent_dir="$(expand_pi_path "${PI_CODING_AGENT_DIR:-${configured_agent_dir}}")"
mkdir -p "${agent_dir}"
chmod 0700 "${agent_dir}"

backup_dir=""
for resource in AGENTS.md agents skills extensions; do
    source_path="${PROFILE_DIR}/${resource}"
    destination="${agent_dir}/${resource}"
    [ -e "${source_path}" ] || { printf '[pi] ERROR: packaged resource missing: %s\n' "${source_path}" >&2; exit 1; }
    if [ -L "${destination}" ] && [ "$(readlink -- "${destination}")" = "${source_path}" ]; then
        continue
    fi
    if [ -e "${destination}" ] || [ -L "${destination}" ]; then
        if [ -z "${backup_dir}" ]; then
            backup_dir="$(mktemp -d "${agent_dir}/.jj-pi-backup.XXXXXX")"
        fi
        mv -- "${destination}" "${backup_dir}/${resource}"
    fi
    ln -s "${source_path}" "${destination}"
done

if [ -n "${backup_dir}" ]; then
    printf '[pi] backed up conflicting profile resources at %s\n' "${backup_dir}" >&2
fi
printf '[pi] profile active at %s\n' "${agent_dir}"
