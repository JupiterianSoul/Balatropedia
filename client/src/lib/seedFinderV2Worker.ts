// Balatropedia worker — new Rust+WASM Seed Engine (beta).
// Lives parallel to seedFinderWorker.ts (Immolate). Toggle in SeedFinderTab.

/// <reference lib="webworker" />

// We don't import types directly — the engine ships its own .d.ts in
// /engine-v2 but Vite serves it as a static asset. We load via dynamic import
// from a Worker-relative URL (set up by SeedFinderV2.dispatch below).

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

let enginePromise: Promise<EngineModule> | null = null;

async function getEngine(jsUrl: string, wasmUrl: string): Promise<EngineModule> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const mod = await import(/* @vite-ignore */ jsUrl) as {
        default: (opts?: { module_or_path?: string }) => Promise<unknown>;
        init: () => void;
        scan_chunk: EngineModule["scan_chunk"];
      };
      await mod.default({ module_or_path: wasmUrl });
      mod.init();
      return { init: mod.init, scan_chunk: mod.scan_chunk };
    })();
  }
  return enginePromise;
}

// Record: 8 bytes rank LE + 1 byte score + 8 bytes seed (right-padded space)
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

// Map Balatropedia deck name → engine deck index (matches wasm_api::deck_from_idx).
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
  jsUrl: string;
  wasmUrl: string;
  filterJson: string;
  startRank: string; // bigint as decimal string
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

async function handleScan(msg: ScanMsg): Promise<void> {
  stopRequested = false;
  const engine = await getEngine(msg.jsUrl, msg.wasmUrl);

  const deckIdx = DECK_IDX[msg.deck] ?? 0;
  const stakeIdx = STAKE_IDX[msg.stake] ?? 0;
  const seedLen = msg.seedLen;

  let cursor = BigInt(msg.startRank);
  let remaining = BigInt(msg.count);
  let batch = 50_000n;
  const startedAt = performance.now();
  let totalScanned = 0n;
  let lastProgress = startedAt;

  while (remaining > 0n && !stopRequested) {
    const thisBatch = remaining < batch ? remaining : batch;
    const t0 = performance.now();
    const raw = engine.scan_chunk(
      msg.filterJson, cursor, thisBatch, seedLen,
      deckIdx, stakeIdx, msg.partial, msg.minScore,
    );
    const dt = performance.now() - t0;

    const matches = decodeRecords(raw);
    if (matches.length > 0) {
      (self as any).postMessage({ type: "matches", matches });
    }

    cursor += thisBatch;
    remaining -= thisBatch;
    totalScanned += thisBatch;

    // adaptive: target 250 ms
    if (dt > 0) {
      const ratio = 250 / dt;
      let next = BigInt(Math.round(Number(batch) * ratio));
      if (next < 2_000n) next = 2_000n;
      if (next > 500_000n) next = 500_000n;
      batch = next;
    }

    const now = performance.now();
    if (now - lastProgress >= 250) {
      (self as any).postMessage({
        type: "progress",
        totalScanned: totalScanned.toString(),
        elapsedMs: now - startedAt,
      });
      lastProgress = now;
    }
  }

  (self as any).postMessage({ type: "done", totalScanned: totalScanned.toString() });
}
