#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DESTINATION="${1:-${ROOT}/.build/features/pi}"

rm -rf -- "${DESTINATION}"
mkdir -p "${DESTINATION}/profile"
rsync -a --exclude node_modules "${ROOT}/devcontainer-feature/" "${DESTINATION}/"
rsync -a --exclude node_modules "${ROOT}/src/" "${DESTINATION}/profile/"
cp "${ROOT}/LICENSE" "${DESTINATION}/LICENSE"
printf '%s\n' "${DESTINATION}"
