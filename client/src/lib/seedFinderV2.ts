// Balatropedia adapter for the Rust+WASM Seed Engine (beta V2).
//
// Same public interface as ./seedFinder.ts so SeedFinderTab can swap engines
// behind a beta toggle. Fan-outs N web workers; each one loads either the
// SIMD or scalar WASM bundle (auto-detected), and scans a disjoint slice of
// the base-35 seed space.
//
// Honest-disclosure (mirrored in the in-product tooltip):
//   - Standard pack card-level contents modelled in v2.1 (base/enh/edi/seal).
//   - Edition + sticker constraints honoured in v2.1.
//   - Multi-slot shop scan honoured in v2.1 (slot 0..15 + "any reroll").
//   - Soul → specific legendary AND Wraith → specific Rare resolution.
//   - Tag big-blind position honoured in v2.1.
//   - Boss filter honoured in v2.1.
//   - Statistical sanity verified against analytical priors;
//     full bit-for-bit Immolate parity sweep is the next milestone.

import type {
  FinderCallbacks,
  FinderConfig,
  FinderHandle,
  JokerLocation,
  SeedMatch,
  VoucherLocation,
  TagLocation,
  BossLocation,
  StandardCardLocation,
} from "./seedFinder";
import { LEGENDARY_JOKERS } from "./seedItems";
import { parseInspectJson, parseClauseDetail, locationFromParsed } from "./seedInspect";
import { verifySeedAgainstConstraints } from "./seedVerifier";

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
  | { kind: "ante_shop_has_joker"; ante: number; slot: number; joker: string;
      edition?: string; sticker?: string }
  | { kind: "ante_tag_is"; ante: number; position: number; tag: string }
  | { kind: "ante_boss_is"; ante: number; boss: string }
  | { kind: "voucher_is"; ante: number; voucher: string }
  | { kind: "ante_pack_contains"; ante: number; pack_index: number; card: string }
  | { kind: "ante_any_pack_contains"; ante: number; max_packs: number; card: string }
  | { kind: "ante_soul_is"; ante: number; max_packs: number; joker: string }
  | { kind: "ante_wraith_is"; ante: number; max_packs: number; joker: string }
  | { kind: "ante_standard_card_is"; ante: number; max_packs: number; base: string;
      enhancement?: string; edition?: string; seal?: string }
  | { kind: "any_of"; clauses: EngineClause[] };

interface EngineFilter {
  clauses: EngineClause[];
  partial: boolean;
  min_score: number | null;
}

