/**
 * seedReproduction.ts
 *
 * Given a SeedMatch (from the seed finder / analyzer), derive the full set
 * of in-game rules and steps the player must follow to actually witness the
 * shown content at the shown locations.
 *
 * Balatro is deterministic *given identical inputs*. The seed alone is not
 * enough: deck, stake, version, joker unlock status, AND the exact path of
 * skips/rerolls/purchases all influence what shows up when. This module
 * spells those preconditions out.
 *
 * NOTHING here calls the engine — it's a pure derivation from match data
 * the engine already returned.
 */
import type { SeedMatch } from "./seedFinder";
import { describeShopSlot, describePackSlot } from "./seedFinderLocation";

export type StepKind =
  | "unlock"          // must have joker/stake/deck unlocked
  | "setup"           // deck/stake/seed entry
  | "ante"            // reach ante N
  | "shop"            // visit shop after blind X
  | "buy"             // buy a specific item at a specific slot
  | "reroll-warn"     // must NOT reroll the shop (or up to N times only)
  | "pack"            // open a booster pack
  | "skip-warn"       // must NOT skip the blind
  | "consumable"      // hold a tarot/spectral/planet of a specific kind
  | "rule"            // general rule/condition
  | "result";         // the final delivery moment for the target

export interface ReproStep {
  kind: StepKind;
  ante?: number;
  blind?: "Small" | "Big" | "Boss";
  text: string;
  hint?: string;
}

export interface ReproductionPlan {
  globalRules: ReproStep[];   // up-front rules valid for the whole run
  perAnteSteps: Record<number, ReproStep[]>; // ante → ordered steps
  warnings: string[];         // important caveats (unlocks, version, etc)
}

const STAKE_REQUIRES_UNLOCK: Record<string, string> = {
  "White Stake": "",
  "Red Stake":    "Beat the game once with this deck on White Stake.",
  "Green Stake":  "Beat Red Stake with this deck.",
  "Black Stake":  "Beat Green Stake with this deck.",
  "Blue Stake":   "Beat Black Stake with this deck.",
  "Purple Stake": "Beat Blue Stake with this deck.",
  "Orange Stake": "Beat Purple Stake with this deck.",
  "Gold Stake":   "Beat Orange Stake with this deck.",
};

const DECK_REQUIRES_UNLOCK: Record<string, string> = {
  "Red Deck":      "",
  "Blue Deck":     "Win a run on Red Deck.",
  "Yellow Deck":   "Win a run on Blue Deck.",
  "Green Deck":    "Win a run on Yellow Deck.",
  "Black Deck":    "Win a run on Green Deck.",
  "Magic Deck":    "Win a run on Black Deck with the Crystal Ball voucher.",
  "Nebula Deck":   "Win a run with the Telescope voucher.",
  "Ghost Deck":    "Win a run with a Spectral card used.",
  "Abandoned Deck":"Win a run without playing any face cards.",
  "Checkered Deck":"Win a run with a full Spade+Heart-only deck.",
  "Zodiac Deck":   "Win a run with Tarot Merchant + Planet Merchant + Overstock.",
  "Painted Deck":  "Win a run reaching ante 4 with no extra cards added.",
  "Anaglyph Deck": "Defeat a Boss Blind without retries.",
  "Plasma Deck":   "Beat Gold Stake on any deck.",
  "Erratic Deck":  "Win a run with a deck that has shuffled ranks/suits.",
};

const LEGENDARY_JOKERS = new Set(["Triboulet", "Yorick", "Chicot", "Perkeo", "Canio"]);

