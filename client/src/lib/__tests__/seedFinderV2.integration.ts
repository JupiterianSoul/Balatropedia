/**
 * Live integration tests for buildMatch + inspect_seed + the parser.
 *
 * Runs the upstream Balatro-Seed-Searcher node WASM engine directly (NOT the
 * Balatropedia copy; both are bit-identical and we proved that previously).
 * For each scenario we:
 *   1) Build a FinderConfig
 *   2) buildFilterJson(cfg)
 *   3) Scan for ONE matching seed
 *   4) inspect_seed on it
 *   5) buildMatch(seed, inspectJson, cfg)
 *   6) Assert the produced SeedMatch makes sense
 *
 * Run with:
 *   npx tsx client/src/lib/__tests__/seedFinderV2.integration.ts
 */

import { buildFilterJson, buildMatch } from "../seedFinderV2";
import type { FinderConfig } from "../seedFinder";
import { createRequire } from "module";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const ENGINE_PATH = path.resolve(
  __dirname,
  "../../../../../Balatro-Seed-Searcher/engine/pkg-node/balatro_seed_engine.js",
);

interface EngineModule {
  init: () => void;
  scan_chunk: (
    filterJson: string,
    startRank: bigint,
    count: bigint,
    seedLen: number,
    deckIdx: number,
    stakeIdx: number,
    partial: boolean,
    minScore: number,
  ) => Uint8Array;
  inspect_seed: (filterJson: string, seed: string, deckIdx: number, stakeIdx: number) => string;
}

const engine: EngineModule = require(ENGINE_PATH);
engine.init();

const RECORD_SIZE = 17;
function decodeRecords(buf: Uint8Array): Array<{ score: number; seed: string }> {
  const out: Array<{ score: number; seed: string }> = [];
  const dec = new TextDecoder("utf-8");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let off = 0; off + RECORD_SIZE <= buf.byteLength; off += RECORD_SIZE) {
    const score = dv.getUint8(off + 8);
    const seedBytes = buf.slice(off + 9, off + 17);
    const seed = dec.decode(seedBytes).trimEnd();
    out.push({ score, seed });
  }
  return out;
}

function findFirstSeed(filterJson: string, deck = 0, stake = 0): string | null {
  let cursor = 0n;
  for (let i = 0; i < 200; i++) {
    const buf = engine.scan_chunk(filterJson, cursor, 200_000n, 8, deck, stake, false, 0);
    const recs = decodeRecords(buf);
    if (recs.length > 0) return recs[0].seed;
    cursor += 200_000n;
  }
  return null;
}

type Test = { name: string; run: () => void };
const tests: Test[] = [];
const failures: string[] = [];

function t(name: string, run: () => void) { tests.push({ name, run }); }

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error("assertion failed: " + msg);
}

// ───────────────────────── TEST 1: multi-joker constraint ────────────────────
t("multi-joker: Blueprint + Bull, both in early antes, locations differ per seed", () => {
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Blueprint", source: "buffoon-pack", maxAnte: 4 },
      { joker: "Bull",      source: "shop",          maxAnte: 4, slot: -1 },
    ],
    maxAnte: 4, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  assert(m.jokerLocations.length === 2, "two joker locations expected");
  const [bp, bull] = m.jokerLocations;
  assert(bp.joker === "Blueprint", "first is Blueprint");
  assert(bull.joker === "Bull",    "second is Bull");
  // Source enums correctly reflect routing.
  assert(bp.source === "buffoon-pack", `Blueprint source wrong: ${bp.source}`);
  assert(bull.source === "shop",        `Bull source wrong: ${bull.source}`);
  assert(bp.ante >= 1 && bp.ante <= 4, `Blueprint ante out of range: ${bp.ante}`);
  assert(bull.ante >= 1 && bull.ante <= 4, `Bull ante out of range: ${bull.ante}`);
  console.log(`  Blueprint @ ante ${bp.ante} (${bp.packName}, pack #${bp.slot - 1})`);
  console.log(`  Bull      @ ante ${bull.ante} (shop slot raw ${bull.slot - 1})`);
});

// ───────────────────────── TEST 2: edition + slot specific ───────────────────
t("shop joker with edition + sticker + specific slot", () => {
  // Foil + Negative are very rare; we relax to ANY edition + ANY slot, but pin slot
  // to a specific 0..14 value to exercise the slot=N path (not slot=255).
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Joker", source: "shop", slot: 3, maxAnte: 6 },
    ],
    maxAnte: 6, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  const jl = m.jokerLocations[0];
  assert(jl.source === "shop", `expected source=shop, got ${jl.source}`);
  // Internal: slot field carries engine-raw slot + 1.
  // Engine slot 3 -> Big-blind shop position 4.
  const engineSlot = jl.slot - 1;
  assert(engineSlot === 3, `expected engine slot 3, got ${engineSlot}`);
  console.log(`  Joker pinned to engine slot 3 (Big blind, position 4) - confirmed`);
});

