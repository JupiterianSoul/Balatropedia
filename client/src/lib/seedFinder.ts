/**
 * Seed Finder — SHARED TYPE DEFINITIONS + DEPRECATED V1 IMPLEMENTATION.
 *
 * This module is the single source of truth for FinderConfig, JokerConstraint,
 * VoucherConstraint, TagConstraint, BossConstraint, StandardCardConstraint,
 * SeedMatch, BossLocation, StandardCardLocation, FinderProgress — all of which
 * are imported across the codebase. DO NOT DELETE.
 *
 * The `SeedFinder` class at the bottom of this file is the V1 engine and is
 * kept ONLY as an emergency fallback reachable via `?legacy=1` URL param or
 * `localStorage["seed-finder-engine"]="legacy"`. Default users never see it.
 * New work should target `seedFinderV2.ts` (powered by upstream WASM with
 * inspect_seed for precise locations).
 */

export interface JokerConstraint {
  joker: string;
  edition?: "" | "Negative" | "Polychrome" | "Holographic" | "Foil";
  // Optional sticker constraint (gold/orange/black-stake territory).
  sticker?: "" | "eternal" | "perishable" | "rental";
  // Engine slot constraint. 0..15 picks a specific shop slot; "any" (255)
  // matches any of the first 16 slots, equivalent to "any reroll up to 12".
  slot?: number;
  source?: "" | "shop" | "buffoon-pack" | "arcana-soul" | "spectral-soul" | "spectral-wraith";
  maxAnte: number;
}

export interface VoucherConstraint {
  voucher: string;
  maxAnte: number;
}

export interface TagConstraint {
  tag: string;
  // 0 = small-blind tag (default), 1 = big-blind tag.
  position?: 0 | 1;
  maxAnte: number;
}

export interface BossConstraint {
  boss: string;
  maxAnte: number;
}

export interface StandardCardConstraint {
  // Either `base` ("Ace of Spades") or `suit`/`rank` separately. The UI uses
  // suit+rank, the adapter combines into base before sending to the engine.
  base?: string;           // e.g. "Ace of Spades" — empty = any base
  suit?: "" | "Spades" | "Hearts" | "Clubs" | "Diamonds";
  rank?: "" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "Jack" | "Queen" | "King" | "Ace";
  enhancement?: string;    // e.g. "Glass" (engine canonical key, NOT "Glass Card")
  edition?: "" | "Foil" | "Holographic" | "Polychrome";
  seal?: "" | "Red" | "Blue" | "Gold" | "Purple";
  maxAnte: number;
}

export interface FinderConfig {
  jokerConstraints: JokerConstraint[];
  voucherConstraints?: VoucherConstraint[];
  tagConstraints?: TagConstraint[];
  bossConstraints?: BossConstraint[];
  standardCardConstraints?: StandardCardConstraint[];
  maxAnte: number;
  deck: string;
  stake: string;
  version: string;
  threads?: number;
  triesPerBatch?: number;
  maxTotalTries?: number;
}

export interface JokerLocation {
  joker: string;
  edition: string;
  source: string;
  ante: number;
  slot: number;
  packName: string;
  packPosition: number;
  eternal: boolean;
  perishable: boolean;
  rental: boolean;
}

export interface VoucherLocation {
  voucher: string;
  ante: number;
}

export interface TagLocation {
  tag: string;
  ante: number;
  // 0 = Small-blind tag, 1 = Big-blind tag. Stored as number to match engine
  // convention (next_tag returns the small/big position). Display layer maps
  // to "Small"/"Big".
  blind: number;
}

export interface BossLocation {
  boss: string;
  ante: number;
}

export interface StandardCardLocation {
  // What the user filtered for, plus where it actually fell.
  base: string;          // e.g. "Ace of Spades" (engine-resolved)
  enhancement?: string;
  edition?: string;
  seal?: string;
  ante: number;
  // Pack index 0..5 (Small/Big/Boss x 2). Display layer maps to blind + position.
  packIndex: number;
  packName: string;
  // Card index within the pack (1-based for display; engine emits 1-based).
  cardIndex: number;
}

export interface SeedMatch {
  seed: string;
  jokerLocations: JokerLocation[];
  voucherLocations: VoucherLocation[];
  tagLocations: TagLocation[];
  // Both default to [] for back-compat with persisted saved seeds (v2 schema).
  bossLocations?: BossLocation[];
  standardCardLocations?: StandardCardLocation[];
}

export interface FinderProgress {
  totalTries: number;
  elapsedMs: number;
  seedsPerSec: number;
  matches: number;
}

export interface FinderCallbacks {
  onProgress?: (p: FinderProgress) => void;
  onMatch?: (m: SeedMatch) => void;
  onDone?: (reason: "stopped" | "max-tries") => void;
  onError?: (msg: string) => void;
}

export interface FinderHandle {
  stop: () => void;
  promise: Promise<SeedMatch[]>;
}

const VERSION_MAP: Record<string, number> = {
  "1.0.0":  10100,
  "1.0.1c": 10103,
  "1.0.1f": 10106,
};

