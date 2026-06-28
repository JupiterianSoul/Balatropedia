// Balatropedia adapter for the Rust+WASM Seed Engine (beta V2).
//
// Same public interface as ./seedFinder.ts so SeedFinderTab can swap engines
// behind a beta toggle. Fan-outs N web workers; each one loads either the
// SIMD or scalar WASM bundle (auto-detected), and scans a disjoint slice of
// the base-35 seed space.
//
// Honest-disclosure (mirrored in the in-product tooltip):
//   - Standard pack card-level contents not yet modelled.
//   - No bit-for-bit Immolate parity sweep yet (only 100k statistical sanity).
//   - The original Immolate-backed finder remains the verified default.

import type {
  FinderCallbacks,
  FinderConfig,
  FinderHandle,
  JokerLocation,
  SeedMatch,
} from "./seedFinder";
import { LEGENDARY_JOKERS } from "./seedItems";

// Maximum shop pack slots scanned per ante for pack-based clauses. Default
// run config exposes 6 packs/ante; we scan 0..PACK_SLOTS-1.
const PACK_SLOTS = 6;

// Soul + Wraith are the only Balatro pack drops that yield a guaranteed
// legendary or rare joker respectively. We can't yet resolve *which*
// legendary a given Soul becomes inside the engine, so legendary joker
// constraints currently match seeds where *any* Soul fires in 1..maxAnte.
function isLegendary(name: string): boolean {
  return LEGENDARY_JOKERS.includes(name);
}

// ─── Filter DSL translation ─────────────────────────────────────────────────
// Engine filter shape (matches engine/src/filter.rs):
//   { clauses: [{ kind, ... }, ...], partial: bool, min_score: number|null }
type EngineClause =
  | { kind: "ante_shop_has_joker"; ante: number; slot: number; joker: string }
  | { kind: "ante_tag_is"; ante: number; position: number; tag: string }
  | { kind: "voucher_is"; ante: number; voucher: string }
  | { kind: "ante_pack_contains"; ante: number; pack_index: number; card: string }
  | { kind: "ante_any_pack_contains"; ante: number; max_packs: number; card: string }
  | { kind: "any_of"; clauses: EngineClause[] };

interface EngineFilter {
  clauses: EngineClause[];
  partial: boolean;
  min_score: number | null;
}

