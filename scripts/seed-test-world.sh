#!/usr/bin/env bash
# Creates a minimal test world in the Docker data directory so FoundryVTT
# boots with a world available. Run this BEFORE starting the Docker container.
#
# Usage: bash scripts/seed-test-world.sh [data_dir]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${1:-${SCRIPT_DIR}/../docker/data-test}"
WORLD_DIR="${DATA_DIR}/Data/worlds/test-world"

if [ -f "${WORLD_DIR}/world.json" ]; then
    echo "Test world already exists at ${WORLD_DIR}, skipping."
    exit 0
fi

mkdir -p "${WORLD_DIR}"

cat > "${WORLD_DIR}/world.json" << 'WORLDJSON'
{
  "id": "test-world",
  "title": "Test World",
  "description": "Automated testing world for cosmere-rpg",
  "system": "cosmere-rpg",
  "coreVersion": "13.351",
  "systemVersion": "2.1.0",
  "compatibility": {
    "verified": "13.351",
    "minimum": "13"
  },
  "flags": {}
}
WORLDJSON

echo "Test world seeded at ${WORLD_DIR}"
