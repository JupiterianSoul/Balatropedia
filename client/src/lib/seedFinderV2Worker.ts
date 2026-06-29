// Balatropedia worker — Rust+WASM Seed Engine V2 (beta).
//
// Sits parallel to seedFinderWorker.ts (Immolate); selection happens via the
// beta toggle in SeedFinderTab.
//
// Performance notes:
//   - First message carries BOTH scalar and SIMD bundle URLs. The worker runs
//     a 30-byte WebAssembly.validate() probe; if SIMD is supported, it loads
//     the SIMD bundle, otherwise scalar.
//   - Batch sizing is adaptive (target ~250 ms / scan_chunk). Initial batch is
//     200k and the cap is 2M so fast PCs reach steady-state quickly.
//   - postMessage frequency is bounded: at most one progress message every
//     250 ms; matches batched up to the same window.
//   - Hot loop avoids BigInt arithmetic: cursor/remaining are tracked as
//     regular Numbers (35^8 ≈ 2.25e12, fits easily in IEEE 754 integer range),
//     converted to BigInt only at the WASM boundary.

/// <reference lib="webworker" />

type EngineModule = {
  init: () => void;
  scan_chunk: (
    filterJson: string,
    startRank: bigint,
    count: bigint,
    seedLen: number,
    deckIdx: number,
    stakeIdx: number,
    partial: boolean,
    minScore: number,
  ) => Uint8Array;
};

// ─── SIMD detection ──────────────────────────────────────────────────────────
// Tiny WebAssembly module that uses a v128 op. WebAssembly.validate returns
// true iff the engine supports SIMD. Safari shipped this in 16.4 (Mar 2023);
// all evergreen browsers support it.
const SIMD_TEST_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d,
  0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
  0x03, 0x02, 0x01, 0x00,
  0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0xfd, 0x62, 0x0b,
]);
function detectSimd(): boolean {
  try { return WebAssembly.validate(SIMD_TEST_BYTES); }
  catch { return false; }
}

let enginePromise: Promise<{ engine: EngineModule; simd: boolean }> | null = null;

async function getEngine(scalarJs: string, scalarWasm: string, simdJs: string, simdWasm: string) {
  if (!enginePromise) {
    enginePromise = (async () => {
      const simd = detectSimd();
      const jsUrl = simd ? simdJs : scalarJs;
      const wasmUrl = simd ? simdWasm : scalarWasm;
      const mod = await import(/* @vite-ignore */ jsUrl) as {
        default: (opts?: { module_or_path?: string }) => Promise<unknown>;
        init: () => void;
        scan_chunk: EngineModule["scan_chunk"];
      };
      await mod.default({ module_or_path: wasmUrl });
      mod.init();
      return { engine: { init: mod.init, scan_chunk: mod.scan_chunk }, simd };
    })();
  }
  return enginePromise;
}

// ─── Record decoding ────────────────────────────────────────────────────────
const RECORD_SIZE = 17; // 8 (rank LE) + 1 (score) + 8 (seed, right-padded space)
const decoder = new TextDecoder("utf-8");

function decodeRecords(buf: Uint8Array): Array<{ score: number; seed: string }> {
  const out: Array<{ score: number; seed: string }> = [];
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let off = 0; off + RECORD_SIZE <= buf.byteLength; off += RECORD_SIZE) {
    const score = dv.getUint8(off + 8);
    const seedBytes = buf.slice(off + 9, off + 17);
    const seed = decoder.decode(seedBytes).trimEnd();
    out.push({ score, seed });
  }
  return out;
}

// ─── Deck / stake mapping (matches engine wasm_api::deck_from_idx) ──────────
const DECK_IDX: Record<string, number> = {
  "Red Deck": 0, "Blue Deck": 1, "Yellow Deck": 2, "Green Deck": 3,
  "Black Deck": 4, "Magic Deck": 5, "Nebula Deck": 6, "Ghost Deck": 7,
  "Abandoned Deck": 8, "Checkered Deck": 9, "Zodiac Deck": 10,
  "Painted Deck": 11, "Anaglyph Deck": 12, "Plasma Deck": 13, "Erratic Deck": 14,
};
const STAKE_IDX: Record<string, number> = {
  "White Stake": 0, "Red Stake": 1, "Green Stake": 2, "Black Stake": 3,
  "Blue Stake": 4, "Purple Stake": 5, "Orange Stake": 6, "Gold Stake": 7,
};

type ScanMsg = {
  type: "scan";
  scalarJs: string;
  scalarWasm: string;
  simdJs: string;
  simdWasm: string;
  filterJson: string;
  startRank: string;
  count: string;
  seedLen: number;
  deck: string;
  stake: string;
  partial: boolean;
  minScore: number;
};

let stopRequested = false;

