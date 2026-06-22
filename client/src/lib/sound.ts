// Balatro-style SFX, fully synthesized via the Web Audio API.
// No external assets (cannot redistribute the game audio). Each sound is
// designed to evoke a specific Balatro moment by stacking multi-layer
// envelopes, noise bursts, FM, and chip-like clacks.
//
// 24 distinct sounds, all genuinely different waveforms/envelopes/timbres
// (NOT pitch-shifted variants of the same recipe):
//
//   click        snappy tactile chip-tap (default UI click)
//   click_alt    softer paper-stack click (for secondary UI)
//   hover        airy pixel tick (no fatigue on rapid hover)
//   chip         chunky chip-on-felt (body + clack overtones)
//   chip_stack   2-chip stack landing (two staggered clacks)
//   flip         card-flip swoosh (filtered noise + tone glide)
//   shuffle      multi-card riffle (long noise wash)
//   deal         single card-deal whoosh (short noise + pop)
//   toggle       UI confirm two-step ding (rising)
//   toggle_off   UI cancel two-step ding (falling)
//   coin         ka-ching, money/economy gained
//   coin_lose    descending coin clink, money lost
//   joker        joker trigger riff (4-note flourish)
//   joker_evil   minor-mode flourish (debuffed/eraser)
//   scoring      chip scoring tick (used per-chip pop)
//   xmult        XMult trigger (fast vibrato xWhirl)
//   win          rising major triad fanfare
//   lose         muted negative blip
//   seal_gold    golden seal sparkle (high-freq shimmer)
//   seal_red     red seal stamp (low thunk)
//   tarot        tarot card whoosh (filtered noise + chord)
//   planet       planet level-up hum (rising sine sweep)
//   spectral     spectral card hiss (FM dissonance)
//   error        soft error buzz (sawtooth bite)
//
// State persists in localStorage when available; otherwise in memory only.

export type SoundName =
  | "click" | "click_alt" | "hover" | "chip" | "chip_stack" | "flip"
  | "shuffle" | "deal" | "toggle" | "toggle_off" | "coin" | "coin_lose"
  | "joker" | "joker_evil" | "scoring" | "xmult" | "win" | "lose"
  | "seal_gold" | "seal_red" | "tarot" | "planet" | "spectral" | "error";

const STORAGE_KEY_ENABLED = "balatro_sound_enabled";
const STORAGE_KEY_VOLUME = "balatro_sound_volume";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;
let volume = 0.6; // 0..1 master volume scalar (multiplied with per-tone gain)

// Persistence (best-effort; sandboxed iframes block localStorage)
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const e = window.localStorage.getItem(STORAGE_KEY_ENABLED);
    if (e === "0") enabled = false;
    const v = window.localStorage.getItem(STORAGE_KEY_VOLUME);
    if (v !== null) {
      const n = parseFloat(v);
      if (!Number.isNaN(n) && n >= 0 && n <= 1) volume = n;
    }
  }
} catch { /* ignore */ }