export function buildFilterJson(cfg: FinderConfig): string {
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

    // Edition / sticker normalisation — engine expects lowercase keys.
    const editionKey = jc.edition ? jc.edition.toLowerCase() : undefined;
    const stickerKey = jc.sticker ? jc.sticker.toLowerCase() : undefined;
    // 255 = engine sentinel for "any of slots 0..15".
    const slot = (jc.slot === undefined || jc.slot < 0) ? 255 : jc.slot;

    for (let ante = 1; ante <= jc.maxAnte; ante++) {
      if (effectiveSource === "shop") {
        subs.push({
          kind: "ante_shop_has_joker",
          ante, slot, joker: jc.joker,
          edition: editionKey, sticker: stickerKey,
        });
      } else if (effectiveSource === "buffoon-pack") {
        subs.push({ kind: "ante_any_pack_contains", ante, max_packs: PACK_SLOTS, card: jc.joker });
      } else if (effectiveSource === "arcana-soul" || effectiveSource === "spectral-soul" || effectiveSource === "legendary-soul") {
        if (wantsLegendary) {
          // Resolve "which legendary" — v2.1 feature.
          subs.push({ kind: "ante_soul_is", ante, max_packs: PACK_SLOTS, joker: jc.joker });
        } else {
          subs.push({ kind: "ante_any_pack_contains", ante, max_packs: PACK_SLOTS, card: "The Soul" });
        }
      } else if (effectiveSource === "spectral-wraith") {
        // Resolve which Rare joker Wraith forces.
        subs.push({ kind: "ante_wraith_is", ante, max_packs: PACK_SLOTS, joker: jc.joker });
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
    const position = (tc as any).position ?? 0;
    for (let ante = 1; ante <= tc.maxAnte; ante++) {
      subs.push({ kind: "ante_tag_is", ante, position, tag: tc.tag });
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  for (const bc of cfg.bossConstraints ?? []) {
    const subs: EngineClause[] = [];
    for (let ante = 1; ante <= bc.maxAnte; ante++) {
      subs.push({ kind: "ante_boss_is", ante, boss: bc.boss });
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  for (const sc of cfg.standardCardConstraints ?? []) {
    const subs: EngineClause[] = [];
    const edi = sc.edition ? sc.edition.toLowerCase() : undefined;
    // Engine accepts lowercase short seal keys (red/blue/gold/purple).
    const seal = sc.seal ? sc.seal.toLowerCase() : undefined;
    // Combine suit+rank into the canonical "Ace of Spades" / "10 of Hearts"
    // form the engine indexes on. If `base` is explicitly set, prefer it.
    let base = sc.base ?? "";
    if (!base && sc.suit && sc.rank) {
      base = `${sc.rank} of ${sc.suit}`;
    }
    for (let ante = 1; ante <= sc.maxAnte; ante++) {
      subs.push({
        kind: "ante_standard_card_is",
        ante,
        max_packs: PACK_SLOTS,
        base,
        enhancement: sc.enhancement || undefined,
        edition: edi,
        seal,
      });
    }
    if (subs.length === 1) clauses.push(subs[0]);
    else if (subs.length > 1) clauses.push({ kind: "any_of", clauses: subs });
  }

  return JSON.stringify({ clauses, partial: false, min_score: null });
}

// ─── Match assembly ─────────────────────────────────────────────────────────
//
// The engine's `inspect_seed` returns per-clause detail strings. The clause
// order in that response is identical to the order we built in buildFilterJson:
//   1) one clause per jokerConstraint   (possibly wrapped in any_of)
//   2) one clause per voucherConstraint
//   3) one clause per tagConstraint
//   4) one clause per bossConstraint
//   5) one clause per standardCardConstraint
//
// For each matched joker clause we parse the detail into a real JokerLocation
// (ante, shop slot or pack #, edition, stickers). When inspect_seed fails or a
// clause didn't match (shouldn't happen for top-level AND filter, but is
// possible inside `any_of` sub-clauses — only one sub matched), we fall back
// to a constraint-aware placeholder so the UI never shows the broken
// "AFTER BOSS BLIND, SHOP SLOT 0" output.

function fallbackLocation(jc: FinderConfig["jokerConstraints"][number]): JokerLocation {
  const wantsLegendary = isLegendary(jc.joker);
  const srcRaw = (jc as any).source as string | undefined;
  const effectiveSource = wantsLegendary
    ? "spectral-soul"
    : (srcRaw && srcRaw !== "" ? srcRaw : "shop");
  const carriedSlot = (jc.slot !== undefined && jc.slot >= 0 && jc.slot <= 15) ? (jc.slot + 1) : 0;
  return {
    joker: jc.joker,
    edition: jc.edition ?? "",
    source: effectiveSource,
    ante: jc.maxAnte ?? 1,
    slot: carriedSlot,
    packName: effectiveSource === "buffoon-pack" ? "Buffoon Pack"
      : effectiveSource === "arcana-soul" ? "Arcana Pack"
      : effectiveSource === "spectral-soul" || effectiveSource === "spectral-wraith" ? "Spectral Pack"
      : "",
    packPosition: 0,
    eternal: jc.sticker === "eternal",
    perishable: jc.sticker === "perishable",
    rental: jc.sticker === "rental",
  };
}

function parseAnteFromDetail(detail: string): number | null {
  const m = detail.match(/ante\s+(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function buildMatch(seed: string, inspectJson: string | null, cfg: FinderConfig): SeedMatch {
  const jokerLocations: JokerLocation[] = [];
  const voucherLocations: VoucherLocation[] = [];
  const tagLocations: TagLocation[] = [];

  const inspect = inspectJson ? parseInspectJson(inspectJson) : null;
  const clauses = inspect?.clauses ?? [];

  // Clauses come back in filter-build order. Walk them and the source arrays
  // in lockstep so we always know which constraint each clause belongs to.
  let clauseIdx = 0;

  // 1) Joker constraints.
  for (const jc of cfg.jokerConstraints) {
    const c = clauses[clauseIdx++];
    let loc: JokerLocation | null = null;
    if (c && c.matched) {
      const parsed = parseClauseDetail(c.detail);
      if (parsed) loc = locationFromParsed(parsed, jc);
    }
    jokerLocations.push(loc ?? fallbackLocation(jc));
  }

  // 2) Voucher constraints.
  for (const vc of cfg.voucherConstraints ?? []) {
    const c = clauses[clauseIdx++];
    let ante = vc.maxAnte ?? 1;
    if (c && c.matched) {
      const parsed = parseClauseDetail(c.detail);
      if (parsed && parsed.kind === "voucher") {
        ante = parsed.ante;
      } else {
        const a = parseAnteFromDetail(c.detail);
        if (a !== null) ante = a;
      }
    }
    voucherLocations.push({ voucher: vc.voucher, ante });
  }

  // 3) Tag constraints.
  for (const tc of cfg.tagConstraints ?? []) {
    const c = clauses[clauseIdx++];
    let ante = tc.maxAnte ?? 1;
    let blind = ((tc as any).position ?? 0) as number;
    if (c && c.matched) {
      const parsed = parseClauseDetail(c.detail);
      if (parsed && parsed.kind === "tag") {
        ante = parsed.ante;
        blind = parsed.blind;
      } else {
        const a = parseAnteFromDetail(c.detail);
        if (a !== null) ante = a;
      }
    }
    tagLocations.push({ tag: tc.tag, ante, blind });
  }

  // 4) Boss constraints.
  const bossLocations: BossLocation[] = [];
  for (const bc of cfg.bossConstraints ?? []) {
    const c = clauses[clauseIdx++];
    let ante = bc.maxAnte ?? 1;
    let boss = bc.boss;
    if (c && c.matched) {
      const parsed = parseClauseDetail(c.detail);
      if (parsed && parsed.kind === "boss") {
        ante = parsed.ante;
        boss = parsed.boss;
      } else {
        const a = parseAnteFromDetail(c.detail);
        if (a !== null) ante = a;
      }
    }
    bossLocations.push({ boss, ante });
  }

  // 5) Standard card constraints.
  const standardCardLocations: StandardCardLocation[] = [];
  for (const sc of cfg.standardCardConstraints ?? []) {
    const c = clauses[clauseIdx++];
    let ante = sc.maxAnte ?? 1;
    let packIndex = 0;
    let packName = "";
    let cardIndex = 0;
    let base = sc.base ?? (sc.suit && sc.rank ? `${sc.rank} of ${sc.suit}` : "");
    if (c && c.matched) {
      const parsed = parseClauseDetail(c.detail);
      if (parsed && parsed.kind === "standard") {
        ante = parsed.ante;
        // Engine emits 0-based pack# and card index; normalize to 1-based for UI
        // consistency with other SeedMatch locations (shop slot, pack#).
        packIndex = parsed.packIndex + 1;
        packName = parsed.packName;
        cardIndex = parsed.cardIndex + 1;
        base = parsed.base;
      } else {
        const a = parseAnteFromDetail(c.detail);
        if (a !== null) ante = a;
      }
    }
    standardCardLocations.push({
      base,
      enhancement: sc.enhancement,
      edition: sc.edition,
      seal: sc.seal,
      ante,
      packIndex,
      packName,
      cardIndex,
    });
  }

  return {
    seed,
    jokerLocations,
    voucherLocations,
    tagLocations,
    bossLocations,
    standardCardLocations,
  };
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
    const requested = cfg.threads ?? Math.max(1, Math.min(32, cores));
    const filterJson = buildFilterJson(cfg);

    // ─── Decide execution mode ───────────────────────────────────────────────
    //
    // THREADED: page is cross-origin isolated, SharedArrayBuffer exists.
    // We spawn ONE worker that owns a rayon pool of `cores` threads.
    //
    // FALLBACK: we spawn N legacy workers, each with its own WASM heap.
    const canThread =
      typeof (self as any).crossOriginIsolated !== "undefined"
      && (self as any).crossOriginIsolated === true
      && typeof SharedArrayBuffer !== "undefined";
    const threads = canThread ? 1 : requested;

    const origin = self.location.origin;
    const scalarJs = new URL("/engine-v2/balatro_seed_engine.js", origin).toString();
    const scalarWasm = new URL("/engine-v2/balatro_seed_engine_bg.wasm", origin).toString();
    const simdJs = new URL("/engine-v2-simd/balatro_seed_engine.js", origin).toString();
    const simdWasm = new URL("/engine-v2-simd/balatro_seed_engine_bg.wasm", origin).toString();
    const threadsJs = new URL("/engine-v2-threads/balatro_seed_engine.js", origin).toString();
    const threadsWasm = new URL("/engine-v2-threads/balatro_seed_engine_bg.wasm", origin).toString();

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
    // string ("threaded" / "SIMD" / "scalar" / "mixed") via
    // onProgress.engine. Threaded mode always reports "threaded"
    // regardless of SIMD because rayon-on-WASM is the dominant signal.
    let threadedWorkers = 0;
    let simdWorkers = 0;
    let scalarWorkers = 0;
    const engineLabel = () => {
      if (threadedWorkers > 0) return "threaded";
      if (simdWorkers === 0 && scalarWorkers === 0) return "loading";
      if (scalarWorkers === 0) return "SIMD";
      if (simdWorkers === 0) return "scalar";
      return "mixed";
    };

    const emitProgress = () => {
      const total = perWorkerScanned.reduce((a, b) => a + b, 0);
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Math.round((total * 1000) / elapsedMs) : 0;
      const label = engineLabel();
      cb.onProgress?.({
        totalTries: total,
        elapsedMs,
        seedsPerSec,
        matches: matchesCount,
        engine: label,
        // `phase` tells the UI whether the engine is still warming up so it can
        // render "loading WASM…" / "warming up…" instead of a misleading 0/s.
        phase: label === "loading" ? "loading"
             : total === 0 ? "warming"
             : "running",
      } as any);
    };

    // Fire one progress event synchronously at start so the UI shows
    // elapsed/checked/rate fields immediately (the user-visible click →
    // first-update lag was previously ~250 ms of nothing followed by
    // another ~2 s of zeros while WASM loaded).
    emitProgress();
    // Tight 100 ms cadence during warmup so the elapsed counter ticks
    // visibly even before the first worker reports any scanned seeds.
    const progressTimer: number | null = window.setInterval(emitProgress, 100);

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
      const worker = canThread
        ? new Worker(
            new URL("./seedFinderV2WorkerThreaded.ts", import.meta.url),
            { type: "module" },
          )
        : new Worker(
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
          for (const m of msg.matches as Array<{ score: number; seed: string; inspect: string | null }>) {
            // Second-pass verification is disabled by default while we
            // diagnose. Re-enable by setting localStorage.seedVerifier = "1".
            if (typeof localStorage !== "undefined" && localStorage.getItem("seedVerifier") === "1") {
              const verdict = verifySeedAgainstConstraints(m.seed, cfg);
              if (!verdict.ok) {
                continue;
              }
            }
            const match = buildMatch(m.seed, m.inspect, cfg);
            allMatches.push(match);
            matchesCount++;
            cb.onMatch?.(match);
          }
        } else if (msg.type === "progress") {
          // Worker reports cumulative `scanned` for itself.
          perWorkerScanned[workerIdx] = Number(msg.scanned);
        } else if (msg.type === "ready") {
          if (msg.threaded) threadedWorkers++;
          else if (msg.simd) simdWorkers++;
          else scalarWorkers++;
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

      if (canThread) {
        worker.postMessage({
          type: "scan",
          threadsJs,
          threadsWasm,
          filterJson,
          startRank: startRank.toString(),
          count: HUGE_COUNT.toString(),
          seedLen: SEED_LEN,
          deck: cfg.deck,
          stake: cfg.stake,
          partial: false,
          minScore: 0,
        });
      } else {
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
    }

    return { stop, promise };
  }
}
