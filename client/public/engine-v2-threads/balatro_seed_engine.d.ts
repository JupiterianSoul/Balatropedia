/* tslint:disable */
/* eslint-disable */

export function init(): void;

export function initThreadPool(num_threads: number): Promise<any>;

/**
 * Inspect a single seed: run each filter clause and return a JSON report
 * describing which clauses matched and where. Used by the "Verify a seed"
 * UI panel.
 */
export function inspect_seed(filter_json: string, seed: string, deck_idx: number, stake_idx: number): string;

/**
 * Scan a chunk and return packed match records.
 * Each record: 8 bytes rank LE + 1 byte score + 8 bytes seed (right-padded).
 * = 17 bytes per match.
 */
export function scan_chunk(filter_json: string, start_rank: bigint, count: bigint, seed_len: number, deck_idx: number, stake_idx: number, partial: boolean, min_score: number): Uint8Array;

/**
 * Parallel scan over `[start_rank, start_rank + count)`. Same output
 * format as `scan_chunk`. Requires the host page to be cross-origin
 * isolated (COOP/COEP) so `SharedArrayBuffer` is available; the JS
 * caller must have invoked `initThreadPool(threadCount)` first.
 *
 * Output is rank-ordered identically to the serial version. Determinism
 * is preserved because each seed's evaluation is a pure function of the
 * seed string + config.
 */
export function scan_chunk_parallel(filter_json: string, start_rank: bigint, count: bigint, seed_len: number, deck_idx: number, stake_idx: number, partial: boolean, min_score: number): Uint8Array;

export function v3_diagnostic_cpu(seed_base: number, iter_count: number, seed_count: number): Uint32Array;

/**
 * Returns the WGSL shader source as a string so the JS side doesn't have to
 * fetch a separate file. Keeps engine and shader versioned together.
 */
export function v3_diagnostic_shader_source(): string;

export class wbg_rayon_PoolBuilder {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    build(): void;
    numThreads(): number;
    receiver(): number;
}

export function wbg_rayon_start_worker(receiver: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly inspect_seed: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly scan_chunk: (a: number, b: number, c: bigint, d: bigint, e: number, f: number, g: number, h: number, i: number) => [number, number];
    readonly scan_chunk_parallel: (a: number, b: number, c: bigint, d: bigint, e: number, f: number, g: number, h: number, i: number) => [number, number];
    readonly v3_diagnostic_cpu: (a: number, b: number, c: number) => [number, number];
    readonly v3_diagnostic_shader_source: () => [number, number];
    readonly init: () => void;
    readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
    readonly initThreadPool: (a: number) => any;
    readonly wbg_rayon_poolbuilder_build: (a: number) => void;
    readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
    readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
    readonly wbg_rayon_start_worker: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