function buildFilterJson(cfg: FinderConfig): string {
  const clauses: EngineClause[] = [];

  // Each user constraint becomes ONE top-level clause: an `any_of` that
  // matches if the target appears in any ante 1..maxAnte. The previous
  // version emitted one flat clause per (constraint, ante) and ran in
  // strict-AND mode, which silently demanded the joker appear in EVERY
  // ante — hence the zero matches.
  //
  // Source routing:
  //   - shop / empty                 → ante_shop_has_joker (slot 0 only)
  //   - buffoon-pack                 → ante_pack_contains over slots 0..5
  //   - arcana-soul / spectral-soul  → ante_pack_contains for "The Soul"
  //                                    (Soul forces a random Legendary;
  //                                    we surface the seed but don't yet
  //                                    resolve which legendary lands)
  //   - spectral-wraith              → ante_pack_contains for "Wraith"
  //                                    (Wraith forces a random Rare joker)
  //
  // If the target joker itself is a Legendary, we override source: the
  // shop never rolls legendaries, so the only way to match is via Soul
  // in arcana/spectral packs. We emit a Soul gate across both pack
  // families for ante 1..maxAnte.
  for (const jc of cfg.jokerConstraints) {
    const subs: EngineClause[] = [];
    const wantsLegendary = isLegendary(jc.joker);
    const srcRaw = (jc as any).source as string | undefined;
    const effectiveSource = wantsLegendary
      ? "legendary-soul"
      : (srcRaw && srcRaw !== "" ? srcRaw : "shop");

    for (let ante = 1; ante <= jc.maxAnte; ante++) {
      if (effectiveSource === "shop") {
        subs.push({ kind: "ante_shop_has_joker", ante, slot: 0, joker: jc.joker });
      } else if (effectiveSource === "buffoon-pack") {
        subs.push({ kind: "ante_any_pack_contains", ante, max_packs: PACK_SLOTS, card: jc.joker });
      } else if (effectiveSource === "arcana-soul" || effectiveSource === "spectral-soul" || effectiveSource === "legendary-soul") {
        subs.push({ kind: "ante_any_pack_contains", ante, max_packs: PACK_SLOTS, card: "The Soul" });
      } else if (effectiveSource === "spectral-wraith") {
        subs.push({ kind: "ante_any_pack_contains", ante, max_packs: PACK_SLOTS, card: "Wraith" });
      }
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  for (const vc of cfg.voucherConstraints ?? []) {
    const subs: EngineClause[] = [];
    for (let ante = 1; ante <= vc.maxAnte; ante++) {
      subs.push({ kind: "voucher_is", ante, voucher: vc.voucher });
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  for (const tc of cfg.tagConstraints ?? []) {
    const subs: EngineClause[] = [];
    for (let ante = 1; ante <= tc.maxAnte; ante++) {
      subs.push({ kind: "ante_tag_is", ante, position: 0, tag: tc.tag });
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  return JSON.stringify({ clauses, partial: false, min_score: null });
}

// ─── Worker dispatch ────────────────────────────────────────────────────────
const SEED_LEN = 8;
const HUGE_COUNT = (1n << 60n); // effectively unbounded; user stops manually

export class SeedFinderV2 {
  private workers: Worker[] = [];
  private active = false;

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("SeedFinderV2 already running");
    this.active = true;

    const cores = navigator.hardwareConcurrency || 4;
    // Cap at 32 — modern threadrippers / m-series studios can hit this.
    const threads = cfg.threads ?? Math.max(1, Math.min(32, cores));
    const filterJson = buildFilterJson(cfg);

    const origin = self.location.origin;
    const scalarJs = new URL("/engine-v2/balatro_seed_engine.js", origin).toString();
    const scalarWasm = new URL("/engine-v2/balatro_seed_engine_bg.wasm", origin).toString();
    const simdJs = new URL("/engine-v2-simd/balatro_seed_engine.js", origin).toString();
    const simdWasm = new URL("/engine-v2-simd/balatro_seed_engine_bg.wasm", origin).toString();

    const allMatches: SeedMatch[] = [];
    // Per-worker scan counts. We sum these on every progress callback so the
    // headline rate reflects total throughput across all workers (the previous
    // implementation overwrote a single number per progress event, severely
    // under-reporting on multi-worker runs).
    const perWorkerScanned = new Array<number>(threads).fill(0);
    let matchesCount = 0;
    const startedAt = performance.now();
    let stopped = false;
    let resolveOuter: (m: SeedMatch[]) => void = () => {};
    const promise = new Promise<SeedMatch[]>((res) => { resolveOuter = res; });

    // Track which engine each worker reported using. We surface a single
    // string ("SIMD" / "scalar" / "mixed") via the onProgress.engine field.
    let simdWorkers = 0;
    let scalarWorkers = 0;
    const engineLabel = () =>
      simdWorkers === 0 && scalarWorkers === 0 ? "loading"
      : scalarWorkers === 0 ? "SIMD"
      : simdWorkers === 0 ? "scalar"
      : "mixed";

    const progressTimer: number | null = window.setInterval(() => {
      const total = perWorkerScanned.reduce((a, b) => a + b, 0);
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Math.round((total * 1000) / elapsedMs) : 0;
      cb.onProgress?.({
        totalTries: total,
        elapsedMs,
        seedsPerSec,
        matches: matchesCount,
        // Extra hint for the UI; existing typing in seedFinder.ts allows any extra
        // fields because the consumer treats progress as `any` (see SeedFinderTab).
        engine: engineLabel(),
      } as any);
    }, 250);

    const cleanup = () => {
      if (progressTimer != null) clearInterval(progressTimer);
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

      // Disjoint start ranks per worker. We use a 60-bit stride so workers
      // never overlap within a reasonable run, plus a random nonce so two
      // consecutive searches don't repeat the same ranks.
      const workerNonce = Math.floor(Math.random() * 1_000_000_000);
      const startRank = (BigInt(i) * 100_000_000_000n + BigInt(workerNonce));
      const workerIdx = i;

      worker.onmessage = (ev) => {
        const msg = ev.data;
        if (msg.type === "matches") {
          for (const m of msg.matches as Array<{ score: number; seed: string }>) {
            // No per-joker locations yet from the engine. Surface the seed
            // with placeholder locations so the MatchCard UI renders;
            // users can click "Verify with Immolate" to get the breakdown.
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
            matchesCount++;
            cb.onMatch?.(match);
          }
        } else if (msg.type === "progress") {
          // Worker reports cumulative `scanned` for itself.
          perWorkerScanned[workerIdx] = Number(msg.scanned);
        } else if (msg.type === "ready") {
          if (msg.simd) simdWorkers++; else scalarWorkers++;
        } else if (msg.type === "error") {
          cb.onError?.(typeof msg.message === "string" ? msg.message : "Worker error");
        } else if (msg.type === "done") {
          perWorkerScanned[workerIdx] = Number(msg.scanned);
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
        cb.onError?.(err.message || "Worker error (uncaught)");
      };

      worker.postMessage({
        type: "scan",
        scalarJs,
        scalarWasm,
        simdJs,
        simdWasm,
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
