// Balatro-style sound effects using Web Audio API
// Synthesized in-browser — no external assets, no licensing concerns.
// Inspired by the chunky, chip-like SFX in the original Lua game.

type SoundName = "click" | "hover" | "chip" | "flip" | "toggle";

const STORAGE_KEY = "balatro_sound_enabled";

let audioCtx: AudioContext | null = null;
let enabled = true;

// Read persisted preference (use sessionStorage fallback already set in memory)
if (typeof window !== "undefined") {
  // We can't use localStorage in sandboxed iframes — keep state in module memory only.
  // The toggle button still works for the duration of the session.
  enabled = true;
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.08,
  freqEnd?: number,
) {
  const ac = ctx();
  if (!ac || !enabled) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  switch (name) {
    case "click":
      // Sharp chip-stack click
      tone(520, 0.06, "square", 0.08, 380);
      setTimeout(() => tone(280, 0.04, "square", 0.05), 30);
      break;
    case "hover":
      // Soft tick
      tone(880, 0.025, "sine", 0.04);
      break;
    case "chip":
      // Coin / chip ka-ching
      tone(1200, 0.05, "square", 0.06, 1600);
      setTimeout(() => tone(1800, 0.05, "square", 0.05, 2200), 25);
      break;
    case "flip":
      // Card flip swoosh
      tone(420, 0.08, "triangle", 0.07, 720);
      break;
    case "toggle":
      // UI confirm
      tone(660, 0.04, "square", 0.06);
      setTimeout(() => tone(990, 0.06, "square", 0.06), 30);
      break;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (v) playSound("toggle");
  // Best-effort persist (no-op in sandboxed iframes)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    }
  } catch {
    /* sandbox blocks storage — ignore */
  }
}

// Restore preference from localStorage if available (outside iframe)
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "0") enabled = false;
  }
} catch {
  /* ignore */
}
