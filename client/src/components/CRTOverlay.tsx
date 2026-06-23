import { useCRT } from "@/lib/crt";

/**
 * Global CRT overlay. Rendered as a fixed, pointer-events:none layer that sits
 * on top of the entire viewport. Visibility & intensity driven by useCRT state.
 *
 * Layers (from back to front):
 *   - vignette + barrel-distortion shadow (corner darkening, rounded corners)
 *   - subpixel RGB stripe (very faint)
 *   - horizontal scanlines
 *   - slow rolling scanline (flicker line)
 *
 * All scale with --crt-strength (0..1) set on <html>.
 */
export function CRTOverlay() {
  const { enabled } = useCRT();
  if (!enabled) return null;

  return (
    <div className="crt-overlay" aria-hidden="true" data-testid="crt-overlay">
      <div className="crt-rgb" />
      <div className="crt-scanlines" />
      <div className="crt-roll" />
      <div className="crt-vignette" />
    </div>
  );
}
