import { useCRT } from "@/lib/crt";

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
