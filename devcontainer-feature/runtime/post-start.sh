#!/usr/bin/env bash
set -euo pipefail

readonly SHARE_DIR="${JJ_PI_SHARE_DIR:-/usr/local/share/jj-pi}"
readonly PROFILE_DIR="${SHARE_DIR}/profile"
readonly STATE_DIR="${JJ_PI_STATE_DIR:-${XDG_CACHE_HOME:-${HOME}/.cache}/jj-pi}"
readonly WORKSPACE_FILE="${STATE_DIR}/workspace"

expand_pi_path() {
    case "$1" in
        \~) printf '%s\n' "${HOME}" ;;
        \~/*) printf '%s/%s\n' "${HOME}" "${1#\~/}" ;;
        *) printf '%s\n' "$1" ;;
    esac
}

find_legacy_workspace() {
    if [ -s "${WORKSPACE_FILE}" ]; then
        local recorded_workspace
        recorded_workspace="$(<"${WORKSPACE_FILE}")"
        if [ -d "${recorded_workspace}/.pi/agent" ]; then
            realpath -m -- "${recorded_workspace}"
            return 0
        fi
    fi
    if [ -d "${PWD}/.pi/agent" ] && [ "$(cat "${PWD}/.pi/.gitignore" 2>/dev/null || true)" = "*" ]; then
        realpath -m -- "${PWD}"
        return 0
    fi
    return 1
}

clear_legacy_marker() {
    rm -f -- "${WORKSPACE_FILE}"
    rmdir -- "${STATE_DIR}" 2>/dev/null || true
}

copy_missing() {
    local source="$1"
    local destination="$2"
    mkdir -p "${destination}"
    cp -a --update=none -- "${source}/." "${destination}/"
}

migrate_legacy_workspace_agent() {
    local agent_dir="$1"
    local workspace
    workspace="$(find_legacy_workspace || true)"
    [ -n "${workspace}" ] || return 0

    local legacy_agent="${workspace}/.pi/agent"
    local legacy_sessions="${workspace}/.pi/sessions"
    local resolved_agent
    resolved_agent="$(realpath -m -- "${agent_dir}")"

    if [ "${resolved_agent}" = "$(realpath -m -- "${legacy_agent}")" ]; then
        if [ -d "${legacy_sessions}" ]; then
            copy_missing "${legacy_sessions}" "${agent_dir}/sessions"
            printf '[pi] copied missing legacy sessions from %s to %s\n' "${legacy_sessions}" "${agent_dir}/sessions" >&2
        fi
        clear_legacy_marker
        return 0
    fi

    [ "${resolved_agent}" = "${HOME}/.pi/agent" ] || return 0
    if [ -e "${agent_dir}" ]; then
        copy_missing "${legacy_agent}" "${agent_dir}"
        if [ -d "${legacy_sessions}" ]; then
            copy_missing "${legacy_sessions}" "${agent_dir}/sessions"
        fi
        clear_legacy_marker
        printf '[pi] copied missing legacy state from %s into %s\n' "${workspace}/.pi" "${agent_dir}" >&2
        return 0
    fi

    local migration_dir
    mkdir -p "$(dirname -- "${agent_dir}")"
    migration_dir="$(mktemp -d "${agent_dir}.migrate.XXXXXX")"
    if ! cp -a -- "${legacy_agent}/." "${migration_dir}/"; then
        rm -rf -- "${migration_dir}"
        printf '[pi] ERROR: failed to migrate legacy state from %s\n' "${legacy_agent}" >&2
        exit 1
    fi
    if [ -d "${legacy_sessions}" ] && [ ! -e "${migration_dir}/sessions" ]; then
        if ! cp -a -- "${legacy_sessions}" "${migration_dir}/sessions"; then
            rm -rf -- "${migration_dir}"
            printf '[pi] ERROR: failed to migrate legacy sessions from %s\n' "${legacy_sessions}" >&2
            exit 1
        fi
    fi
    mv -- "${migration_dir}" "${agent_dir}"
    clear_legacy_marker
    printf '[pi] migrated legacy state from %s to %s\n' "${workspace}/.pi" "${agent_dir}" >&2
}

configured_agent_dir="$(<"${SHARE_DIR}/pi-agent-dir")"
agent_dir="$(expand_pi_path "${PI_CODING_AGENT_DIR:-${configured_agent_dir}}")"
mkdir -p "$(dirname -- "${agent_dir}")"
exec 9>"${agent_dir}.jj-pi.lock"
flock 9

migrate_legacy_workspace_agent "${agent_dir}"
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
