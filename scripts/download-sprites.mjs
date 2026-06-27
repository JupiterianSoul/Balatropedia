#!/usr/bin/env node
/**
 * Downloads every Wikia sprite referenced by the app into client/public/sprites/
 * so the Capacitor APK can ship them and serve them with zero network.
 *
 * After running: bundle size grows by ~5–15 MB (PNGs are small).
 * The sprite URL helpers (`client/src/lib/sprites.ts`, `phase3Sprites.ts`) read
 * a generated manifest so the runtime can still look up by id.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "client", "public", "sprites");
const MANIFEST_PATH = path.join(ROOT, "client", "src", "data", "local_sprites.json");

const LOGO_URL =
  "https://static.wikia.nocookie.net/balatrogame/images/e/ef/Joker.png/revision/latest";

function filenameFor(url) {
  // Build a stable filename from the Wikia path so collisions across categories don't happen.
  const u = new URL(url);
  // /balatrogame/images/c/ca/Abstract_Joker.png/revision/latest -> Abstract_Joker__c_ca.png
  const m = u.pathname.match(/\/images\/([^/]+)\/([^/]+)\/([^/]+\.(png|gif|webp|jpg|jpeg))/i);
  if (m) {
    const [, a, b, name, ext] = m;
    const base = name.replace(new RegExp(`\\.${ext}$`, "i"), "");
    return `${base}__${a}_${b}.${ext.toLowerCase()}`;
  }
  return u.pathname.split("/").filter(Boolean).pop() || `sprite_${Date.now()}.png`;
}

async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Balatropedia sprite bundler)",
          Accept: "image/avif,image/webp,image/png,*/*",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const jokerSprites = JSON.parse(
    await readFile(path.join(ROOT, "client", "src", "data", "joker_sprites.json"), "utf8"),
  );
  const phase3Sprites = JSON.parse(
    await readFile(path.join(ROOT, "client", "src", "data", "phase3", "sprites.json"), "utf8"),
  );

  // url -> local filename
  const urlToFile = new Map();

  function register(url) {
    if (!url) return;
    if (urlToFile.has(url)) return;
    urlToFile.set(url, filenameFor(url));
  }

  register(LOGO_URL);
  for (const url of Object.values(jokerSprites)) register(url);
  for (const cat of Object.values(phase3Sprites)) {
    for (const url of Object.values(cat)) register(url);
  }

  console.log(`Downloading ${urlToFile.size} sprites...`);
  let done = 0;
  let failed = 0;
  const queue = [...urlToFile.entries()];
  const CONCURRENCY = 8;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const [url, name] = queue.shift();
        const outPath = path.join(OUT_DIR, name);
        if (existsSync(outPath)) {
          done++;
          continue;
        }
        try {
          const buf = await fetchWithRetry(url);
          await writeFile(outPath, buf);
          done++;
          if (done % 25 === 0) console.log(`  ${done}/${urlToFile.size}`);
        } catch (e) {
          failed++;
          console.warn(`  FAIL ${url}: ${e.message}`);
        }
      }
    }),
  );
  console.log(`Downloaded ${done}, failed ${failed}.`);

  const manifest = {
    logo: urlToFile.get(LOGO_URL),
    jokers: Object.fromEntries(
      Object.entries(jokerSprites).map(([id, url]) => [id, urlToFile.get(url)]),
    ),
    phase3: Object.fromEntries(
      Object.entries(phase3Sprites).map(([cat, mp]) => [
        cat,
        Object.fromEntries(Object.entries(mp).map(([id, url]) => [id, urlToFile.get(url)])),
      ]),
    ),
  };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest: ${MANIFEST_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
