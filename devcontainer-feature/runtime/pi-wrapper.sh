#!/usr/bin/env bash
set -euo pipefail

readonly RUNTIME_DIR="${JJ_PI_SHARE_DIR:-/usr/local/share/jj-pi}"

expand_pi_path() {
    case "$1" in
        \~) printf '%s\n' "${HOME}" ;;
        \~/*) printf '%s/%s\n' "${HOME}" "${1#\~/}" ;;
        *) printf '%s\n' "$1" ;;
    esac
}

if [ -z "${PI_CODING_AGENT_DIR:-}" ]; then
    configured_agent_dir="$(<"${RUNTIME_DIR}/pi-agent-dir")"
    PI_CODING_AGENT_DIR="$(expand_pi_path "${configured_agent_dir}")"
    export PI_CODING_AGENT_DIR
fi

script_path="$(readlink -f -- "$0")"
exec "${script_path}.upstream" "$@"