function persist(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch { /* sandbox blocks storage */ }
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(audioCtx.destination);
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ── Primitives ──────────────────────────────────────────────────────────────

function envelopedTone(
  ac: AudioContext,
  destination: AudioNode,
  freqStart: number,
  freqEnd: number | null,
  duration: number,
  type: OscillatorType,
  peak: number,
  startOffset = 0,
  attack = 0.005,
) {
  const now = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== null && freqEnd > 0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Quick band-passed noise burst, backbone of "chip clack" and "shuffle". */
function noiseBurst(
  ac: AudioContext,
  destination: AudioNode,
  duration: number,
  peak: number,
  filterFreq: number,
  filterQ = 4,
  startOffset = 0,
  filterType: BiquadFilterType = "bandpass",
) {
  const now = ac.currentTime + startOffset;
  const len = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(now);
  src.stop(now + duration + 0.02);
}

/** FM-modulated tone for richer timbres (xmult, spectral). */
function fmTone(
  ac: AudioContext,
  destination: AudioNode,
  carrierFreq: number,
  modulatorFreq: number,
  modulatorDepth: number,
  duration: number,
  peak: number,
  startOffset = 0,
) {
  const now = ac.currentTime + startOffset;
  const carrier = ac.createOscillator();
  const modulator = ac.createOscillator();
  const modGain = ac.createGain();
  const outGain = ac.createGain();
  carrier.frequency.value = carrierFreq;
  modulator.frequency.value = modulatorFreq;
  modGain.gain.value = modulatorDepth;
  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  outGain.gain.setValueAtTime(0, now);
  outGain.gain.linearRampToValueAtTime(peak, now + 0.005);
  outGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  carrier.connect(outGain);
  outGain.connect(destination);
  carrier.start(now);
  modulator.start(now);
  carrier.stop(now + duration + 0.05);
  modulator.stop(now + duration + 0.05);
}

// ── Public API ──────────────────────────────────────────────────────────────

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ac = ctx();
  if (!ac || !masterGain) return;
  const out = masterGain;

  switch (name) {
    case "click":
      envelopedTone(ac, out, 520, 360, 0.05, "square", 0.10);
      envelopedTone(ac, out, 280, 220, 0.04, "square", 0.06, 0.025);
      break;

    case "click_alt":
      // Softer paper-stack click, lower body
      envelopedTone(ac, out, 320, 240, 0.06, "triangle", 0.07);
      noiseBurst(ac, out, 0.03, 0.04, 1200, 2);
      break;

    case "hover":
      envelopedTone(ac, out, 920, null, 0.022, "sine", 0.045);
      break;

    case "chip":
      noiseBurst(ac, out, 0.06, 0.10, 2200, 3);
      envelopedTone(ac, out, 180, 110, 0.10, "triangle", 0.10);
      envelopedTone(ac, out, 1400, 900, 0.04, "square", 0.05, 0.005);
      break;

    case "chip_stack":
      // Two staggered chip clacks, simulating chip-on-chip landing
      noiseBurst(ac, out, 0.05, 0.09, 2400, 3);
      envelopedTone(ac, out, 200, 130, 0.08, "triangle", 0.09);
      noiseBurst(ac, out, 0.05, 0.07, 1800, 3, 0.07);
      envelopedTone(ac, out, 160, 100, 0.08, "triangle", 0.08, 0.07);
      break;

    case "flip":
      noiseBurst(ac, out, 0.08, 0.07, 3400, 1.5);
      envelopedTone(ac, out, 380, 720, 0.08, "triangle", 0.06);
      break;

    case "shuffle":
      // Multi-card riffle: layered noise washes at different filter freqs
      noiseBurst(ac, out, 0.18, 0.09, 1400, 2);
      noiseBurst(ac, out, 0.14, 0.07, 2600, 2, 0.05);
      noiseBurst(ac, out, 0.12, 0.06, 3800, 2, 0.10);
      break;

    case "deal":
      // Single card-deal: short noise puff + tonal pop
      noiseBurst(ac, out, 0.05, 0.08, 2800, 1.5);
      envelopedTone(ac, out, 600, 420, 0.05, "triangle", 0.05, 0.005);
      break;

    case "toggle":
      envelopedTone(ac, out, 660, null, 0.04, "square", 0.07);
      envelopedTone(ac, out, 990, null, 0.06, "square", 0.07, 0.04);
      break;

    case "toggle_off":
      // Inverse: high then low
      envelopedTone(ac, out, 880, null, 0.04, "square", 0.07);
      envelopedTone(ac, out, 520, null, 0.06, "square", 0.07, 0.04);
      break;

    case "coin":
      envelopedTone(ac, out, 1400, 1900, 0.06, "square", 0.08);
      envelopedTone(ac, out, 2100, 2600, 0.07, "square", 0.07, 0.04);
      envelopedTone(ac, out, 1800, 1500, 0.10, "sine", 0.05, 0.08);
      noiseBurst(ac, out, 0.05, 0.04, 4800, 4);
      break;

    case "coin_lose":
      // Descending coin clink
      envelopedTone(ac, out, 1800, 1300, 0.08, "square", 0.07);
      envelopedTone(ac, out, 1200, 800, 0.10, "square", 0.06, 0.05);
      noiseBurst(ac, out, 0.04, 0.03, 3200, 4, 0.02);
      break;

    case "joker":
      envelopedTone(ac, out, 440, null, 0.08, "square", 0.09);
      envelopedTone(ac, out, 660, null, 0.08, "square", 0.09, 0.08);
      envelopedTone(ac, out, 880, null, 0.08, "square", 0.09, 0.16);
      envelopedTone(ac, out, 1175, null, 0.12, "square", 0.09, 0.24);
      break;

    case "joker_evil":
      // Minor-mode 4-note descent for debuff/eraser triggers
      envelopedTone(ac, out, 440, null, 0.10, "sawtooth", 0.08);
      envelopedTone(ac, out, 415, null, 0.10, "sawtooth", 0.08, 0.09);
      envelopedTone(ac, out, 370, null, 0.10, "sawtooth", 0.08, 0.18);
      envelopedTone(ac, out, 311, null, 0.18, "sawtooth", 0.08, 0.27);
      break;

    case "scoring":
      // Quick rising chip pop, designed to be played per-chip in a burst
      envelopedTone(ac, out, 880, 1320, 0.05, "square", 0.06);
      break;

    case "xmult":
      // FM whirl evoking xMult trigger
      fmTone(ac, out, 660, 880, 240, 0.18, 0.08);
      envelopedTone(ac, out, 1320, 1760, 0.12, "triangle", 0.05, 0.06);
      break;

    case "win":
      envelopedTone(ac, out, 523, null, 0.18, "triangle", 0.10);
      envelopedTone(ac, out, 659, null, 0.18, "triangle", 0.10, 0.09);
      envelopedTone(ac, out, 784, null, 0.22, "triangle", 0.10, 0.18);
      envelopedTone(ac, out, 1047, null, 0.30, "square", 0.08, 0.30);
      break;

    case "lose":
      envelopedTone(ac, out, 320, 180, 0.18, "sawtooth", 0.10);
      envelopedTone(ac, out, 240, 140, 0.20, "sawtooth", 0.08, 0.06);
      break;

    case "seal_gold":
      // High-freq shimmer + bell
      envelopedTone(ac, out, 2200, 2800, 0.10, "sine", 0.06);
      envelopedTone(ac, out, 3200, 4200, 0.08, "sine", 0.04, 0.03);
      noiseBurst(ac, out, 0.08, 0.03, 6000, 6, 0.04, "highpass");
      break;

    case "seal_red":
      // Low thunk stamp
      envelopedTone(ac, out, 110, 70, 0.18, "sine", 0.12);
      noiseBurst(ac, out, 0.06, 0.06, 600, 2);
      break;

    case "tarot":
      // Chord whoosh
      noiseBurst(ac, out, 0.12, 0.05, 1800, 1.2);
      envelopedTone(ac, out, 440, null, 0.18, "triangle", 0.05);
      envelopedTone(ac, out, 554, null, 0.18, "triangle", 0.05);
      envelopedTone(ac, out, 659, null, 0.18, "triangle", 0.05);
      break;

    case "planet":
      // Rising sine hum, level-up feel
      envelopedTone(ac, out, 220, 440, 0.32, "sine", 0.09);
      envelopedTone(ac, out, 330, 660, 0.28, "sine", 0.05, 0.05);
      break;

    case "spectral":
      // FM dissonance, ghostly
      fmTone(ac, out, 330, 467, 180, 0.30, 0.07);
      noiseBurst(ac, out, 0.20, 0.03, 800, 1, 0.05, "lowpass");
      break;

    case "error":
      // Soft sawtooth buzz, brief
      envelopedTone(ac, out, 220, 180, 0.10, "sawtooth", 0.10);
      envelopedTone(ac, out, 165, 130, 0.10, "sawtooth", 0.08, 0.05);
      break;
  }
}

/**
 * Picks a random sound from a small bucket. Cycles through variant SFX so
 * UI interactions feel lively instead of repeating the same chirp every time.
 */
export function playRandom(names: SoundName[]) {
  if (names.length === 0) return;
  const pick = names[Math.floor(Math.random() * names.length)];
  playSound(pick);
}

export function isSoundEnabled(): boolean { return enabled; }

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (v) playSound("toggle");
  persist(STORAGE_KEY_ENABLED, v ? "1" : "0");
}

export function getSoundVolume(): number { return volume; }

export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = volume;
  persist(STORAGE_KEY_VOLUME, String(volume));
}