function versionToInt(v: string): number {
  return VERSION_MAP[v] ?? 10106;
}

/**
 * @deprecated V1 finder. Use `SeedFinderV2` from `./seedFinderV2.ts` instead.
 * This class is preserved as an emergency fallback toggle (?legacy=1).
 */
export class SeedFinder {
  private workers: Worker[] = [];
  private active = false;

  async init() {  }

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("SeedFinder already running");
    this.active = true;

    const THREADS_CAP = 32;
    // Adaptive batch sizing: small batches keep low-end devices responsive
    // (UI doesn't freeze), large batches reduce postMessage overhead on fast
    // hardware. We start small and grow per-worker after the first batch
    // completes — see autoTuneBatch below.
    const cores = navigator.hardwareConcurrency || 4;
    const lowEnd = cores <= 4;
    const INITIAL_TRIES_PER_BATCH = lowEnd ? 10_000 : 50_000;
    const MAX_TRIES_PER_BATCH = lowEnd ? 25_000 : 200_000;
    // Per-worker current batch size (auto-tuned)
    const batchSizes: number[] = [];
    const batchStart: number[] = [];
    const threads = cfg.threads ?? Math.max(1, Math.min(THREADS_CAP, cores));
    const triesPerBatch = cfg.triesPerBatch ?? INITIAL_TRIES_PER_BATCH;
    const maxTotalTries = cfg.maxTotalTries ?? 0;
    const versionInt = versionToInt(cfg.version);

    let totalTries = 0;
    let matches = 0;
    const allMatches: SeedMatch[] = [];
    const startedAt = performance.now();
    let progressTimer: number | null = null;
    let stopped = false;
    let resolveOuter: (m: SeedMatch[]) => void = () => {};
    let rejectOuter: (e: Error) => void = () => {};
    const promise = new Promise<SeedMatch[]>((res, rej) => {
      resolveOuter = res;
      rejectOuter = rej;
    });

    const cleanup = () => {
      if (progressTimer != null) { clearInterval(progressTimer); progressTimer = null; }
      this.workers.forEach(w => w.terminate());
      this.workers = [];
      this.active = false;
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      cleanup();
      cb.onDone?.("stopped");
      resolveOuter(allMatches);
    };

    progressTimer = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Math.round((totalTries * 1000) / elapsedMs) : 0;
      cb.onProgress?.({ totalTries, elapsedMs, seedsPerSec, matches });
    }, 250) as unknown as number;

    for (let i = 0; i < threads; i++) {
      const worker = new Worker(
        new URL("./seedFinderWorker.ts", import.meta.url)
      );
      this.workers.push(worker);

      // Per-worker adaptive batch size, starts at the global initial size
      if (batchSizes[i] === undefined) batchSizes[i] = triesPerBatch;
      const dispatchBatch = () => {
        if (stopped) return;
        if (maxTotalTries > 0 && totalTries >= maxTotalTries) {
          if (!stopped) {
            stopped = true;
            cleanup();
            cb.onDone?.("max-tries");
            resolveOuter(allMatches);
          }
          return;
        }
        const rngSeed = (Math.floor(Math.random() * 0xffffffff) ^ (i * 2654435761)) >>> 0;
        batchStart[i] = performance.now();
        worker.postMessage({
          type: "search",
          rngSeed,
          triesBatch: batchSizes[i],
          maxAnte: cfg.maxAnte,
          deck: cfg.deck,
          stake: cfg.stake,
          versionInt,
          jokerConstraints: cfg.jokerConstraints,
          voucherConstraints: cfg.voucherConstraints ?? [],
          tagConstraints: cfg.tagConstraints ?? [],
        });
      };

      // Auto-tune: target ~250ms per batch so UI stays responsive on low-end
      // devices, but throughput stays high on fast ones (fewer postMessage round-trips).
      const autoTuneBatch = () => {
        const ms = performance.now() - (batchStart[i] || 0);
        if (!ms || ms <= 0) return;
        const target = lowEnd ? 250 : 400;
        if (ms < target * 0.6) {
          batchSizes[i] = Math.min(MAX_TRIES_PER_BATCH, Math.floor(batchSizes[i] * 1.5));
        } else if (ms > target * 1.6) {
          batchSizes[i] = Math.max(2_000, Math.floor(batchSizes[i] * 0.7));
        }
      };

      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === "ready") {
          dispatchBatch();
          return;
        }
        if (msg.type === "error") {
          cb.onError?.(msg.message || "Worker error");
          stop();
          return;
        }
        if (msg.type === "result") {
          autoTuneBatch();
          totalTries += msg.tries;
          if (msg.seed) {
            const match: SeedMatch = {
              seed: msg.seed,
              jokerLocations: msg.jokerLocations,
              voucherLocations: msg.voucherLocations,
              tagLocations: msg.tagLocations,
            };
            allMatches.push(match);
            matches++;
            cb.onMatch?.(match);
          }
          dispatchBatch();
        }
      };

      worker.onerror = (err) => {
        cb.onError?.(err.message || "Worker error");
      };

      worker.postMessage({ type: "init" });
    }

    return { stop, promise };
  }
}
