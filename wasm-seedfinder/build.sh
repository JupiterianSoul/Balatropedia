#!/usr/bin/env bash
# Build the wasm-seedfinder crate and copy output to client/src/wasm/seedfinder/
# Run from repo root: bash wasm-seedfinder/build.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/client/src/wasm/seedfinder"

echo "=== Balatropedia WASM Seed Finder Build ==="
echo "Crate:  $SCRIPT_DIR"
echo "Output: $OUT_DIR"

# Ensure rustup/cargo available
if ! command -v cargo &>/dev/null; then
  echo "Installing Rust toolchain..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  source "$HOME/.cargo/env"
fi

# Ensure wasm32 target
rustup target add wasm32-unknown-unknown

# Ensure wasm-pack
if ! command -v wasm-pack &>/dev/null; then
  echo "Installing wasm-pack..."
  cargo install wasm-pack
fi

# Build with SIMD enabled
echo "Building with SIMD (target-feature=+simd128)..."
cd "$SCRIPT_DIR"
RUSTFLAGS="-C target-feature=+simd128" \
  wasm-pack build \
    --target web \
    --release \
    --out-dir "$OUT_DIR" \
    --out-name seedfinder

echo "Build complete: $OUT_DIR"
ls -lh "$OUT_DIR"/*.wasm 2>/dev/null || true
