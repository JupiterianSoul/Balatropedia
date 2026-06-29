// Balatropedia worker — Rust+WASM Seed Engine V2 with rayon threads.
//
// Loaded only when the host page is `crossOriginIsolated` AND
// `SharedArrayBuffer` exists. The orchestrator (SeedFinderV2) decides
// once per session and either spawns ONE of these (single WASM heap +
// nested workers via rayon) OR fans out N copies of the legacy
// seedFinderV2Worker.ts (one WASM heap per worker).
//
// Output protocol matches seedFinderV2Worker.ts exactly so the rest of
// SeedFinderV2 doesn't need any branching.

/// <reference lib="webworker" />

// Marker so TypeScript treats this file as a module rather than a global script
// (so its top-level identifiers don't collide with seedFinderV2Worker.ts).
export {};

type ThreadedEngineModule = {
  default: (opts?: { module_or_path?: string }) => Promise<unknown>;
  init: () => void;
  initThreadPool: (n: number) => Promise<unknown>;
  scan_chunk_parallel: (
    filterJson: string,
    startRank: bigint,
    count: bigint,
    seedLen: number,
    deckIdx: number,
    stakeIdx: number,
    partial: boolean,
    minScore: number,
  ) => Uint8Array;
  inspect_seed: (
    filterJson: string,
    seed: string,
    deckIdx: number,
    stakeIdx: number,
  ) => string;
};

let enginePromise: Promise<ThreadedEngineModule> | null = null;

async function getEngine(jsUrl: string, wasmUrl: string): Promise<ThreadedEngineModule> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const mod = (await import(/* @vite-ignore */ jsUrl)) as ThreadedEngineModule;
      await mod.default({ module_or_path: wasmUrl });
      mod.init();
      const threads = Math.max(1, Math.min(navigator.hardwareConcurrency || 4, 16));
      await mod.initThreadPool(threads);
      return mod;
    })();
  }
  return enginePromise;
}

// ─── Record decoding (same wire format as serial worker) ────────────────────

const RECORD_SIZE = 17;
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

// ─── Deck / stake mapping (must match seedFinderV2Worker.ts) ────────────────

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
  threadsJs: string;
  threadsWasm: string;
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

// Rayon parallelises inside one batch so we can use much bigger batches than
// the serial worker. We still cap so progress messages fire ≥2x/sec.
const TARGET_BATCH_MS = 400;
const INITIAL_BATCH = 200_000;
const MIN_BATCH = 50_000;
const MAX_BATCH = 8_000_000;
const PROGRESS_INTERVAL_MS = 250;

async function handleScan(msg: ScanMsg): Promise<void> {
  stopRequested = false;

  let engine: ThreadedEngineModule;
  try {
    engine = await getEngine(msg.threadsJs, msg.threadsWasm);
    (self as any).postMessage({ type: "ready", simd: true, threaded: true });
    (self as any).postMessage({ type: "progress", scanned: 0, elapsedMs: 0 });
  } catch (e: any) {
    (self as any).postMessage({ type: "error", message: `threaded engine init failed: ${e?.message ?? String(e)}` });
    return;
  }

  const deckIdx = DECK_IDX[msg.deck] ?? 0;
  const stakeIdx = STAKE_IDX[msg.stake] ?? 0;
  const seedLen = msg.seedLen;

  let cursor = Number(BigInt(msg.startRank));
  let remaining = Number(BigInt(msg.count));
  let batch = INITIAL_BATCH;
  const startedAt = performance.now();
  let totalScanned = 0;
  let lastProgress = startedAt - PROGRESS_INTERVAL_MS;
  let pendingMatches: Array<{ score: number; seed: string; inspect: string | null }> = [];
  let lastMatchFlush = startedAt;

  while (remaining > 0 && !stopRequested) {
    const thisBatch = remaining < batch ? remaining : batch;
    const t0 = performance.now();

    let raw: Uint8Array;
    try {
      raw = engine.scan_chunk_parallel(
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
      (self as any).postMessage({ type: "error", message: `scan_chunk_parallel failed: ${e?.message ?? String(e)}` });
      return;
    }
    const dt = performance.now() - t0;

    const matches = decodeRecords(raw);
    if (matches.length > 0) {
      // Enrich each match with the structured inspect_seed report so the
      // main thread can render real ante/slot/pack data instead of placeholders.
      const enriched = matches.map((m) => {
        let inspect: string | null = null;
        try { inspect = engine.inspect_seed(msg.filterJson, m.seed, deckIdx, stakeIdx); } catch {}
        return { ...m, inspect };
      });
      pendingMatches.push(...enriched);
    }

    cursor += thisBatch;
    remaining -= thisBatch;
    totalScanned += thisBatch;

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

  if (pendingMatches.length > 0) {
    (self as any).postMessage({ type: "matches", matches: pendingMatches });
    pendingMatches = [];
  }
  (self as any).postMessage({ type: "done", scanned: totalScanned });
}
