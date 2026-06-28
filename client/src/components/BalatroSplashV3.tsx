import { useEffect, useState } from "react";
import "./BalatroSplashV3.css";

/**
 * Balatropedia v3 splash screen.
 * - Animated radial-red background (matches PoC v3 palette)
 * - Per-letter rainbow on "BALATROPEDIA", staggered drop-in
 * - m6x11plus pixel font
 * - 1500ms visible, then fades out
 *
 * Mounted once at app start. Auto-removes after fade.
 */
export function BalatroSplashV3() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1500);
    const t2 = setTimeout(() => setPhase("gone"), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  const title = "BALATROPEDIA";
  // Per-letter color cycle: red, gold, blue alternating for that Balatro feel
  const colors = [
    "#f44b3c", // red
    "#f7d24e", // gold
    "#6cb4ff", // blue
    "#2ed573", // green
    "#ff6b9d", // pink
    "#ffa502", // orange
    "#5352ed", // purple
    "#f44b3c",
    "#f7d24e",
    "#6cb4ff",
    "#2ed573",
    "#ffa502",
  ];

  return (
    <div className={`balatro-splash-v3 ${phase === "out" ? "splash-fade-out" : ""}`}>
      <div className="balatro-splash-v3-bg" />
      <div className="balatro-splash-v3-noise" />
      <div className="balatro-splash-v3-title">
        {title.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              color: colors[i % colors.length],
              animationDelay: `${i * 60}ms`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
      <div className="balatro-splash-v3-sub">THE UNOFFICIAL BALATRO REFERENCE</div>
    </div>
  );
}