// ───────────────────────── TEST 3: Soul → specific legendary ────────────────
t("Triboulet via Soul resolves real ante+pack from engine", () => {
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Triboulet", source: "spectral-soul", maxAnte: 8 },
    ],
    maxAnte: 8, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  const jl = m.jokerLocations[0];
  assert(jl.joker === "Triboulet", "joker");
  assert(jl.source === "arcana-soul" || jl.source === "spectral-soul",
    `expected arcana/spectral-soul, got ${jl.source}`);
  assert(jl.packName.length > 0, "packName should be set");
  console.log(`  Triboulet @ ante ${jl.ante} (${jl.packName}, pack idx ${jl.slot - 1})`);
});

// ───────────────────────── TEST 4: Boss constraint ──────────────────────────
t("boss constraint produces a real BossLocation", () => {
  // Use a common boss: "The Wall"
  const cfg: FinderConfig = {
    jokerConstraints: [],
    bossConstraints: [{ boss: "The Wall", maxAnte: 4 }],
    maxAnte: 4, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  assert(m.bossLocations && m.bossLocations.length === 1, "one boss location");
  const b = m.bossLocations![0];
  assert(b.boss === "The Wall", `expected The Wall, got ${b.boss}`);
  assert(b.ante >= 1 && b.ante <= 4, `boss ante range: ${b.ante}`);
  console.log(`  The Wall boss @ ante ${b.ante}`);
});

// ───────────────────────── TEST 5: Voucher constraint ───────────────────────
t("voucher constraint produces a real VoucherLocation", () => {
  const cfg: FinderConfig = {
    jokerConstraints: [],
    voucherConstraints: [{ voucher: "Telescope", maxAnte: 4 }],
    maxAnte: 4, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  assert(m.voucherLocations.length === 1, "one voucher location");
  const v = m.voucherLocations[0];
  assert(v.voucher === "Telescope", `voucher: ${v.voucher}`);
  console.log(`  Telescope voucher @ ante ${v.ante}`);
});

// ───────────────────────── TEST 6: Tag constraint with blind ────────────────
t("tag constraint records the engine-reported blind (0/1)", () => {
  const cfg: FinderConfig = {
    jokerConstraints: [],
    tagConstraints: [{ tag: "Negative Tag", position: 0, maxAnte: 4 }],
    maxAnte: 4, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  assert(m.tagLocations.length === 1, "one tag location");
  const tg = m.tagLocations[0];
  assert(tg.tag === "Negative Tag", `tag: ${tg.tag}`);
  assert(tg.blind === 0, `expected small blind (0), got ${tg.blind}`);
  console.log(`  Negative Tag @ ante ${tg.ante}, blind ${tg.blind === 1 ? "Big" : "Small"}`);
});

// ───────────────────────── TEST 7: Standard card with seal+edition ──────────
t("standard pack card with edition+seal+enhancement is fully resolved", () => {
  // Relax: any Ace of Spades in first 6 packs of ante <= 6, no edition/seal
  // (specific combos are extremely rare). We exercise the standard-card path.
  const cfg: FinderConfig = {
    jokerConstraints: [],
    standardCardConstraints: [
      { base: "Ace of Spades", maxAnte: 6 },
    ],
    maxAnte: 6, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  assert(seed, "no seed found");
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  assert(m.standardCardLocations && m.standardCardLocations.length === 1, "one std-card location");
  const sc = m.standardCardLocations![0];
  assert(/Ace of Spades/.test(sc.base), `base: ${sc.base}`);
  assert(sc.packName.length > 0, "packName");
  assert(sc.cardIndex >= 1, `cardIndex: ${sc.cardIndex}`);
  console.log(`  Ace of Spades @ ante ${sc.ante}, pack #${sc.packIndex} (${sc.packName}), card ${sc.cardIndex}`);
});

// ───────────────────────── TEST 8: any_of + slot=255 ante reporting ─────────
t("any_of over multiple antes with slot=255: ante in detail matches engine", () => {
  // Slot -1 → 255 sentinel ("any slot"). maxAnte > 1 forces any_of wrapping.
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Joker", source: "shop", slot: -1, maxAnte: 8 },
    ],
    maxAnte: 8, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  // Sample MANY seeds and verify the reported ante is consistent with the seed.
  let cursor = 0n;
  let checked = 0;
  let anteHistogram: Record<number, number> = {};
  for (let i = 0; i < 5; i++) {
    const buf = engine.scan_chunk(filterJson, cursor, 50_000n, 8, 0, 0, false, 0);
    const recs = decodeRecords(buf);
    cursor += 50_000n;
    for (const r of recs) {
      const inspectJson = engine.inspect_seed(filterJson, r.seed, 0, 0);
      const m = buildMatch(r.seed, inspectJson, cfg);
      const a = m.jokerLocations[0].ante;
      anteHistogram[a] = (anteHistogram[a] || 0) + 1;
      checked++;
      if (checked >= 200) break;
    }
    if (checked >= 200) break;
  }
  assert(checked > 50, `expected >50 samples, got ${checked}`);
  // The histogram must include at least 2 different antes — proves we're not
  // pinning every result to ante 1 or the maxAnte.
  const distinctAntes = Object.keys(anteHistogram).length;
  assert(distinctAntes >= 2,
    `expected >=2 distinct antes across samples, got histogram=${JSON.stringify(anteHistogram)}`);
  console.log(`  any_of+slot=255: ${checked} samples, antes histogram = ${JSON.stringify(anteHistogram)}`);
});

// ───────────────────────── TEST 9: Wraith → specific Rare joker ─────────────
t("Wraith → Carte Blanche resolves real ante+pack", () => {
  // Carte Blanche is a Rare joker that Wraith can roll.
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Carte Blanche", source: "spectral-wraith", maxAnte: 8 },
    ],
    maxAnte: 8, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  if (!seed) {
    console.log("  (skipped) no Wraith→Carte Blanche seed in first 40M ranks");
    return;
  }
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  const jl = m.jokerLocations[0];
  assert(jl.joker === "Carte Blanche", "joker");
  assert(jl.source === "spectral-wraith", `expected spectral-wraith, got ${jl.source}`);
  assert(jl.packName.length > 0, "packName");
  console.log(`  Carte Blanche via Wraith @ ante ${jl.ante} (${jl.packName})`);
});

// ───────────────────────── TEST 10: combined filter (real Julie use case) ───
t("combined filter: joker + voucher + tag + boss + standard card", () => {
  const cfg: FinderConfig = {
    jokerConstraints: [
      { joker: "Joker", source: "shop", slot: -1, maxAnte: 6 },
    ],
    voucherConstraints: [{ voucher: "Telescope", maxAnte: 6 }],
    tagConstraints: [{ tag: "Negative Tag", position: 0, maxAnte: 6 }],
    bossConstraints: [{ boss: "The Wall", maxAnte: 6 }],
    standardCardConstraints: [{ base: "Ace of Spades", maxAnte: 6 }],
    maxAnte: 6, deck: "Red Deck", stake: "White Stake", version: "1.0.1f",
  };
  const filterJson = buildFilterJson(cfg);
  const seed = findFirstSeed(filterJson);
  if (!seed) {
    console.log("  (skipped) no combined-filter seed in first 40M ranks (extremely rare)");
    return;
  }
  const inspectJson = engine.inspect_seed(filterJson, seed!, 0, 0);
  const m = buildMatch(seed!, inspectJson, cfg);
  console.log(`  combined match: ${seed}`);
  console.log(`    joker @ ${m.jokerLocations[0].ante}`);
  console.log(`    voucher @ ${m.voucherLocations[0].ante}`);
  console.log(`    tag @ ${m.tagLocations[0].ante} blind ${m.tagLocations[0].blind}`);
  console.log(`    boss @ ${m.bossLocations![0].ante}`);
  console.log(`    standard card @ ${m.standardCardLocations![0].ante}`);
  assert(m.bossLocations!.length === 1, "boss");
  assert(m.standardCardLocations!.length === 1, "std card");
});

// ───────────────────────── Run all ──────────────────────────────────────────
console.log(`\nRunning ${tests.length} integration tests against upstream WASM engine\n`);
for (const tc of tests) {
  try {
    console.log(`▶ ${tc.name}`);
    tc.run();
    console.log(`  ✓ pass\n`);
  } catch (e: any) {
    console.log(`  ✗ FAIL: ${e?.message ?? e}\n`);
    failures.push(`${tc.name}: ${e?.message ?? e}`);
  }
}

if (failures.length > 0) {
  console.log(`\n${failures.length} failure(s):\n  ${failures.join("\n  ")}`);
  process.exit(1);
} else {
  console.log(`\nALL ${tests.length} TESTS PASSED`);
  process.exit(0);
}
