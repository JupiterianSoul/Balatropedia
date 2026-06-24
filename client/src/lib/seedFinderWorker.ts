
let Module: any = null;
let ready = false;

let cachedSig: string | null = null;
let cachedJc: any = null;
let cachedVc: any = null;
let cachedTc: any = null;

function disposeCached() {
  if (cachedJc) { cachedJc.delete(); cachedJc = null; }
  if (cachedVc) { cachedVc.delete(); cachedVc = null; }
  if (cachedTc) { cachedTc.delete(); cachedTc = null; }
  cachedSig = null;
}

async function initModule() {
  if (Module) return Module;
  (self as any).importScripts("/wasm/immolate.js");
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

      const sig =
        m.deck + "|" + m.stake + "|" + m.versionInt + "|" + m.maxAnte + "|" +
        JSON.stringify(m.jokerConstraints) + "|" +
        JSON.stringify(m.voucherConstraints) + "|" +
        JSON.stringify(m.tagConstraints);

      if (sig !== cachedSig) {
        disposeCached();
        cachedJc = new Module.VectorJokerConstraint();
        for (const c of m.jokerConstraints) {
          cachedJc.push_back({
            joker: c.joker,
            edition: c.edition ?? "",
            source: c.source ?? "",
            maxAnte: c.maxAnte,
          });
        }
        cachedVc = new Module.VectorVoucherConstraint();
        for (const c of m.voucherConstraints) {
          cachedVc.push_back({ voucher: c.voucher, maxAnte: c.maxAnte });
        }
        cachedTc = new Module.VectorTagConstraint();
        for (const c of m.tagConstraints) {
          cachedTc.push_back({ tag: c.tag, maxAnte: c.maxAnte });
        }
        cachedSig = sig;
      }

      const result = Module.findSeedV2(
        m.rngSeed >>> 0,
        m.triesBatch,
        m.maxAnte,
        m.deck,
        m.stake,
        m.versionInt,
        cachedJc, cachedVc, cachedTc
      );

      const jLocs: any[] = [];
      const vLocs: any[] = [];
      const tLocs: any[] = [];
      if (result.seed) {
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
        const vl = result.voucherLocations;
        for (let i = 0; i < vl.size(); i++) {
          const v = vl.get(i);
          vLocs.push({ voucher: v.voucher, ante: v.ante });
        }
        const tl = result.tagLocations;
        for (let i = 0; i < tl.size(); i++) {
          const t = tl.get(i);
          tLocs.push({ tag: t.tag, ante: t.ante, blind: t.blind });
        }
      }

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
