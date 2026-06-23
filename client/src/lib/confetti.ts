// Lightweight DOM-only confetti for one-off celebratory bursts.
// No deps. Uses CSS keyframes (confettiFall) declared in index.css.
//
// Usage: burstConfetti({ count: 80 })
//   or:  burstConfetti({ count: 30, originX: 50, originY: 50 })

const COLORS = [
  "hsl(0 70% 60%)",     // mult red
  "hsl(200 60% 60%)",   // chip blue
  "hsl(45 85% 60%)",    // gold
  "hsl(145 50% 55%)",   // money green
  "hsl(270 55% 65%)",   // spectral purple
];

const SHAPES = ["♠", "♥", "♦", "♣", "★"];

interface BurstOptions {
  count?: number;
  originX?: number; // 0-100 vw
  originY?: number; // 0-100 vh
  duration?: number; // ms
  useSuits?: boolean;
}

export function burstConfetti(opts: BurstOptions = {}) {
  const {
    count = 60,
    originX = 50,
    originY = 0,
    duration = 2400,
    useSuits = true,
  } = opts;

  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Respect motion preference (shake-strength = 0 disables shakes app-wide)
  const shake = document.documentElement.getAttribute("data-shake");
  if (shake === "off") return;

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const xVw = originX + (Math.random() - 0.5) * 40;
    const yVh = originY + (Math.random() - 0.5) * 10;
    const drift = (Math.random() - 0.5) * 240;
    const fall = duration + Math.random() * 1200;
    const useSuit = useSuits && Math.random() < 0.45;

    piece.style.left = `${xVw}vw`;
    piece.style.top = `${yVh}vh`;
    piece.style.setProperty("--x", "0px");
    piece.style.setProperty("--drift", `${drift}px`);
    piece.style.setProperty("--fall", `${fall}ms`);

    if (useSuit) {
      piece.style.width = "auto";
      piece.style.height = "auto";
      piece.style.fontSize = `${14 + Math.random() * 18}px`;
      piece.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.textShadow = "0 1px 0 rgba(0,0,0,0.5)";
      piece.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    } else {
      const w = 6 + Math.random() * 6;
      const h = w * (1.2 + Math.random() * 0.8);
      piece.style.width = `${w}px`;
      piece.style.height = `${h}px`;
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      piece.style.borderRadius = Math.random() < 0.4 ? "9999px" : "1px";
    }

    container.appendChild(piece);
  }

  // Clean up after the longest possible animation
  window.setTimeout(() => {
    container.remove();
  }, duration + 1800);
}
