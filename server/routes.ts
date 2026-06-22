import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "node:http";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  signupSchema,
  loginSchema,
  insertFavoriteSchema,
  updateFavoriteSchema,
  insertRunSchema,
  updateRunSchema,
  updateLanguageSchema,
  type PublicUser,
  type Run,
} from "@shared/schema";

const COOKIE_NAME = "bal_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// NOTE: cookie-based sessions were removed because the deployed app runs inside
// a cross-site iframe (sites.pplx.app proxy → __PORT_5000__ origin). Modern
// browsers drop `sameSite: none; secure` cookies in that 3rd-party context,
// which dropped the session on tab change and broke login-after-signup.
// Auth now uses an in-memory Authorization: Bearer token (see client auth.tsx).
// `setSessionCookie` is kept as a no-op so existing call sites stay readable.
function setSessionCookie(_res: Response, _token: string) {
  // intentionally a no-op — see note above.
}

/**
 * Read the bearer token from the Authorization header. Falls back to the legacy
 * cookie only when the header is absent (back-compat for any in-flight clients).\
 */
function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.toLowerCase().startsWith("bearer ")) {
    const t = header.slice(7).trim();
    if (t) return t;
  }
  return req.cookies?.[COOKIE_NAME] as string | undefined;
}

function publicUser(id: number, email: string, language?: string | null): PublicUser {
  return { id, email, language: language ?? "en" };
}

function serializeRun(r: Run) {
  let meta: unknown = null;
  if (r.meta) {
    try {
      meta = JSON.parse(r.meta);
    } catch {
      meta = null;
    }
  }
  return { ...r, jokerIds: JSON.parse(r.jokerIds) as string[], meta };
}

async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  const session = await storage.getSession(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) await storage.deleteSession(token);
    return res.status(401).json({ message: "Session expired" });
  }
  req.userId = session.userId;
  next();
}

// In-memory cache for proxied joker sprites (server lifetime).
const spriteCache = new Map<string, { buf: Buffer; type: string }>();

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── Sprite proxy ──────────────────────────────────────────────────────────
  // Wikia blocks cross-origin <img> loads (returns 404 when an Origin header is
  // present). Proxy the image server-side (no Origin header) and stream it back
  // same-origin. Only allows the balatrogame wikia image host.
  app.get("/api/sprite", async (req, res) => {
    const raw = typeof req.query.url === "string" ? req.query.url : "";
    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      return res.status(400).json({ message: "Invalid url" });
    }
    if (target.hostname !== "static.wikia.nocookie.net" || !target.pathname.startsWith("/balatrogame/")) {
      return res.status(400).json({ message: "Disallowed host" });
    }
    const cached = spriteCache.get(raw);
    if (cached) {
      res.setHeader("Content-Type", cached.type);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.end(cached.buf);
    }
    try {
      const upstream = await fetch(raw, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "image/avif,image/webp,image/png,*/*",
        },
      });
      if (!upstream.ok) return res.status(502).json({ message: "Upstream error" });
      const type = upstream.headers.get("content-type") ?? "image/png";
      const buf = Buffer.from(await upstream.arrayBuffer());
      spriteCache.set(raw, { buf, type });
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.end(buf);
    } catch {
      return res.status(502).json({ message: "Fetch failed" });
    }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      // Return every failing rule so the client can surface per-rule errors.
      return res.status(400).json({
        message: parsed.error.errors[0]?.message ?? "Invalid input",
        errors: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }
    const email = parsed.data.email.toLowerCase().trim();
    if (await storage.getUserByEmail(email)) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await storage.createUser(email, passwordHash);
    const token = crypto.randomBytes(32).toString("hex");
    await storage.createSession(token, user.id, Date.now(), Date.now() + THIRTY_DAYS_MS);
    setSessionCookie(res, token);
    res.json({ user: publicUser(user.id, user.email, user.language), token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    const email = parsed.data.email.toLowerCase().trim();
    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });
    const token = crypto.randomBytes(32).toString("hex");
    await storage.createSession(token, user.id, Date.now(), Date.now() + THIRTY_DAYS_MS);
    setSessionCookie(res, token);
    res.json({ user: publicUser(user.id, user.email, user.language), token });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = extractToken(req);
    if (token) await storage.deleteSession(token);
    res.status(204).end();
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const session = await storage.getSession(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) await storage.deleteSession(token);
      return res.status(401).json({ message: "Session expired" });
    }
    const user = await storage.getUser(session.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ user: publicUser(user.id, user.email, user.language) });
  });

  // Persist the user's language preference (signed-in only).
  app.patch("/api/auth/language", requireUser, async (req, res) => {
    const parsed = updateLanguageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid language" });
    const user = await storage.updateUserLanguage(req.userId!, parsed.data.language);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user.id, user.email, user.language) });
  });

  // ── Favorites ───────────────────────────────────────────────────────────────
  app.get("/api/favorites", requireUser, async (req, res) => {
    res.json(await storage.getFavorites(req.userId!));
  });

  app.post("/api/favorites", requireUser, async (req, res) => {
    const parsed = insertFavoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const existing = await storage.getFavoriteByJoker(req.userId!, parsed.data.jokerId);
    if (existing) return res.json(existing);
    const fav = await storage.createFavorite(req.userId!, parsed.data.jokerId, parsed.data.note ?? null);
    res.json(fav);
  });

  app.patch("/api/favorites/:id", requireUser, async (req, res) => {
    const parsed = updateFavoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const id = Number(req.params.id);
    const updated = await storage.updateFavorite(id, req.userId!, parsed.data.note);
    if (!updated) return res.status(404).json({ message: "Favorite not found" });
    res.json(updated);
  });

  app.delete("/api/favorites/:id", requireUser, async (req, res) => {
    await storage.deleteFavorite(Number(req.params.id), req.userId!);
    res.status(204).end();
  });

  // ── Runs ──────────────────────────────────────────────────────────────────
  app.get("/api/runs", requireUser, async (req, res) => {
    res.json((await storage.getRuns(req.userId!)).map(serializeRun));
  });

  app.post("/api/runs", requireUser, async (req, res) => {
    const parsed = insertRunSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    const run = await storage.createRun(
      req.userId!,
      parsed.data.name,
      JSON.stringify(parsed.data.jokerIds),
      parsed.data.notes ?? null,
      parsed.data.meta ? JSON.stringify(parsed.data.meta) : null,
    );
    res.json(serializeRun(run));
  });

  app.patch("/api/runs/:id", requireUser, async (req, res) => {
    const parsed = updateRunSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const patch: Partial<{ name: string; jokerIds: string; notes: string | null; meta: string | null }> = {};
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.jokerIds !== undefined) patch.jokerIds = JSON.stringify(parsed.data.jokerIds);
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;
    if (parsed.data.meta !== undefined) patch.meta = parsed.data.meta ? JSON.stringify(parsed.data.meta) : null;
    const updated = await storage.updateRun(Number(req.params.id), req.userId!, patch);
    if (!updated) return res.status(404).json({ message: "Run not found" });
    res.json(serializeRun(updated));
  });

  app.delete("/api/runs/:id", requireUser, async (req, res) => {
    await storage.deleteRun(Number(req.params.id), req.userId!);
    res.status(204).end();
  });

  return httpServer;
}