/** Negative jokers must come from a Negative Tag or a Soul card via Spectral. */
function editionConstraintNote(edition: string): string | null {
  if (!edition || edition === "No Edition") return null;
  switch (edition) {
    case "Negative":     return "Negative edition: only from Negative Tag, Spectral cards (Hex/Talisman), or specific shop slots. Buying a normal item will NOT make it Negative.";
    case "Polychrome":   return "Polychrome edition: rare native shop drop, or apply via Polychrome Tag.";
    case "Holographic":  return "Holographic edition: from Holographic Tag or rare shop drop.";
    case "Foil":         return "Foil edition: from Foil Tag or shop drop.";
    default: return null;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Build a complete reproduction plan from a SeedMatch and its preset. */
export function buildReproductionPlan(
  match: SeedMatch,
  preset: { deck: string; stake: string; version: string; },
): ReproductionPlan {
  const global: ReproStep[] = [];
  const perAnte: Record<number, ReproStep[]> = {};
  const warnings: string[] = [];

  // ─── Global rules ──────────────────────────────────────────
  global.push({
    kind: "setup",
    text: `Start a new run, enter the seed code: ${match.seed}`,
    hint: "Seed is case-sensitive. Type it exactly in the seed entry field on the deck-select screen.",
  });
  global.push({
    kind: "setup",
    text: `Deck: ${preset.deck}`,
  });
  global.push({
    kind: "setup",
    text: `Stake: ${preset.stake}`,
  });
  global.push({
    kind: "rule",
    text: `Game version must be exactly ${preset.version}`,
    hint: "Balatro updates change RNG ordering. A seed found on 1.0.1f will not produce the same items on 1.0.0 or earlier.",
  });

  // Deck unlock requirement
  const deckUnlock = DECK_REQUIRES_UNLOCK[preset.deck];
  if (deckUnlock) {
    global.push({
      kind: "unlock",
      text: `Unlock requirement for ${preset.deck}: ${deckUnlock}`,
    });
  }
  // Stake unlock chain
  const stakeUnlock = STAKE_REQUIRES_UNLOCK[preset.stake];
  if (stakeUnlock) {
    global.push({
      kind: "unlock",
      text: `Unlock requirement for ${preset.stake}: ${stakeUnlock}`,
    });
  }

  // Joker unlocks
  for (const j of match.jokerLocations) {
    if (LEGENDARY_JOKERS.has(j.joker)) {
      global.push({
        kind: "unlock",
        text: `${j.joker} (Legendary) only appears from The Soul spectral card. Make sure you have not disabled spectrals.`,
      });
    }
  }

  // Edition rules
  const editions = new Set<string>();
  for (const j of match.jokerLocations) if (j.edition) editions.add(j.edition);
  for (const e of editions) {
    const note = editionConstraintNote(e);
    if (note) global.push({ kind: "rule", text: note });
  }

  // ─── Per-ante steps ────────────────────────────────────────
  // Sort all events chronologically (by ante, then by within-ante order).
  // Order within an ante: small-blind tag (orderKey 0) -> small-blind shop -> big-blind
  // tag / big-blind shop / boss-blind shop -> boss fight -> voucher (boss shop).
  const allEvents: Array<{ kind: "joker" | "voucher" | "tag" | "boss" | "standardCard"; payload: any; ante: number; orderKey: number }> = [];

  for (const j of match.jokerLocations) {
    const key = (j.slot ?? 0) * 100 + (j.packPosition ?? 0);
    allEvents.push({ kind: "joker", payload: j, ante: j.ante, orderKey: 100 + key });
  }
  for (const v of match.voucherLocations) {
    // Vouchers fire at the boss-blind shop — push toward end of ante.
    allEvents.push({ kind: "voucher", payload: v, ante: v.ante, orderKey: 9000 });
  }
  for (const tg of match.tagLocations) {
    // tagLocations.blind is 0 (small) or 1 (big).
    const blindOrder = tg.blind === 1 ? 50 : 10;
    allEvents.push({ kind: "tag", payload: tg, ante: tg.ante, orderKey: blindOrder });
  }
  for (const b of match.bossLocations ?? []) {
    allEvents.push({ kind: "boss", payload: b, ante: b.ante, orderKey: 8000 });
  }
  for (const sc of match.standardCardLocations ?? []) {
    // packIndex 0..5: same chronological ordering as joker pack positions.
    // packIndex is 1-based here; subtract 1 so orderKey ordering matches joker packs.
    allEvents.push({ kind: "standardCard", payload: sc, ante: sc.ante, orderKey: 200 + Math.max(0, sc.packIndex - 1) * 100 });
  }

  allEvents.sort((a, b) => a.ante - b.ante || a.orderKey - b.orderKey);

  for (const ev of allEvents) {
    const ante = ev.ante;
    if (!perAnte[ante]) {
      perAnte[ante] = [{
        kind: "ante",
        ante,
        text: `Reach Ante ${ante}. Beat all blinds normally — do NOT use any tag that re-rolls the shop unless noted below.`,
      }];
    }
    const steps = perAnte[ante];

    if (ev.kind === "joker") {
      const j = ev.payload as SeedMatch["jokerLocations"][number];
      if (j.source === "shop") {
        const info = describeShopSlot(j.slot, j.ante);
        if (info.unspecified) {
          steps.push({
            kind: "shop",
            ante,
            text: `During ante ${ante}, visit all three shops (after Small, Big, and Boss Blind) and check every slot for ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""}.`,
            hint: "The engine confirmed this joker spawns in this ante's shop but did not pin the exact blind or slot. Do NOT reroll any shop manually — manual rerolls consume RNG and break the seed. If a Reroll Tag pre-rolls automatically, that is fine.",
          });
          steps.push({
            kind: "buy",
            ante,
            text: `Buy ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""} as soon as it appears.`,
            hint: `${j.eternal ? "Eternal — cannot be sold or destroyed. " : ""}${j.perishable ? "Perishable — expires after 5 rounds. " : ""}${j.rental ? "Rental — costs $3 per round. " : ""}Click Verify on the match card for engine-level confirmation.`,
          });
        } else {
          steps.push({
            kind: "shop",
            ante,
            blind: info.blind,
            text: `After defeating the ${info.blind} Blind of ante ${ante}, open the shop.`,
          });
          steps.push({
            kind: "reroll-warn",
            ante,
            text: `Do NOT reroll the shop before purchasing — rerolling consumes RNG and shifts every subsequent slot.`,
            hint: "If a Reroll Tag pre-rolled the shop automatically, that is fine; only manual rerolls break the seed.",
          });
          steps.push({
            kind: "buy",
            ante,
            blind: info.blind,
            text: `Buy ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""} at shop slot ${info.positionInShop}.`,
            hint: `Slot count starts at 1 from the leftmost item. ${j.eternal ? "This joker is Eternal — cannot be sold or destroyed. " : ""}${j.perishable ? "Perishable — expires after 5 rounds. " : ""}${j.rental ? "Rental — costs $3 per round. " : ""}`,
          });
        }
      } else if (j.source === "buffoon-pack") {
        const info = describePackSlot(j.slot, j.ante);
        if (info.unspecified) {
          steps.push({
            kind: "shop",
            ante,
            text: `During ante ${ante}, open every Buffoon Pack you find in any of the three shops (Small, Big, Boss).`,
            hint: "The engine confirmed a Buffoon Pack in this ante contains the target joker but did not pin the exact blind or pack position. Do NOT manually reroll any shop — rerolling shifts the booster offerings.",
          });
          steps.push({
            kind: "buy",
            ante,
            text: `From the Buffoon Pack, pick ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""}.`,
            hint: "Buffoon Packs contain jokers exclusively. Click Verify on the match card for engine-level confirmation.",
          });
        } else {
          steps.push({
            kind: "shop",
            ante,
            blind: info.blind,
            text: `After defeating the ${info.blind} Blind of ante ${ante}, open the shop.`,
          });
          steps.push({
            kind: "pack",
            ante,
            blind: info.blind,
            text: `Buy the ${ordinal(info.positionInShop)} booster pack offered${j.packName ? ` (${j.packName})` : ""} — DO NOT skip the other booster or it may shift order.`,
            hint: "Buffoon Packs contain jokers exclusively.",
          });
          steps.push({
            kind: "buy",
            ante,
            blind: info.blind,
            text: j.packPosition > 0
              ? `From the pack, pick card #${j.packPosition}: ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""}.`
              : `From the pack, pick ${j.joker}${j.edition && j.edition !== "No Edition" ? ` (${j.edition})` : ""}.`,
          });
        }
      } else if (j.source === "arcana-soul" || j.source === "spectral-soul" || j.source === "spectral-wraith") {
        const info = describePackSlot(j.slot, j.ante);
        const packKind = j.source === "arcana-soul" ? "Arcana" : "Spectral";
        if (info.unspecified) {
          steps.push({
            kind: "shop",
            ante,
            text: `During ante ${ante}, open every ${packKind} Pack you find across all three shops (Small, Big, Boss).`,
            hint: "The engine confirmed The Soul spawns in this ante's pack pool but did not pin the exact blind or pack position. Keep at least one joker slot free before opening any pack.",
          });
          steps.push({
            kind: "consumable",
            ante,
            text: `Inside the ${packKind} pack, pick The Soul to spawn ${j.joker} (legendary).`,
            hint: "The Soul / The Hex routes are the only ways to roll a legendary joker. Click Verify on the match card for engine-level confirmation.",
          });
        } else {
          steps.push({
            kind: "shop",
            ante,
            blind: info.blind,
            text: `After defeating the ${info.blind} Blind of ante ${ante}, open the shop.`,
          });
          steps.push({
            kind: "pack",
            ante,
            blind: info.blind,
            text: `Buy the ${ordinal(info.positionInShop)} booster${j.packName ? ` (${j.packName}, a ${packKind} pack)` : ` (a ${packKind} pack)`}.`,
            hint: `You must have a free joker slot when picking The Soul, otherwise the legendary will be lost.`,
          });
          steps.push({
            kind: "consumable",
            ante,
            text: `Within the ${packKind} pack, select The Soul card to spawn ${j.joker} (legendary).`,
            hint: "The Soul / The Hex / Talisman effects can produce legendaries or apply Negative — these are the only routes for legendaries.",
          });
        }
      }

      const editionNote = editionConstraintNote(j.edition || "");
      if (editionNote) {
        steps.push({ kind: "rule", ante, text: editionNote });
      }
    }

    if (ev.kind === "voucher") {
      const v = ev.payload as SeedMatch["voucherLocations"][number];
      steps.push({
        kind: "buy",
        ante,
        text: `Voucher to expect this ante: ${v.voucher}. Vouchers only appear in the BOSS-blind shop.`,
        hint: "If you skip the boss-blind shop, you lose this voucher for the run.",
      });
    }

    if (ev.kind === "tag") {
      const tg = ev.payload as SeedMatch["tagLocations"][number];
      const blindLabel: "Small" | "Big" = tg.blind === 1 ? "Big" : "Small";
      steps.push({
        kind: "skip-warn",
        ante,
        blind: blindLabel,
        text: `Tag for the ${blindLabel} Blind of ante ${ante}: ${tg.tag}. Skipping the blind awards this tag.`,
        hint: "Tags only appear if you SKIP the blind. Beating the blind gives money instead.",
      });
    }

    if (ev.kind === "boss") {
      const b = ev.payload as NonNullable<SeedMatch["bossLocations"]>[number];
      steps.push({
        kind: "rule",
        ante,
        blind: "Boss",
        text: `Boss Blind for ante ${ante}: ${b.boss}.`,
        hint: "Boss blinds are deterministic per seed/version/deck/stake. The exact effect is what you fight.",
      });
    }

    if (ev.kind === "standardCard") {
      const sc = ev.payload as NonNullable<SeedMatch["standardCardLocations"]>[number];
      // sc.packIndex is 1-based (1..6 across the 3 blinds, 2 packs per blind).
      const pIdx0 = Math.max(0, sc.packIndex - 1);
      const blindIdx = Math.min(2, Math.floor(pIdx0 / 2));
      const positionInShop = (pIdx0 % 2) + 1;
      const blindLabel: "Small" | "Big" | "Boss" = blindIdx === 0 ? "Small" : blindIdx === 1 ? "Big" : "Boss";
      const editionLabel = sc.edition && sc.edition !== "" ? ` (${sc.edition})` : "";
      const sealLabel = sc.seal && sc.seal !== "" ? `, ${sc.seal} seal` : "";
      const enhLabel = sc.enhancement && sc.enhancement !== "" ? `, ${sc.enhancement}` : "";
      steps.push({
        kind: "shop",
        ante,
        blind: blindLabel,
        text: `After defeating the ${blindLabel} Blind of ante ${ante}, open the shop.`,
      });
      steps.push({
        kind: "pack",
        ante,
        blind: blindLabel,
        text: `Buy the ${ordinal(positionInShop)} booster pack offered${sc.packName ? ` (${sc.packName})` : ""} — do NOT skip the other booster or pack order shifts.`,
        hint: "Standard packs contain playing cards. The target card is engine-resolved at this exact pack position.",
      });
      steps.push({
        kind: "buy",
        ante,
        blind: blindLabel,
        text: sc.cardIndex > 0
          ? `Within the pack, pick card #${sc.cardIndex}: ${sc.base}${editionLabel}${enhLabel}${sealLabel}.`
          : `Within the pack, pick ${sc.base}${editionLabel}${enhLabel}${sealLabel}.`,
        hint: "Cards in a Standard Pack are numbered left to right starting at 1.",
      });
    }
  }

  // Final delivery marker on last ante
  const lastAnte = allEvents.length > 0 ? allEvents[allEvents.length - 1].ante : null;
  if (lastAnte != null) {
    (perAnte[lastAnte] ||= []).push({
      kind: "result",
      ante: lastAnte,
      text: `By the end of ante ${lastAnte} you should now own all target jokers as shown above.`,
    });
  }

  // Warnings
  warnings.push("If you reroll any shop, skip a blind unexpectedly, or use a voucher/tag effect out of order, all subsequent positions WILL change. Follow the steps in exact order.");
  warnings.push("Some jokers (Showman, Astronomer, etc.) modify shop rates — if you already own them their effect is already accounted for in this seed plan.");
  warnings.push("Joker unlock status matters: if you have not unlocked a joker in your account, it cannot spawn even on the correct seed. Unlock it first in a separate run.");

  return { globalRules: global, perAnteSteps: perAnte, warnings };
}
