#!/usr/bin/env bash
# Polls the FoundryVTT server until it responds with HTTP 200.
# Used as a readiness check before running Playwright tests.
#
# Usage: bash scripts/wait-for-foundry.sh [url] [timeout_seconds]

set -euo pipefail

URL="${1:-http://localhost:30000}"
TIMEOUT="${2:-120}"
INTERVAL=3

echo "Waiting for FoundryVTT at ${URL} (timeout: ${TIMEOUT}s)..."

elapsed=0
while [ $elapsed -lt $TIMEOUT ]; do
    if curl -sf "${URL}" > /dev/null 2>&1; then
        echo "FoundryVTT is ready at ${URL}"
        exit 0
    fi
    sleep $INTERVAL
    elapsed=$((elapsed + INTERVAL))
    echo "  ...still waiting (${elapsed}s elapsed)"
done

echo "ERROR: FoundryVTT did not become ready within ${TIMEOUT}s"
exit 1
