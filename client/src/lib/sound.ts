// Balatro-style SFX, fully synthesized via the Web Audio API.
// No external assets (can't redistribute the game audio) — but multi-layer
// envelopes + noise bursts get us a long way from the original "single bip".
//
// Each sound is designed to evoke a specific Balatro moment:
//   click      → snappy tactile chip-tap
//   hover      → soft pixel tick (no fatigue on rapid hover)
//   chip       → chunky chip-on-felt with body + clack overtones
//   flip       → card-flip swoosh (filtered noise + brief tone glide)
//   toggle     → UI confirm two-step ding
//   coin       → ka-ching for money/economy
//   joker      → joker trigger riff (4-note tritone-ish flourish)
//   win        → round-win fanfare (rising triad)
//   lose       → muted negative blip
//   shuffle    → quick noise wash for deck shuffle / load
//
// All sounds respect the master volume and on/off toggle.
// State persists in localStorage when available; otherwise in memory only.
// ─────────────────────────────────────────────────────────────────────────────

export type SoundName =
  | "click" | "hover" | "chip" | "flip" | "toggle"
  | "coin" | "joker" | "win" | "lose" | "shuffle";

const STORAGE_KEY_ENABLED = "balatro_sound_enabled";
const STORAGE_KEY_VOLUME = "balatro_sound_volume";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true;
let volume = 0.6; // 0..1 master volume scalar (multiplied with per-tone gain)

// ── Persistence (best-effort; sandboxed iframes block localStorage) ─────────
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
} catch {
  /* ignore */
}

function persist(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    /* sandbox blocks storage — ignore */
  }
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
  // Browsers require a user gesture before resuming.
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

/** Quick band-passed noise burst — backbone of "chip clack" and "shuffle". */
function noiseBurst(
  ac: AudioContext,
  destination: AudioNode,
  duration: number,
  peak: number,
  filterFreq: number,
  filterQ = 4,
  startOffset = 0,
) {
  const now = ac.currentTime + startOffset;
  // Generate one-shot white noise buffer
  const len = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
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

// ── Public API ──────────────────────────────────────────────────────────────

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ac = ctx();
  if (!ac || !masterGain) return;
  const out = masterGain;

  switch (name) {
    case "click":
      // Snappy two-step chip tap
      envelopedTone(ac, out, 520, 360, 0.05, "square", 0.10);
      envelopedTone(ac, out, 280, 220, 0.04, "square", 0.06, 0.025);
      break;

    case "hover":
      envelopedTone(ac, out, 920, null, 0.022, "sine", 0.045);
      break;

    case "chip":
      // Chunky chip on felt: noise clack + low body + tonal click
      noiseBurst(ac, out, 0.06, 0.10, 2200, 3);
      envelopedTone(ac, out, 180, 110, 0.10, "triangle", 0.10);
      envelopedTone(ac, out, 1400, 900, 0.04, "square", 0.05, 0.005);
      break;

    case "flip":
      // Card flip — short noise sweep + tone glide
      noiseBurst(ac, out, 0.08, 0.07, 3400, 1.5);
      envelopedTone(ac, out, 380, 720, 0.08, "triangle", 0.06);
      break;

    case "toggle":
      // Two-step rising confirm
      envelopedTone(ac, out, 660, null, 0.04, "square", 0.07);
      envelopedTone(ac, out, 990, null, 0.06, "square", 0.07, 0.04);
      break;

    case "coin":
      // Ka-ching: high-frequency bell-like overlay
      envelopedTone(ac, out, 1400, 1900, 0.06, "square", 0.08);
      envelopedTone(ac, out, 2100, 2600, 0.07, "square", 0.07, 0.04);
      envelopedTone(ac, out, 1800, 1500, 0.10, "sine", 0.05, 0.08);
      noiseBurst(ac, out, 0.05, 0.04, 4800, 4, 0.0);
      break;

    case "joker":
      // 4-note flourish (root, fifth, octave, minor seventh)
      envelopedTone(ac, out, 440, null, 0.08, "square", 0.09, 0.00);
      envelopedTone(ac, out, 660, null, 0.08, "square", 0.09, 0.08);
      envelopedTone(ac, out, 880, null, 0.08, "square", 0.09, 0.16);
      envelopedTone(ac, out, 1175, null, 0.12, "square", 0.09, 0.24);
      break;

    case "win":
      // Rising major triad fanfare
      envelopedTone(ac, out, 523, null, 0.18, "triangle", 0.10, 0.00);
      envelopedTone(ac, out, 659, null, 0.18, "triangle", 0.10, 0.09);
      envelopedTone(ac, out, 784, null, 0.22, "triangle", 0.10, 0.18);
      envelopedTone(ac, out, 1047, null, 0.30, "square", 0.08, 0.30);
      break;

    case "lose":
      // Descending minor blip
      envelopedTone(ac, out, 320, 180, 0.18, "sawtooth", 0.10);
      envelopedTone(ac, out, 240, 140, 0.20, "sawtooth", 0.08, 0.06);
      break;

    case "shuffle":
      // Two quick filtered noise washes
      noiseBurst(ac, out, 0.10, 0.10, 1600, 2);
      noiseBurst(ac, out, 0.10, 0.08, 2400, 2, 0.06);
      break;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (v) playSound("toggle");
  persist(STORAGE_KEY_ENABLED, v ? "1" : "0");
}

export function getSoundVolume(): number {
  return volume;
}

export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = volume;
  persist(STORAGE_KEY_VOLUME, String(volume));
}
