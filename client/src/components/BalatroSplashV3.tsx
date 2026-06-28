import { useEffect, useMemo, useState } from "react";
import "./BalatroSplashV3.css";
import { getSpriteUrl } from "@/lib/sprites";

/**
 * Balatropedia v3 splash.
 *
 * - "Balatropedia" appears letter-by-letter in the exact home-screen style
 *   (BALATRO red + PEDIA blue, blurred glow, slight rotate).
 * - Two joker "bands" emerge from the middle of the title and fly outward,
 *   then settle into the vertical home-screen conveyor positions.
 * - Smooth fade into the home page.
 */

const TITLE_RED = "Balatro";
const TITLE_BLUE = "pedia";

// A handful of joker IDs to show drifting up the bands.
// (Use existing sprite pipeline — getSpriteUrl resolves on its own.)
const BAND_JOKERS_LEFT = [
  "joker", "greedy_joker", "lusty_joker", "wrathful_joker",
  "gluttonous_joker", "jolly_joker", "zany_joker", "mad_joker",
];
const BAND_JOKERS_RIGHT = [
  "crazy_joker", "droll_joker", "sly_joker", "wily_joker",
  "clever_joker", "devious_joker", "crafty_joker", "half_joker",
];

export function BalatroSplashV3() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    // Letters fully out around ~2.2s, bands settle ~2.6s, then linger then fade.
    const tFadeStart = setTimeout(() => setPhase("out"), 3200);
    const tGone = setTimeout(() => setPhase("gone"), 4000);
    return () => {
      clearTimeout(tFadeStart);
      clearTimeout(tGone);
    };
  }, []);

  const letters = useMemo(() => {
    const all = [
      ...TITLE_RED.split("").map((c) => ({ ch: c, color: "red" as const })),
      ...TITLE_BLUE.split("").map((c) => ({ ch: c, color: "blue" as const })),
    ];
    return all;
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`balatro-splash-v3 ${phase === "out" ? "splash-fade-out" : ""}`}>
      {/* Animated blurred red+blue blob bg */}
      <div className="splash-blob splash-blob-red-1" />
      <div className="splash-blob splash-blob-red-2" />
      <div className="splash-blob splash-blob-blue-1" />
      <div className="splash-blob splash-blob-blue-2" />
      <div className="splash-blob splash-blob-red-3" />
      <div className="splash-blob splash-blob-blue-3" />

      {/* Vignette + noise on top of the blobs */}
      <div className="splash-vignette" />
      <div className="splash-noise" />

      {/* Joker bands — emerge from the middle and fly to the sides */}
      <div className="splash-band splash-band-left">
        <div className="splash-band-track">
          {BAND_JOKERS_LEFT.concat(BAND_JOKERS_LEFT).map((id, i) => {
            const url = getSpriteUrl(id);
            if (!url) return null;
            return (
              <div className="splash-band-cell" key={`l-${i}-${id}`}>
                <img
                  src={url}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="splash-band splash-band-right">
        <div className="splash-band-track">
          {BAND_JOKERS_RIGHT.concat(BAND_JOKERS_RIGHT).map((id, i) => {
            const url = getSpriteUrl(id);
            if (!url) return null;
            return (
              <div className="splash-band-cell" key={`r-${i}-${id}`}>
                <img
                  src={url}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Title — letter-by-letter; same big "Balatropedia" style as home */}
      <div className="balatro-splash-v3-title">
        {letters.map((l, i) => (
          <span
            key={i}
            className={`splash-letter splash-letter-${l.color}`}
            style={{ animationDelay: `${0.13 * i}s` }}
            data-text={l.ch}
          >
            {l.ch}
          </span>
        ))}
      </div>
    </div>
  );
}
