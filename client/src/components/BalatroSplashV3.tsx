import { useEffect, useState } from "react";
import "./BalatroSplashV3.css";

/**
 * Balatropedia v3 splash screen.
 * - Animated radial-red background (matches PoC v3 palette)
 * - Two-tone Balatro colors: alternating blue / red letters
 * - Soft blurred chromatic glow halo under each letter
 * - m6x11plus pixel font
 * - 1500ms visible, smooth 700ms cross-fade into the home page
 *
 * Mounted once at app start. Auto-removes after fade.
 */
export function BalatroSplashV3() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1500);
    const t2 = setTimeout(() => setPhase("gone"), 2250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  const title = "BALATROPEDIA";
  // Two-tone Balatro palette: blue / red alternating
  const BLUE = "#1e90ff";
  const RED = "#f44b3c";

  return (
    <div className={`balatro-splash-v3 ${phase === "out" ? "splash-fade-out" : ""}`}>
      <div className="balatro-splash-v3-bg" />
      <div className="balatro-splash-v3-noise" />
      <div className="balatro-splash-v3-title">
        {title.split("").map((ch, i) => {
          const color = i % 2 === 0 ? BLUE : RED;
          return (
            <span
              key={i}
              className="splash-letter"
              style={{
                color,
                animationDelay: `${i * 55}ms`,
              }}
              data-glow={color}
            >
              {/* Blurred halo layer beneath the crisp letter */}
              <span className="splash-letter-glow" aria-hidden="true" style={{ color }}>
                {ch}
              </span>
              <span className="splash-letter-main">{ch}</span>
            </span>
          );
        })}
      </div>
      <div className="balatro-splash-v3-sub">THE UNOFFICIAL BALATRO REFERENCE</div>
    </div>
  );
}
