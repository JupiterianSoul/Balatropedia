// Engine selector: picks the active V3-aware backend.
//
// V3 (when enabled by the user via the beta toggle):
//   1. Tries WebGPU diagnostic verification.
//      - If verified, the UI shows a "WebGPU ready" pill alongside the
//        WASM-SIMD backend. Actual seed searches still run on WASM
//        because the GPU search shader isn't ported yet (see V3_DESIGN.md).
//      - If verification fails, falls back to V2 WASM-SIMD.
//   2. WASM-SIMD if available, otherwise WASM-scalar.
//
// V2 path (default, V3 toggle off): unchanged from before — direct
// WebAssembly with SIMD detection.

import { probeWebGpu, type V3GpuStatus, type V3WasmModule } from './webgpuEngine';

export type EngineKind = 'webgpu+wasm-simd' | 'wasm-simd' | 'wasm-scalar';

export type EngineDescriptor = {
  kind: EngineKind;
  label: string;
  /**
   * Source of compute for actual searches. V3 currently always uses WASM
   * for searches; the WebGPU stack is verified but not yet running the
   * search workload. This will change once the f64-emulated GPU pipeline
   * lands.
   */
  searchBackend: 'wasm';
  webgpu?: V3GpuStatus;
};

const SIMD_TEST_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d,
  0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
  0x03, 0x02, 0x01, 0x00,
  0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0xfd, 0x62, 0x0b,
]);

function detectSimd(): boolean {
  try { return WebAssembly.validate(SIMD_TEST_BYTES); } catch { return false; }
}

/**
 * Pick the active engine, optionally probing WebGPU for the V3 beta path.
 * The function is idempotent and safe to call from the main thread.
 */
export async function selectEngine(opts: {
  v3Beta: boolean;
  wasm?: V3WasmModule | null;
}): Promise<EngineDescriptor> {
  const simd = detectSimd();
  const wasmKind: EngineKind = simd ? 'wasm-simd' : 'wasm-scalar';
  const wasmLabel = simd ? 'WASM SIMD' : 'WASM scalar';

  if (!opts.v3Beta) {
    return { kind: wasmKind, label: wasmLabel, searchBackend: 'wasm' };
  }

  if (!opts.wasm) {
    // V3 toggle is on but we don't have a WASM module to verify against.
    return { kind: wasmKind, label: `${wasmLabel} · V3 verify pending`, searchBackend: 'wasm' };
  }

  const status = await probeWebGpu(opts.wasm);
  if (status.kind === 'ready') {
    return {
      kind: 'webgpu+wasm-simd',
      label: `WebGPU verified (${status.adapterInfo}) · ${wasmLabel}`,
      searchBackend: 'wasm',
      webgpu: status,
    };
  }
  return {
    kind: wasmKind,
    label: `${wasmLabel} · V3 fell back (${status.kind === 'unsupported' ? status.reason : status.kind})`,
    searchBackend: 'wasm',
    webgpu: status,
  };
}
