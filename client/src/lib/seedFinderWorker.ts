// seedFinderWorker.ts - Web Worker running the Immolate WASM engine.
// Loads /wasm/immolate.js from public, then receives search batches.

let Module: any = null;
let ready = false;

async function initModule() {
  if (Module) return Module;
  // Load Emscripten glue from public/ via importScripts (workers can't use ES imports
  // for the wasm glue, since it does its own dynamic fetching).
  // The Emscripten output is "MODULARIZE=1" so it exposes a factory function.
  // We import the JS as a script (worker can do `importScripts`).
  // Vite serves files from /public/ at the root.
  (self as any).importScripts("/wasm/immolate.js");
  // After import, global `Immolate` is the factory
  const factory = (self as any).Immolate;
  Module = await factory({
    locateFile: (p: string) => p.endsWith(".wasm") ? "/wasm/immolate.wasm" : p,
  });
  return Module;
}

interface SearchMessage {
  type: "search";
  rngSeed: number;
  triesBatch: number;
  maxAnte: number;
  deck: string;
  stake: string;
  versionInt: number;
  jokerConstraints: Array<{ joker: string; edition?: string; source?: string; maxAnte: number }>;
  voucherConstraints: Array<{ voucher: string; maxAnte: number }>;
  tagConstraints: Array<{ tag: string; maxAnte: number }>;
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "init") {
    try {
      await initModule();
      ready = true;
      (self as any).postMessage({ type: "ready" });
    } catch (err: any) {
      (self as any).postMessage({ type: "error", message: err.message || String(err) });
    }
    return;
  }

  if (msg.type === "search") {
    if (!ready) {
      (self as any).postMessage({ type: "error", message: "Module not ready" });
      return;
    }
    try {
      const m: SearchMessage = msg;

      const jc = new Module.VectorJokerConstraint();
      for (const c of m.jokerConstraints) {
        jc.push_back({
          joker: c.joker,
          edition: c.edition ?? "",
          source: c.source ?? "",
          maxAnte: c.maxAnte,
        });
      }

      const vc = new Module.VectorVoucherConstraint();
      for (const c of m.voucherConstraints) {
        vc.push_back({ voucher: c.voucher, maxAnte: c.maxAnte });
      }

      const tc = new Module.VectorTagConstraint();
      for (const c of m.tagConstraints) {
        tc.push_back({ tag: c.tag, maxAnte: c.maxAnte });
      }

      const result = Module.findSeedV2(
        m.rngSeed >>> 0,
        m.triesBatch,
        m.maxAnte,
        m.deck,
        m.stake,
        m.versionInt,
        jc, vc, tc
      );

      // Marshal embind vectors to plain JS
      const jLocs: any[] = [];
      const jl = result.jokerLocations;
      for (let i = 0; i < jl.size(); i++) {
        const j = jl.get(i);
        jLocs.push({
          joker: j.joker, edition: j.edition, source: j.source,
          ante: j.ante, slot: j.slot, packName: j.packName,
          packPosition: j.packPosition,
          eternal: j.eternal, perishable: j.perishable, rental: j.rental,
        });
      }
      const vLocs: any[] = [];
      const vl = result.voucherLocations;
      for (let i = 0; i < vl.size(); i++) {
        const v = vl.get(i);
        vLocs.push({ voucher: v.voucher, ante: v.ante });
      }
      const tLocs: any[] = [];
      const tl = result.tagLocations;
      for (let i = 0; i < tl.size(); i++) {
        const t = tl.get(i);
        tLocs.push({ tag: t.tag, ante: t.ante, blind: t.blind });
      }

      jc.delete(); vc.delete(); tc.delete();

      (self as any).postMessage({
        type: "result",
        tries: result.tries,
        seed: result.seed,
        jokerLocations: jLocs,
        voucherLocations: vLocs,
        tagLocations: tLocs,
      });
    } catch (err: any) {
      (self as any).postMessage({ type: "error", message: err.message || String(err) });
    }
  }
};
