/**
 * Balatro-inspired synth sound engine.
 *
 * All sounds are synthesized from scratch via Web Audio API
 * (oscillators + envelopes + filtered noise). NO external samples,
 * NO source code copied from Balatro. Inspired by the feel of the
 * game's chip/card/score sounds, but 100% original implementations.
 *
 * Honors the user toggle stored at `balatropedia.local.sounds`
 * (default "1"). When off, every function is a no-op.
 *
 * iOS / mobile: AudioContext is created lazily, and must be
 * unlocked on a user gesture — see `ensureUnlocked()` and the
 * one-shot listener installed by `installAudioUnlock()`.
 */

const STORAGE_KEY = "balatropedia.local.sounds";

let actx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;

function isEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v !== "0";
  } catch {
    return true;
  }
}

export function setSoundsEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {}
}

export function getSoundsEnabled(): boolean {
  return isEnabled();
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!actx) {
    const AC =
      (window as any).AudioContext ||
      (window as any).webkitAudioContext;
    if (!AC) return null;
    try {
      const created = new AC() as AudioContext;
      const gain = created.createGain();
      gain.gain.value = 0.85;
      gain.connect(created.destination);
      actx = created;
      masterGain = gain;
    } catch {
      return null;
    }
  }
  return actx;
}

function dst(): AudioNode | null {
  const c = ctx();
  if (!c) return null;
  return masterGain ?? c.destination;
}

/** Force the AudioContext alive (must run on user gesture on iOS). */
export function ensureUnlocked(): void {
  if (unlocked) return;
  const c = ctx();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }
  unlocked = true;
}

/** Install a one-shot listener that unlocks audio on first interaction. */
export function installAudioUnlock(): void {
  if (typeof window === "undefined") return;
  const handler = () => {
    ensureUnlocked();
  };
  window.addEventListener("pointerdown", handler, { once: true, passive: true });
  window.addEventListener("touchstart", handler, { once: true, passive: true });
  window.addEventListener("keydown", handler, { once: true });
}

function adsr(
  node: GainNode,
  t0: number,
  attack: number,
  decay: number,
  sustainLevel: number,
  release: number,
  peak: number,
): void {
  const g = node.gain;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0, t0);
  g.linearRampToValueAtTime(peak, t0 + attack);
  g.linearRampToValueAtTime(sustainLevel * peak, t0 + attack + decay);
  g.linearRampToValueAtTime(0, t0 + attack + decay + release);
}

/**
 * `chipClink` — short metallic "ping" with three triangle partials
 * (1.8/2.7/4.2 kHz) sliding down. Used on card taps / score adds.
 */
export function chipClink(): void {
  if (!isEnabled()) return;
  const c = ctx();
  const d = dst();
  if (!c || !d) return;
  const t = c.currentTime;
  [1800, 2700, 4200].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.18);
    o.connect(g);
    g.connect(d);
    adsr(g, t + i * 0.005, 0.002, 0.04, 0, 0.14, 0.12 / (i + 1));
    o.start(t);
    o.stop(t + 0.25);
  });
}

/**
 * `cardFlick` — short paper-flick: bandpass-filtered white noise
 * burst that fades out fast.
 */
export function cardFlick(): void {
  if (!isEnabled()) return;
  const c = ctx();
  const d = dst();
  if (!c || !d) return;
  const t = c.currentTime;
  const bufSize = Math.max(1, Math.floor(c.sampleRate * 0.12));
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 3500;
  filt.Q.value = 1.5;
  const g = c.createGain();
  src.connect(filt);
  filt.connect(g);
  g.connect(d);
  adsr(g, t, 0.002, 0.03, 0, 0.08, 0.18);
  src.start(t);
  src.stop(t + 0.13);
}

/**
 * `scoreWhoosh` — rising sawtooth swept through a lowpass that
 * opens up. Holo variant layers a rainbow arpeggio on top.
 */
export function scoreWhoosh(color: "gold" | "blue" | "red" | "holo" = "gold"): void {
  if (!isEnabled()) return;
  const c = ctx();
  const d = dst();
  if (!c || !d) return;
  const t = c.currentTime;
  const base =
    color === "holo" ? 200 : color === "blue" ? 320 : color === "red" ? 280 : 380;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * 4, t + 0.25);
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(800, t);
  filt.frequency.exponentialRampToValueAtTime(6000, t + 0.25);
  o.connect(filt);
  filt.connect(g);
  g.connect(d);
  adsr(g, t, 0.008, 0.06, 0.5, 0.2, 0.1);
  o.start(t);
  o.stop(t + 0.3);
  if (color === "holo") {
    [440, 554, 659, 880, 1108].forEach((f, i) => {
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = "sine";
      o2.frequency.value = f;
      o2.connect(g2);
      g2.connect(d);
      const start = t + 0.04 + i * 0.04;
      adsr(g2, start, 0.005, 0.04, 0, 0.12, 0.06);
      o2.start(start);
      o2.stop(start + 0.18);
    });
  }
}

/**
 * `uiTap` — tiny 880 → 440 Hz square chirp. Used for tab switches
 * and toggles.
 */
export function uiTap(): void {
  if (!isEnabled()) return;
  const c = ctx();
  const d = dst();
  if (!c || !d) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(440, t + 0.05);
  o.connect(g);
  g.connect(d);
  adsr(g, t, 0.001, 0.02, 0, 0.04, 0.08);
  o.start(t);
  o.stop(t + 0.08);
}

/**
 * `dealRiffle` — six staggered `cardFlick`s, simulating a deck deal.
 */
export function dealRiffle(): void {
  if (!isEnabled()) return;
  for (let i = 0; i < 6; i++) {
    window.setTimeout(cardFlick, i * 80);
  }
}

/** Brief vibration if the device supports it and reduced-motion isn't set. */
export function haptic(pattern: number | number[] = 8): void {
  if (typeof window === "undefined") return;
  try {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}
