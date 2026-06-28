// Detect what kind of device we're running on, so the Seed Finder can
// pick a sensible default "Search speed" tier instead of always offering
// the same options to everyone.
//
// What we can actually probe from the browser:
//   navigator.hardwareConcurrency  — logical core count. Most useful.
//   navigator.userAgentData.mobile — Chromium only; reliable mobile flag.
//   /Mobi|iPhone|iPad|Android/.test(ua) — fallback for everything else.
//   navigator.deviceMemory         — Chromium only, rounded GB.
//   WebAssembly.validate(SIMD probe) — already detected by the worker.
//
// What we can't probe (and don't):
//   - Battery state (browsers restricted this).
//   - Whether the user is on AC vs battery.
//   - Actual CPU model or clock speed.
//   - Whether other apps are pinning the CPU.

export type DeviceClass =
  | "mobile-low"      // phone, ≤4 logical cores (older phone, budget Android)
  | "mobile-mid"      // phone, 6-8 logical cores (modern flagship)
  | "desktop-low"     // laptop/PC, ≤4 cores (old laptop, low-power ultrabook)
  | "desktop-mid"     // laptop/PC, 6-12 cores (typical modern laptop)
  | "desktop-high"    // PC, 16-23 cores (modern desktop, mid threadripper)
  | "desktop-extreme" // PC, 24+ cores (workstation, dual-CPU, top threadripper)
  | "unknown";

export interface DeviceProfile {
  /** Logical-core count, as reported by navigator.hardwareConcurrency. */
  cores: number;
  /** Whether the device looks like a phone/tablet. */
  mobile: boolean;
  /** RAM in GB if available (Chromium only), otherwise null. */
  ramGb: number | null;
  /** Coarse classification used to pick the default speed tier. */
  deviceClass: DeviceClass;
  /** Human label shown in the UI ("8-core laptop", "iPhone", etc.). */
  label: string;
  /** Recommended thread count for this device. */
  recommendedThreads: number;
  /** Tier key matching SpeedSelect ("eco" | "low" | ... | "extreme"). */
  recommendedTier: "eco" | "low" | "medium" | "high" | "max" | "extreme";
}

function isMobile(): boolean {
  // Modern Chromium / Edge — most reliable.
  const uaData = (navigator as any).userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile;
  // Safari / Firefox fallback.
  const ua = navigator.userAgent || "";
  return /Mobi|iPhone|iPad|iPod|Android/i.test(ua);
}

function ramGbOrNull(): number | null {
  const dm = (navigator as any).deviceMemory;
  return typeof dm === "number" ? dm : null;
}

function classify(cores: number, mobile: boolean): DeviceClass {
  if (mobile) {
    if (cores <= 4) return "mobile-low";
    return "mobile-mid";
  }
  if (cores <= 4) return "desktop-low";
  if (cores <= 12) return "desktop-mid";
  if (cores <= 23) return "desktop-high";
  return "desktop-extreme";
}

function recommendFor(cls: DeviceClass, cores: number): { tier: DeviceProfile["recommendedTier"]; threads: number } {
  // Default policy: leave 1-2 cores for the OS / UI on smaller devices,
  // oversubscribe lightly on bigger ones.
  switch (cls) {
    case "mobile-low":
      return { tier: "eco", threads: 1 };
    case "mobile-mid":
      return { tier: "low", threads: 2 };
    case "desktop-low":
      return { tier: "medium", threads: 4 };
    case "desktop-mid":
      // Use all cores but cap at 8 — that's "High" tier on most laptops.
      return { tier: "high", threads: Math.max(4, Math.min(8, cores)) };
    case "desktop-high":
      // 16-core PC: oversubscribe 2× to get every IPC cycle out of it.
      return { tier: "max", threads: Math.max(12, Math.min(32, cores * 2)) };
    case "desktop-extreme":
      // 24+ core workstation: go to Extreme. Cap at 32 (our hard cap).
      return { tier: "extreme", threads: Math.min(32, cores) };
    default:
      return { tier: "medium", threads: 4 };
  }
}

function labelFor(cores: number, mobile: boolean): string {
  if (mobile) {
    if (cores <= 4) return `Phone · ${cores}-core`;
    return `Phone · ${cores}-core (high-end)`;
  }
  if (cores <= 4) return `Laptop · ${cores}-core`;
  if (cores <= 12) return `Laptop / PC · ${cores}-core`;
  if (cores <= 23) return `Desktop · ${cores}-core`;
  return `Workstation · ${cores}-core`;
}

let cached: DeviceProfile | null = null;

export function detectDeviceProfile(): DeviceProfile {
  if (cached) return cached;
  if (typeof navigator === "undefined") {
    cached = {
      cores: 4, mobile: false, ramGb: null,
      deviceClass: "unknown", label: "Unknown device",
      recommendedThreads: 4, recommendedTier: "medium",
    };
    return cached;
  }
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = isMobile();
  const ramGb = ramGbOrNull();
  const deviceClass = classify(cores, mobile);
  const { tier, threads } = recommendFor(deviceClass, cores);
  const label = labelFor(cores, mobile);
  cached = {
    cores, mobile, ramGb, deviceClass, label,
    recommendedThreads: threads, recommendedTier: tier,
  };
  return cached;
}
