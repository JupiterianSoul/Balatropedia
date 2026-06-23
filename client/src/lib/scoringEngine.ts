// Pure scoring engine. Mirrors Balatro's apply order:
// 1. Hand base chips/mult (scaled by hand level)
// 2. + Flat chips (joker addChips, Foil +50, enhancement chips)
// 3. + Flat mult (joker addMult, Holo +10)
// 4. × Mult (joker xMult, Polychrome ×1.5, Steel ×1.5 per card, Glass ×2 per card, external)
// Red seal retriggers multiply joker contributions before xMult chain.

import type { PlannerState, ScoreBreakdownLine, ScoreResult } from "../../../shared/plannerTypes";
import { getHandStats } from "./handLevels";

const FOIL_CHIPS = 50;
const HOLO_MULT = 10;
const POLY_X = 1.5;
const STEEL_X = 1.5;
const GLASS_X = 2;

export function computeScore(state: PlannerState): ScoreResult {
  const breakdown: ScoreBreakdownLine[] = [];
  const stats = getHandStats(state.hand, state.handLevel);

  let chips = stats.chips;
  let mult = stats.mult;
  const xMultStack: { label: string; value: number }[] = [];

  breakdown.push({
    label: `Hand base (${state.hand.replace(/_/g, " ")}, lvl ${state.handLevel})`,
    chips: stats.chips,
    mult: stats.mult,
  });

  // Enhancement flat chips
  if (state.enhancementChips > 0) {
    chips += state.enhancementChips;
    breakdown.push({ label: "Enhancements (+chips)", chips: state.enhancementChips });
  }

  // Walk slots
  const retriggerMult = 1 + Math.max(0, state.redSealRetriggers);
  state.slots.forEach((slot, idx) => {
    if (!slot.jokerId) return;
    const slotN = idx + 1;
    let slotChips = slot.addChips;
    let slotMult = slot.addMult;

    if (slot.edition === "foil") slotChips += FOIL_CHIPS;
    if (slot.edition === "holo") slotMult += HOLO_MULT;

    if (slotChips !== 0 || slotMult !== 0) {
      const appliedChips = slotChips * retriggerMult;
      const appliedMult = slotMult * retriggerMult;
      chips += appliedChips;
      mult += appliedMult;
      breakdown.push({
        label: `Slot ${slotN} (${slot.jokerId})${state.redSealRetriggers > 0 ? ` ×${retriggerMult} retrig` : ""}`,
        chips: appliedChips || undefined,
        mult: appliedMult || undefined,
      });
    }

    if (slot.xMult > 1) {
      xMultStack.push({ label: `Slot ${slotN} ×Mult`, value: slot.xMult });
    }
    if (slot.edition === "poly") {
      xMultStack.push({ label: `Slot ${slotN} Polychrome`, value: POLY_X });
    }
  });

  // Steel / Glass cards
  for (let i = 0; i < state.steelCards; i++) {
    xMultStack.push({ label: "Steel card", value: STEEL_X });
  }
  for (let i = 0; i < state.glassCards; i++) {
    xMultStack.push({ label: "Glass card", value: GLASS_X });
  }

  if (state.externalXMult && state.externalXMult !== 1) {
    xMultStack.push({ label: "External ×Mult", value: state.externalXMult });
  }

  // Apply xMult chain
  let finalMult = mult;
  for (const x of xMultStack) {
    finalMult = finalMult * x.value;
    breakdown.push({ label: x.label, xMult: x.value });
  }

  const score = Math.floor(chips * finalMult);

  breakdown.push({
    label: "= Score",
    chips,
    mult: finalMult,
    note: `${chips.toLocaleString()} × ${finalMult.toLocaleString()} = ${score.toLocaleString()}`,
  });

  return { chips, mult: finalMult, score, breakdown };
}
