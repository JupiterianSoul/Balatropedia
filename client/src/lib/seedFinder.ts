// seedFinder.ts - Main-thread coordinator for parallel WASM-powered seed search.
//
// Spawns N web workers, each running the Immolate WASM engine. Distributes
// batches of random seeds. Aggregates results, exposes progress + abort.
//
// Usage:
//   const f = new SeedFinder();
//   await f.init();
//   const handle = f.start(constraints, { onProgress, onMatch });
//   handle.stop();  // aborts all workers

export interface JokerConstraint {
  joker: string;
  edition?: "" | "Negative" | "Polychrome" | "Holographic" | "Foil";
  source?: "" | "shop" | "buffoon-pack" | "arcana-soul" | "spectral-soul" | "spectral-wraith";
  maxAnte: number;
}

export interface VoucherConstraint {
  voucher: string;
  maxAnte: number;
}

export interface TagConstraint {
  tag: string;
  maxAnte: number;
}

export interface FinderConfig {
  jokerConstraints: JokerConstraint[];
  voucherConstraints?: VoucherConstraint[];
  tagConstraints?: TagConstraint[];
  maxAnte: number;       // global cap (>= max of all constraint maxAntes)
  deck: string;          // "Red Deck", "Blue Deck", etc.
  stake: string;         // "White Stake", "Red Stake", etc.
  version: string;       // "1.0.1f", "1.0.1c", etc.
  threads?: number;      // default: navigator.hardwareConcurrency
  triesPerBatch?: number;// default: 5000
  maxTotalTries?: number;// hard stop; 0 = unlimited
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
  blind: number;
}

export interface SeedMatch {
  seed: string;
  jokerLocations: JokerLocation[];
  voucherLocations: VoucherLocation[];
  tagLocations: TagLocation[];
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

export class SeedFinder {
  private workers: Worker[] = [];
  private active = false;

  async init() { /* no-op for now; workers self-init */ }

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("SeedFinder already running");
    this.active = true;

    // ---- Perf tunables ----
    // FAILSAFE: revert to PREV_* values if any regression is observed in the field.
    // const PREV_THREADS_CAP = 8;        // original v1.7 cap
    // const PREV_TRIES_PER_BATCH = 5000; // original v1.7 batch
    // const SAFE_TRIES_PER_BATCH = 20000; // v1.7.3 conservative bump
    const THREADS_CAP = 16;        // use full logical-core count up to 16
    const TRIES_PER_BATCH = 50000; // larger batches => fewer postMessage round-trips
    const threads = cfg.threads ?? Math.max(1, Math.min(THREADS_CAP, navigator.hardwareConcurrency || 4));
    const triesPerBatch = cfg.triesPerBatch ?? TRIES_PER_BATCH;
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

    // progress emit
    progressTimer = window.setInterval(() => {
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Math.round((totalTries * 1000) / elapsedMs) : 0;
      cb.onProgress?.({ totalTries, elapsedMs, seedsPerSec, matches });
    }, 250) as unknown as number;

    // Spawn workers
    for (let i = 0; i < threads; i++) {
      // Classic worker (no `{ type: "module" }`): the Emscripten glue at
      // /wasm/immolate.js uses importScripts() which only works in classic workers.
      // We point Vite at the raw worker source via new URL(...) so it bundles correctly.
      const worker = new Worker(
        new URL("./seedFinderWorker.ts", import.meta.url)
      );
      this.workers.push(worker);

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
        // 32-bit seed for xorshift per-worker
        const rngSeed = (Math.floor(Math.random() * 0xffffffff) ^ (i * 2654435761)) >>> 0;
        worker.postMessage({
          type: "search",
          rngSeed,
          triesBatch: triesPerBatch,
          maxAnte: cfg.maxAnte,
          deck: cfg.deck,
          stake: cfg.stake,
          versionInt,
          jokerConstraints: cfg.jokerConstraints,
          voucherConstraints: cfg.voucherConstraints ?? [],
          tagConstraints: cfg.tagConstraints ?? [],
        });
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

      // Trigger init
      worker.postMessage({ type: "init" });
    }

    return { stop, promise };
  }
}
