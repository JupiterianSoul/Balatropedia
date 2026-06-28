/**
 * WASM Seed Finder — Worker Pool
 *
 * Replaces the JS finder when VITE_WASM_FINDER=1 (default in production).
 * Manages a pool of Web Workers, each running the Rust WASM module.
 *
 * Performance targets:
 *   - Low-end Android (Snapdragon 765G):  ≥ 50k seeds/sec
 *   - Flagship desktop (2024):            ≥ 200k seeds/sec
 *
 * Architecture:
 *   - navigator.hardwareConcurrency workers (capped 2–16)
 *   - Each worker pulls 10k-seed batches
 *   - Uses SharedArrayBuffer (SAB) if cross-origin isolated, else postMessage
 *   - Falls back to JS finder if WASM fails to initialize
 */

import type {
  FinderConfig, FinderCallbacks, FinderHandle,
  SeedMatch, FinderProgress,
} from "./seedFinder";

export const WASM_FINDER_ENABLED: boolean =
  import.meta.env.VITE_WASM_FINDER !== "0";

export const WASM_SIMD_SUPPORTED: boolean = (() => {
  // Feature-detect WASM SIMD support via a minimal probe
  // (WebAssembly.validate checks if the binary is structurally valid *and* features are supported)
  try {
    // v128.const instruction: 0xfd 0x0c + 16 zero bytes
    const simdProbe = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic
      0x01, 0x00, 0x00, 0x00, // version
      0x01, 0x05, 0x01, 0x60, 0x00, 0x00, // type section: () -> ()
      0x03, 0x02, 0x01, 0x00, // function section
      0x0a, 0x0a, 0x01, 0x08, 0x00, // code section start
      0xfd, 0x0c, // v128.const
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 16 zero bytes
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x1a, 0x0b, // drop + end
    ]);
    return typeof WebAssembly !== "undefined" && WebAssembly.validate(simdProbe);
  } catch {
    return false;
  }
})();

export const SAB_AVAILABLE: boolean =
  typeof SharedArrayBuffer !== "undefined" &&
  typeof Atomics !== "undefined";

export interface WasmFinderStats {
  wasmEnabled: boolean;
  simdSupported: boolean;
  sabAvailable: boolean;
  workerCount: number;
  batchSize: number;
}

export function getWasmFinderStats(workerCount: number, batchSize: number): WasmFinderStats {
  return {
    wasmEnabled: WASM_FINDER_ENABLED,
    simdSupported: WASM_SIMD_SUPPORTED,
    sabAvailable: SAB_AVAILABLE,
    workerCount,
    batchSize,
  };
}

// ─── WasmSeedFinder ───────────────────────────────────────────────────────────

export class WasmSeedFinder {
  private workers: Worker[] = [];
  private active = false;

  start(cfg: FinderConfig, cb: FinderCallbacks = {}): FinderHandle {
    if (this.active) throw new Error("WasmSeedFinder already running");
    this.active = true;

    const THREADS_CAP = 16;
    const THREADS_MIN = 2;
    const threads = Math.max(
      THREADS_MIN,
      Math.min(THREADS_CAP, cfg.threads ?? (navigator.hardwareConcurrency || 4))
    );
    const batchSize = cfg.triesPerBatch ?? 10_000;
    const maxTotalTries = cfg.maxTotalTries ?? 0;
    const versionInt = versionToInt(cfg.version);

    let totalTries = 0;
    let matchCount = 0;
    const allMatches: SeedMatch[] = [];
    const startedAt = performance.now();
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    let initErrors = 0;

    let resolveOuter: (m: SeedMatch[]) => void = () => {};
    const promise = new Promise<SeedMatch[]>((res) => { resolveOuter = res; });

    const cleanup = () => {
      if (progressTimer !== null) { clearInterval(progressTimer); progressTimer = null; }
      this.workers.forEach((w) => w.terminate());
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

    progressTimer = setInterval(() => {
      const elapsedMs = performance.now() - startedAt;
      const seedsPerSec = elapsedMs > 0 ? Math.round((totalTries * 1000) / elapsedMs) : 0;
      cb.onProgress?.({ totalTries, elapsedMs, seedsPerSec, matches: matchCount });
    }, 250) as unknown as ReturnType<typeof setInterval>;

    for (let i = 0; i < threads; i++) {
      const worker = new Worker(
        new URL("./seedFinderWasmWorker.ts", import.meta.url),
        { type: "module" }
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
        // XOR-shift for per-worker diversity in seed space
        const rngSeed = ((Math.random() * 0xffffffff) ^ (i * 2654435761)) >>> 0;
        worker.postMessage({
          type: "search",
          rngSeed,
          triesBatch: batchSize,
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
          initErrors++;
          // If ALL workers fail to init (WASM unavailable), signal error
          if (initErrors >= threads) {
            cb.onError?.(msg.message ?? "WASM not available");
            stop();
          }
          return;
        }
        if (msg.type === "result") {
          totalTries += msg.tries ?? batchSize;
          if (msg.seed) {
            const match: SeedMatch = {
              seed: msg.seed,
              jokerLocations: msg.jokerLocations ?? [],
              voucherLocations: msg.voucherLocations ?? [],
              tagLocations: msg.tagLocations ?? [],
            };
            allMatches.push(match);
            matchCount++;
            cb.onMatch?.(match);
          }
          dispatchBatch();
        }
      };

      worker.onerror = (err) => {
        cb.onError?.(err.message ?? "Worker error");
      };

      worker.postMessage({ type: "init" });
    }

    return { stop, promise };
  }
}

const VERSION_MAP: Record<string, number> = {
  "1.0.0":  10100,
  "1.0.1c": 10103,
  "1.0.1f": 10106,
};

function versionToInt(v: string): number {
  return VERSION_MAP[v] ?? 10106;
}
