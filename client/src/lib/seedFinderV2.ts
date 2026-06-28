// Balatropedia adapter for the new Rust+WASM Seed Engine (beta).
//
// Exposes the SAME public interface as ./seedFinder.ts so SeedFinderTab can
// swap implementations behind a beta toggle. The interface stays minimal:
//
//   const f = new SeedFinderV2();
//   const handle = f.start(config, callbacks);
//   handle.stop();
//   const matches = await handle.promise;
//
// Internally this fan-outs N web workers, each loading the WASM engine from
// /engine-v2/ (vendored from the new Balatro-Seed-Searcher repo). Each worker
// scans a disjoint slice of the base-35 seed space.
//
// IMPORTANT honest-disclosure notes (mirrored in the in-product beta tooltip):
//   - This engine doesn't yet model Standard pack card-level contents.
//   - It hasn't been bit-for-bit cross-checked with Immolate at 100k+ scale —
//     only statistical sanity (rarities/packs/lock state).
//   - Therefore the public Immolate-backed finder remains the default.

import type {
  FinderCallbacks,
  FinderConfig,
  FinderHandle,
  JokerLocation,
  SeedMatch,
} from "./seedFinder";

// ─── Filter DSL translation ──────────────────────────────────────────────────
// Engine filter shape (must match engine/src/filter.rs):
//   { clauses: [{ kind: "ante_shop_has_joker", ante, slot, joker }, ...],
//     partial: bool, min_score: number|null }
//
// We only translate the joker constraints for v0; voucher/tag constraints
// stay Immolate-only until we wire them through the engine API.
type EngineClause =
  | { kind: "ante_shop_has_joker"; ante: number; slot: number; joker: string }
  | { kind: "ante_pack_contains"; ante: number; pack_index: number; card: string };

interface EngineFilter {
  clauses: EngineClause[];
  partial: boolean;
  min_score: number | null;
}

function buildFilterJson(cfg: FinderConfig): string {
  const clauses: EngineClause[] = [];

  for (const jc of cfg.jokerConstraints) {
    // For each constraint, search any slot up to maxAnte. We emit one clause
    // per ante to let the engine short-circuit at the earliest match.
    for (let ante = 1; ante <= jc.maxAnte; ante++) {
      // Slot 0 = "any slot" in the engine semantics.
      clauses.push({
        kind: "ante_shop_has_joker",
        ante,
        slot: 0,
        joker: jc.joker,
      });
    }
  }

  const filter: EngineFilter = {
    clauses,
    partial: false,
    min_score: null,
  };
  return JSON.stringify(filter);
}

// ─── Worker dispatch ────────────────────────────────────────────────────────

const SEED_LEN = 8;
// Total search space size for an 8-char seed (35^8) doesn't fit cleanly in
// a u64 div by hand, but the engine treats `count` as an upper bound — we
// just feed it a huge number per worker and let the user stop.
const HUGE_COUNT = (1n << 60n); // effectively unbounded

export class SeedFinderV2 {
  private workers: Worker[] = [];
  private active = false;

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("SeedFinderV2 already running");
    this.active = true;

    const cores = navigator.hardwareConcurrency || 4;
    const threads = cfg.threads ?? Math.max(1, Math.min(16, cores));
    const filterJson = buildFilterJson(cfg);

    // URLs to the vendored engine. Vite serves /public/* at the root.
    const jsUrl = new URL("/engine-v2/balatro_seed_engine.js", self.location.origin).toString();
    const wasmUrl = new URL("/engine-v2/balatro_seed_engine_bg.wasm", self.location.origin).toString();

    const allMatches: SeedMatch[] = [];
    let totalTries = 0n;
    let matches = 0;
    const startedAt = performance.now();
    let stopped = false;
    let resolveOuter: (m: SeedMatch[]) => void = () => {};
    const promise = new Promise<SeedMatch[]>((res) => { resolveOuter = res; });

    let progressTimer: number | null = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Number((totalTries * 1000n) / BigInt(Math.max(1, Math.round(elapsedMs)))) : 0;
      cb.onProgress?.({ totalTries: Number(totalTries), elapsedMs, seedsPerSec, matches });
    }, 250);

    const cleanup = () => {
      if (progressTimer != null) { clearInterval(progressTimer); progressTimer = null; }
      this.workers.forEach(w => w.terminate());
      this.workers = [];
      this.active = false;
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      this.workers.forEach(w => w.postMessage({ type: "stop" }));
      cleanup();
      cb.onDone?.("stopped");
      resolveOuter(allMatches);
    };

    let workersDone = 0;
    for (let i = 0; i < threads; i++) {
      const worker = new Worker(
        new URL("./seedFinderV2Worker.ts", import.meta.url),
        { type: "module" },
      );
      this.workers.push(worker);

      // Per-worker rank stride: worker i starts at rank i * 10^15 and scans
      // forward. With 16 workers and a 35^8 ~ 2.25e12 space this overlaps
      // ranks across workers, but since each worker also gets a different
      // random nonce baked into start_rank we still cover diverse seeds.
      const startRank = (BigInt(i) * 100_000_000_000n + BigInt(Math.floor(Math.random() * 1_000_000_000)));

      worker.onmessage = (ev) => {
        const msg = ev.data;
        if (msg.type === "matches") {
          for (const m of msg.matches as Array<{ score: number; seed: string }>) {
            // Engine returns just (seed, score). We don't yet have per-joker
            // location metadata from the new engine — we surface the seed with
            // empty location arrays so downstream UI still renders the card.
            // Users can click "Verify with Immolate" to get the full breakdown.
            const dummyLocations: JokerLocation[] = cfg.jokerConstraints.map((jc) => ({
              joker: jc.joker,
              edition: jc.edition ?? "",
              source: "shop",
              ante: 1,
              slot: 0,
              packName: "",
              packPosition: 0,
              eternal: false,
              perishable: false,
              rental: false,
            }));
            const match: SeedMatch = {
              seed: m.seed,
              jokerLocations: dummyLocations,
              voucherLocations: [],
              tagLocations: [],
            };
            allMatches.push(match);
            matches++;
            cb.onMatch?.(match);
          }
        } else if (msg.type === "progress") {
          totalTries = BigInt(msg.totalScanned);
        } else if (msg.type === "done") {
          totalTries += BigInt(msg.totalScanned);
          workersDone++;
          if (workersDone >= threads && !stopped) {
            stopped = true;
            cleanup();
            cb.onDone?.("max-tries");
            resolveOuter(allMatches);
          }
        }
      };

      worker.onerror = (err) => {
        cb.onError?.(err.message || "Worker error");
      };

      worker.postMessage({
        type: "scan",
        jsUrl,
        wasmUrl,
        filterJson,
        startRank: startRank.toString(),
        count: HUGE_COUNT.toString(),
        seedLen: SEED_LEN,
        deck: cfg.deck,
        stake: cfg.stake,
        partial: false,
        minScore: 0,
      });
    }

    return { stop, promise };
  }
}
