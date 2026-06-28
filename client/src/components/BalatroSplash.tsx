/**
 * BalatroSplash — animated card-letter splash screen shown once per app session.
 *
 * Shows on first mount, covers viewport (position fixed inset-0 z-50).
 * Each letter of "BALATROPEDIA" flies in as a stylised card from a random
 * off-screen position, lands with a spring, then the whole splash fades out.
 *
 * Only shown once per session (sessionStorage key "balatropedia.splash.shown.v1").
 * After fade-out it dispatches "balatropedia:splash-done" and calls onDone?.
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const LETTERS = ["B", "A", "L", "A", "T", "R", "O", "P", "E", "D", "I", "A"];
const SESSION_KEY = "balatropedia.splash.shown.v1";
const STAGGER_MS = 60;
const HOLD_MS = 200;
const FADE_MS = 300;

interface LetterCardProps {
  letter: string;
  index: number;
  total: number;
}

function LetterCard({ letter, index, total: _total }: LetterCardProps) {
  // Seeded random-ish values per letter (stable between renders)
  const offsetY = ((index * 137) % 400) - 200; // -200..+200
  const rotation = ((index * 73) % 60) - 30;   // -30..+30deg

  return (
    <motion.div
      initial={{ y: offsetY, rotate: rotation, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      transition={{
        delay: index * (STAGGER_MS / 1000),
        type: "spring",
        stiffness: 260,
        damping: 22,
        opacity: { duration: 0.15, delay: index * (STAGGER_MS / 1000) },
      }}
      style={{
        width: 36,
        height: 52,
        background: "white",
        border: "2px solid black",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "2px 2px 0 #000",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "m6x11plus, monospace",
          fontSize: 22,
          fontWeight: "bold",
          color: "hsl(var(--bal-block-back, 192 9% 13%))",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {letter}
      </span>
    </motion.div>
  );
}

interface BalatroSplashProps {
  onDone?: () => void;
}

export function BalatroSplash({ onDone }: BalatroSplashProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only show once per session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        onDone?.();
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (private mode etc.) — skip splash
      onDone?.();
      return;
    }

    setVisible(true);

    // Total animation: stagger * (n-1) + spring settle ~600ms + hold
    const animDuration = STAGGER_MS * (LETTERS.length - 1) + 900 + HOLD_MS;
    timerRef.current = setTimeout(() => {
      setFading(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        try {
          window.dispatchEvent(new CustomEvent("balatropedia:splash-done"));
        } catch {}
        onDone?.();
      }, FADE_MS);
    }, animDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1416",
        opacity: fading ? 0 : 1,
        transition: fading ? `opacity ${FADE_MS}ms ease-out` : undefined,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
          maxWidth: "90vw",
          padding: "0 16px",
        }}
      >
        {LETTERS.map((letter, i) => (
          <LetterCard key={`${letter}-${i}`} letter={letter} index={i} total={LETTERS.length} />
        ))}
      </div>
    </div>
  );
}
