#!/usr/bin/env bash
# Downloads the Quench module for mounting into the FoundryVTT Docker container.
# The module is extracted to docker/quench-module/ which is then bind-mounted
# into the container at /data/Data/modules/quench/.
#
# Usage: bash scripts/setup-quench.sh

set -euo pipefail

QUENCH_VERSION="${QUENCH_VERSION:-v0.10.0}"
QUENCH_URL="https://github.com/Ethaks/FVTT-Quench/releases/download/${QUENCH_VERSION}/quench.zip"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/../docker/quench-module"

# Skip if already downloaded
if [ -f "${TARGET_DIR}/module.json" ]; then
    echo "Quench module already present at ${TARGET_DIR}, skipping download."
    echo "Delete ${TARGET_DIR} and re-run to force a fresh download."
    exit 0
fi

echo "Downloading Quench ${QUENCH_VERSION}..."
mkdir -p "${TARGET_DIR}"

TEMP_ZIP="$(mktemp)"
trap 'rm -f "${TEMP_ZIP}"' EXIT

curl -L -o "${TEMP_ZIP}" "${QUENCH_URL}"
unzip -o "${TEMP_ZIP}" -d "${TARGET_DIR}"

echo "Quench module extracted to ${TARGET_DIR}"
