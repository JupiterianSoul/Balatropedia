import { useEffect, useState } from "react";
import "./BalatroSplashV3.css";

/**
 * Balatropedia v3 splash.
 * - BALATRO in red, PEDIA in blue
 * - Animated blurred red+blue blob background (no joker sprites)
 * - Smooth fade into the home page
 */
export function BalatroSplashV3() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1700);
    const t2 = setTimeout(() => setPhase("gone"), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`balatro-splash-v3 ${phase === "out" ? "splash-fade-out" : ""}`}>
      {/* Animated blurred blob background — red + blue */}
      <div className="splash-blob splash-blob-red-1" />
      <div className="splash-blob splash-blob-red-2" />
      <div className="splash-blob splash-blob-blue-1" />
      <div className="splash-blob splash-blob-blue-2" />
      <div className="splash-blob splash-blob-red-3" />
      <div className="splash-blob splash-blob-blue-3" />

      {/* Vignette + noise on top of the blobs */}
      <div className="splash-vignette" />
      <div className="splash-noise" />

      {/* Title */}
      <div className="balatro-splash-v3-title">
        <span className="splash-word splash-word-red" data-text="BALATRO">BALATRO</span>
        <span className="splash-word splash-word-blue" data-text="PEDIA">PEDIA</span>
      </div>
      <div className="balatro-splash-v3-sub">THE UNOFFICIAL BALATRO REFERENCE</div>
    </div>
  );
}
