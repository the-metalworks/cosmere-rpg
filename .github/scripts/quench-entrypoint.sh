#!/bin/bash
set -e

WORLD_NAME="${FOUNDRY_WORLD:-dockerworld}"
MODULES_DIR="/data/Data/modules"
SETTINGS_DB="/data/Data/worlds/${WORLD_NAME}/data/settings"

# Enable modules in the world's settings DB
echo "Enabling modules in world '${WORLD_NAME}'..."
node /opt/enable-modules/enable-modules.mjs "$SETTINGS_DB" "$MODULES_DIR"

echo "Starting Foundry for Quench test run..."

# Start Foundry in background
node resources/app/main.mjs --port=30000 --headless --noupdate --dataPath=/data --world="$WORLD_NAME" &
FOUNDRY_PID=$!

# Wait for Foundry to be ready
echo "Waiting for Foundry to start..."
MAX_WAIT=120
ELAPSED=0
until curl -sf http://localhost:30000 > /dev/null 2>&1; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    echo "ERROR: Foundry failed to start within ${MAX_WAIT}s"
    kill "$FOUNDRY_PID" 2>/dev/null || true
    exit 1
  fi
done
echo "Foundry is ready."

# Run Playwright test runner
node /opt/quench-runner.mjs
EXIT_CODE=$?

# Shut down Foundry
kill "$FOUNDRY_PID" 2>/dev/null || true
wait "$FOUNDRY_PID" 2>/dev/null || true

exit "$EXIT_CODE"
