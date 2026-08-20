#!/usr/bin/env bash
set -euo pipefail

readonly RUNTIME_DIR="/usr/local/share/jj-pi"
readonly STATE_DIR="${XDG_CACHE_HOME:-${HOME}/.cache}/jj-pi"
readonly WORKSPACE_FILE="${STATE_DIR}/workspace"

if [ ! -s "${WORKSPACE_FILE}" ]; then
    "${RUNTIME_DIR}/post-start.sh" >/dev/null
fi
workspace="$(<"${WORKSPACE_FILE}")"

if [ -z "${PI_CODING_AGENT_DIR:-}" ]; then
    export PI_CODING_AGENT_DIR="${workspace}/.pi/agent"
fi
if [ -z "${PI_CODING_AGENT_SESSION_DIR:-}" ]; then
    export PI_CODING_AGENT_SESSION_DIR="${workspace}/.pi/sessions"
fi

script_path="$(readlink -f -- "$0")"
exec "${script_path}.upstream" "$@"
