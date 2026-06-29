#!/usr/bin/env bash
# Sync the standalone Seed Searcher build into the APK assets folder.
#
# Run from anywhere; uses paths relative to this script.
#
# Usage:
#   ./scripts/sync-web.sh
#
# Prereqs:
#   - ../Balatro-Seed-Searcher checked out next to ../Balatropedia
#   - cd ../Balatro-Seed-Searcher/web && npm run build  (done first)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APK_DIR="$(cd "$HERE/.." && pwd)"
# We expect Balatro-Seed-Searcher to be a sibling of Balatropedia
SS_DIST="$(cd "$APK_DIR/../.." && pwd)/Balatro-Seed-Searcher/web/dist"
ASSETS="$APK_DIR/android/app/src/main/assets"

if [ ! -d "$SS_DIST" ]; then
  echo "Standalone dist not found at: $SS_DIST"
  echo "Run: cd ../Balatro-Seed-Searcher/web && npm run build  first."
  exit 1
fi

echo "Syncing $SS_DIST -> $ASSETS"
rm -rf "$ASSETS"
mkdir -p "$ASSETS"
cp -R "$SS_DIST/." "$ASSETS/"

# Sanity check: the threaded bundle must be present, otherwise the
# COOP/COEP plumbing in MainActivity buys us nothing.
if [ ! -f "$ASSETS/engine-threads/balatro_seed_engine_bg.wasm" ]; then
  echo "WARNING: engine-threads/balatro_seed_engine_bg.wasm missing."
  echo "         The APK will run, but threading mode will not engage."
fi

echo "Done. $(find "$ASSETS" -type f | wc -l) files staged."