self.addEventListener("message", (ev: MessageEvent) => {
  const msg = ev.data;
  if (msg.type === "stop") { stopRequested = true; return; }
  if (msg.type === "scan") { void handleScan(msg as ScanMsg); }
});

// Adaptive batch tuning constants.
const TARGET_BATCH_MS = 250;
// Initial batch is intentionally tiny so the very first `progress` message
// fires within ~100 ms of the worker starting its scan loop. The adaptive
// sizer ramps up to MAX_BATCH within 2-3 iterations once steady-state
// throughput is known. Trades a few hundred microseconds of overhead for
// a much snappier UI "checked" / "rate" first-update latency.
const INITIAL_BATCH = 5_000;
const MIN_BATCH = 5_000;
const MAX_BATCH = 2_000_000;
const PROGRESS_INTERVAL_MS = 250;

async function handleScan(msg: ScanMsg): Promise<void> {
  stopRequested = false;

  let engineInfo: { engine: EngineModule; simd: boolean };
  try {
    engineInfo = await getEngine(msg.scalarJs, msg.scalarWasm, msg.simdJs, msg.simdWasm);
    // Tell main thread which engine is active (once per worker, on first scan).
    (self as any).postMessage({ type: "ready", simd: engineInfo.simd });
    // Immediate "alive" ping with scanned=0. The orchestrator's progress
    // emitter already runs at 100 ms cadence so the elapsed timer ticks
    // even before this fires, but this confirms the worker reached the
    // scan loop (vs still loading WASM).
    (self as any).postMessage({ type: "progress", scanned: 0, elapsedMs: 0 });
  } catch (e: any) {
    (self as any).postMessage({ type: "error", message: e?.message ?? String(e) });
    return;
  }

  const { engine } = engineInfo;
  const deckIdx = DECK_IDX[msg.deck] ?? 0;
  const stakeIdx = STAKE_IDX[msg.stake] ?? 0;
  const seedLen = msg.seedLen;

  // Use Number for the hot loop. Rank space is 35^8 ≈ 2.25e12, far below
  // Number.MAX_SAFE_INTEGER (2^53 ≈ 9e15).
  let cursor = Number(BigInt(msg.startRank));
  let remaining = Number(BigInt(msg.count));
  let batch = INITIAL_BATCH;
  const startedAt = performance.now();
  let totalScanned = 0;
  // Subtract PROGRESS_INTERVAL_MS so the FIRST iteration's progress message
  // fires immediately after the first scan_chunk completes (which with the
  // tiny INITIAL_BATCH is in the low milliseconds). Without this the worker
  // would skip emitting progress for the first ~250 ms even with a fast
  // first batch.
  let lastProgress = startedAt - PROGRESS_INTERVAL_MS;
  let pendingMatches: Array<{ score: number; seed: string }> = [];
  let lastMatchFlush = startedAt;

  while (remaining > 0 && !stopRequested) {
    const thisBatch = remaining < batch ? remaining : batch;
    const t0 = performance.now();

    let raw: Uint8Array;
    try {
      raw = engine.scan_chunk(
        msg.filterJson,
        BigInt(cursor),
        BigInt(thisBatch),
        seedLen,
        deckIdx,
        stakeIdx,
        msg.partial,
        msg.minScore,
      );
    } catch (e: any) {
      (self as any).postMessage({ type: "error", message: e?.message ?? String(e) });
      return;
    }
    const dt = performance.now() - t0;

    const matches = decodeRecords(raw);
    if (matches.length > 0) {
      pendingMatches.push(...matches);
    }

    cursor += thisBatch;
    remaining -= thisBatch;
    totalScanned += thisBatch;

    // Adaptive batch sizing (target TARGET_BATCH_MS per scan_chunk).
    if (dt > 0) {
      const ratio = TARGET_BATCH_MS / dt;
      let next = Math.round(batch * ratio);
      if (next < MIN_BATCH) next = MIN_BATCH;
      if (next > MAX_BATCH) next = MAX_BATCH;
      batch = next;
    }

    const now = performance.now();
    if (pendingMatches.length > 0 && (now - lastMatchFlush >= PROGRESS_INTERVAL_MS || pendingMatches.length >= 32)) {
      (self as any).postMessage({ type: "matches", matches: pendingMatches });
      pendingMatches = [];
      lastMatchFlush = now;
    }
    if (now - lastProgress >= PROGRESS_INTERVAL_MS) {
      (self as any).postMessage({
        type: "progress",
        scanned: totalScanned,
        elapsedMs: now - startedAt,
      });
      lastProgress = now;
    }
  }

  // Final flush.
  if (pendingMatches.length > 0) {
    (self as any).postMessage({ type: "matches", matches: pendingMatches });
    pendingMatches = [];
  }
  (self as any).postMessage({ type: "done", scanned: totalScanned });
}
