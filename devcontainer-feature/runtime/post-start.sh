#!/usr/bin/env bash
set -euo pipefail

readonly SHARE_DIR="${JJ_PI_SHARE_DIR:-/usr/local/share/jj-pi}"
readonly PROFILE_DIR="${SHARE_DIR}/profile"
readonly STATE_DIR="${JJ_PI_STATE_DIR:-${XDG_CACHE_HOME:-${HOME}/.cache}/jj-pi}"

workspace="${1:-${PWD}}"
workspace="$(realpath -m -- "${workspace}")"
[ -d "${workspace}" ] || { printf '[pi] ERROR: workspace does not exist: %s\n' "${workspace}" >&2; exit 1; }

pi_dir="${workspace}/.pi"
agent_dir="${pi_dir}/agent"
session_dir="${pi_dir}/sessions"
mkdir -p "${agent_dir}" "${session_dir}" "${STATE_DIR}"
chmod 0700 "${pi_dir}" "${agent_dir}"

for resource in AGENTS.md agents skills extensions; do
    source_path="${PROFILE_DIR}/${resource}"
    destination="${agent_dir}/${resource}"
    [ -e "${source_path}" ] || { printf '[pi] ERROR: packaged resource missing: %s\n' "${source_path}" >&2; exit 1; }
    rm -rf -- "${destination}"
    ln -s "${source_path}" "${destination}"
done

printf '*\n' > "${pi_dir}/.gitignore"
printf '%s\n' "${workspace}" > "${STATE_DIR}/workspace"
chmod 0600 "${STATE_DIR}/workspace"

printf '[pi] profile active; state persists at %s\n' "${pi_dir}"
