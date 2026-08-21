#!/usr/bin/env bash
set -euo pipefail

readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DESTINATION="${1:-${ROOT}/.build/features/pi}"
readonly FEATURE_VERSION="${2:-1.0.0}"

if [[ ! "${FEATURE_VERSION}" =~ ^1\.0\.[0-9]+$ ]]; then
    printf 'Invalid Feature version: %s\n' "${FEATURE_VERSION}" >&2
    exit 1
fi

rm -rf -- "${DESTINATION}"
mkdir -p "${DESTINATION}/profile"
rsync -a --exclude node_modules "${ROOT}/devcontainer-feature/" "${DESTINATION}/"
node - "${DESTINATION}/devcontainer-feature.json" "${FEATURE_VERSION}" <<'NODE'
const fs = require("node:fs");
const [metadataPath, version] = process.argv.slice(2);
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
fs.writeFileSync(metadataPath, `${JSON.stringify({ ...metadata, version }, null, 2)}\n`);
NODE
rsync -a --exclude node_modules "${ROOT}/src/" "${DESTINATION}/profile/"
cp "${ROOT}/LICENSE" "${DESTINATION}/LICENSE"
printf '%s\n' "${DESTINATION}"
