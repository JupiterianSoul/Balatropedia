/**
 * Client-only build for the Capacitor Android app.
 *
 * Sets VITE_APP_MODE=local so the client compiles with:
 *   - localAdapter intercepting every /api/* call
 *   - sprite helpers serving bundled PNGs from ./sprites/
 *
 * No server bundle, no Express. The Vite output (dist/public) is what
 * Capacitor copies into the Android project via `npx cap sync`.
 */
import { build as viteBuild } from "vite";
import { rm } from "node:fs/promises";

async function buildApp() {
  process.env.VITE_APP_MODE = "local";
  await rm("dist/public", { recursive: true, force: true });
  console.log("Building Balatropedia client in LOCAL (offline) mode...");
  await viteBuild();
  console.log("Done. Next: npx cap sync android");
}

buildApp().catch((err) => {
  console.error(err);
  process.exit(1);
});
