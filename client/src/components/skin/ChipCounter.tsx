/**
 * ChipCounter — the big blue rolling chip total, with chip icon
 * + tween animation + flash on update.
 */
import * as React from "react";
import { BalatroIcon } from "@/components/icons/BalatroIcons";
import { cn } from "@/lib/utils";

export interface ChipCounterProps {
  value: number;
  className?: string;
}

export function ChipCounter({ value, className }: ChipCounterProps): JSX.Element {
  const [displayed, setDisplayed] = React.useState(value);
  const [flash, setFlash] = React.useState(false);
  const fromRef = React.useRef(value);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = displayed;
    const to = value;
    if (from === to) return;
    fromRef.current = from;
    const t0 = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      setDisplayed(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFlash(true);
        window.setTimeout(() => setFlash(false), 320);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("bal-chip-display", className)}>
      <BalatroIcon name="chip" className="bal-chip-display-icon" />
      <div className={cn("bal-chip-display-value", flash && "bal-flash")}>
        {displayed.toLocaleString()}
      </div>
    </div>
  );
}
