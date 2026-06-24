export interface BlindTargets {
  ante: number;
  small: number;
  big: number;
  boss: number;
}

const SMALL_BLIND_BY_ANTE: Record<number, number> = {
  1: 300,
  2: 800,
  3: 2000,
  4: 5000,
  5: 11000,
  6: 20000,
  7: 35000,
  8: 50000,
};

export function getBlindTargets(ante: number): BlindTargets {
  const a = Math.max(1, Math.min(8, Math.floor(ante)));
  const small = SMALL_BLIND_BY_ANTE[a] ?? 300;
  return {
    ante: a,
    small,
    big: Math.round(small * 1.5),
    boss: Math.round(small * 2),
  };
}

export function classifyScoreVsTargets(score: number, ante: number): "fail" | "small" | "big" | "boss" {
  const t = getBlindTargets(ante);
  if (score >= t.boss) return "boss";
  if (score >= t.big) return "big";
  if (score >= t.small) return "small";
  return "fail";
}
