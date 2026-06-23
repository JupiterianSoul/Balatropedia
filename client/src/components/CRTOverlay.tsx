import { useCRT } from "@/lib/crt";

/**
 * Global CRT overlay. Rendered as a fixed, pointer-events:none layer that sits
 * on top of the entire viewport. Visibility & intensity driven by useCRT state.
 *
 * v1.4.1 optimization: the three static layers (scanlines + RGB stripe + vignette)
 * are merged into a single .crt-static div using stacked background-images with
 * tiny 3px tiled gradients. This is ~100x cheaper than viewport-spanning
 * repeating-linear-gradients and removes mix-blend-mode (which forced an
 * isolated stacking context every frame). Only .crt-roll is animated.
 *
 * All scale with --crt-strength (0..1) set on <html>.
 */
export function CRTOverlay() {
  const { enabled } = useCRT();
  if (!enabled) return null;

  return (
    <div className="crt-overlay" aria-hidden="true" data-testid="crt-overlay">
      <div className="crt-static" />
      <div className="crt-roll" />
    </div>
  );
}
