
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

/**
 * SeedFinder: auto-selects WASM or JS finder.
 *
 * VITE_WASM_FINDER=1 (default) → tries WasmSeedFinder first;
 * if WASM fails to init (e.g. no SIMD, no binary yet) it falls back
 * to the JS+Immolate worker transparently.
 *
 * VITE_WASM_FINDER=0 → always uses JS finder.
 */
export class SeedFinder {
  private workers: Worker[] = [];
  private active = false;
  /** Detected throughput from last run (seeds/sec) */
  lastThroughput = 0;

  async init() {  }

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("SeedFinder already running");
    this.active = true;
    const self = this;

    // ── WASM path ────────────────────────────────────────────────────────────
    if (import.meta.env.VITE_WASM_FINDER !== "0") {
      let wasmHandle: FinderHandle | null = null;
      import("./seedFinderWasm").then(({ WasmSeedFinder }) => {
        const wasmFinder = new WasmSeedFinder();
        const wrappedCb: FinderCallbacks = {
          ...cb,
          onProgress: (p) => { self.lastThroughput = p.seedsPerSec; cb.onProgress?.(p); },
          onError: (msg) => {
            // WASM unavailable – fall back to JS
            console.warn("[seedFinder] WASM unavailable, falling back to JS:", msg);
            self.active = false;
            const fallbackHandle = self._startJs(cfg, cb);
            wasmHandle = fallbackHandle;
          },
        };
        const handle = wasmFinder.start(cfg, wrappedCb);
        wasmHandle = handle;
      }).catch(() => {
        // import failed — fall back
        self.active = false;
        const fallbackHandle = self._startJs(cfg, cb);
        wasmHandle = fallbackHandle;
      });

      return {
        stop: () => { wasmHandle?.stop(); if (!wasmHandle) { self.active = false; } },
        promise: new Promise<SeedMatch[]>((resolve) => {
          // The promise resolves when either wasm or js handle finishes
          const checkInterval = setInterval(() => {
            if (wasmHandle) {
              clearInterval(checkInterval);
              wasmHandle.promise.then(resolve);
            }
          }, 10);
        }),
      };
    }

    // ── JS path (fallback) ───────────────────────────────────────────────────
    return this._startJs(cfg, cb);
  }

  private _startJs(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    this.active = true;

    const THREADS_CAP = 16;
    const TRIES_PER_BATCH = 50000;
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
    const promise = new Promise<SeedMatch[]>((res) => {
      resolveOuter = res;
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
      this.lastThroughput = seedsPerSec;
      cb.onProgress?.({ totalTries, elapsedMs, seedsPerSec, matches });
    }, 250) as unknown as number;

    for (let i = 0; i < threads; i++) {
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

      worker.postMessage({ type: "init" });
    }

    return { stop, promise };
  }
}
