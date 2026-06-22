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
import {
  authLimiter,
  readLimiter,
  writeLimiter,
  spriteLimiter,
  LRUCache,
  MAX_RUNS_PER_USER,
  MAX_FAVORITES_PER_USER,
  BCRYPT_ROUNDS,
} from "./security";

const COOKIE_NAME = "bal_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

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
  let jokerIds: string[] = [];
  try {
    const parsed = JSON.parse(r.jokerIds);
    if (Array.isArray(parsed)) jokerIds = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    jokerIds = [];
  }
  return { ...r, jokerIds, meta };
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

const spriteCache = new LRUCache<string, { buf: Buffer; type: string }>(500);

const SESSION_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastSessionCleanup = 0;
async function maybeCleanupSessions() {
  const now = Date.now();
  if (now - lastSessionCleanup < SESSION_CLEANUP_INTERVAL_MS) return;
  lastSessionCleanup = now;
  try {
    await storage.deleteExpiredSessions(now);
  } catch (e) {
    console.error("[session cleanup]", (e as Error).message);
  }
}

export async function registerRoutes(_httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/api/sprite", spriteLimiter, async (req, res) => {
    const raw = typeof req.query.url === "string" ? req.query.url : "";
    if (raw.length > 500) return res.status(400).json({ message: "URL too long" });
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
        signal: AbortSignal.timeout(8000),
      });
      if (!upstream.ok) return res.status(502).json({ message: "Upstream error" });
      const type = upstream.headers.get("content-type") ?? "image/png";
      const contentLength = Number(upstream.headers.get("content-length") || "0");
      if (contentLength > 5_000_000) return res.status(413).json({ message: "Sprite too large" });
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.length > 5_000_000) return res.status(413).json({ message: "Sprite too large" });
      spriteCache.set(raw, { buf, type });
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.end(buf);
    } catch {
      return res.status(502).json({ message: "Fetch failed" });
    }
  });

  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.errors[0]?.message ?? "Invalid input",
        errors: parsed.error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      });
    }
    const email = parsed.data.email.toLowerCase().trim();
    if (await storage.getUserByEmail(email)) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
    const user = await storage.createUser(email, passwordHash);
    const token = crypto.randomBytes(32).toString("hex");
    await storage.createSession(token, user.id, Date.now(), Date.now() + THIRTY_DAYS_MS);
    res.json({ user: publicUser(user.id, user.email, user.language), token });
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    const email = parsed.data.email.toLowerCase().trim();
    const user = await storage.getUserByEmail(email);
    if (!user) {
      await bcrypt.compare(parsed.data.password, "$2a$08$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });
    const token = crypto.randomBytes(32).toString("hex");
    await storage.createSession(token, user.id, Date.now(), Date.now() + THIRTY_DAYS_MS);
    res.json({ user: publicUser(user.id, user.email, user.language), token });
  });

  app.post("/api/auth/logout", writeLimiter, async (req, res) => {
    const token = extractToken(req);
    if (token) await storage.deleteSession(token);
    res.status(204).end();
  });

  app.get("/api/auth/me", readLimiter, async (req, res) => {
    maybeCleanupSessions();
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

  app.patch("/api/auth/language", writeLimiter, requireUser, async (req, res) => {
    const parsed = updateLanguageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid language" });
    const user = await storage.updateUserLanguage(req.userId!, parsed.data.language);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user.id, user.email, user.language) });
  });

  app.get("/api/favorites", readLimiter, requireUser, async (req, res) => {
    res.json(await storage.getFavorites(req.userId!));
  });

  app.post("/api/favorites", writeLimiter, requireUser, async (req, res) => {
    const parsed = insertFavoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const existing = await storage.getFavoriteByJoker(req.userId!, parsed.data.jokerId);
    if (existing) return res.json(existing);
    const total = await storage.countFavorites(req.userId!);
    if (total >= MAX_FAVORITES_PER_USER) {
      return res.status(409).json({ message: `Favorite limit reached (${MAX_FAVORITES_PER_USER}).` });
    }
    const fav = await storage.createFavorite(req.userId!, parsed.data.jokerId, parsed.data.note ?? null);
    res.json(fav);
  });

  app.patch("/api/favorites/:id", writeLimiter, requireUser, async (req, res) => {
    const parsed = updateFavoriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
    const updated = await storage.updateFavorite(id, req.userId!, parsed.data.note);
    if (!updated) return res.status(404).json({ message: "Favorite not found" });
    res.json(updated);
  });

  app.delete("/api/favorites/:id", writeLimiter, requireUser, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteFavorite(id, req.userId!);
    res.status(204).end();
  });

  app.get("/api/runs", readLimiter, requireUser, async (req, res) => {
    res.json((await storage.getRuns(req.userId!)).map(serializeRun));
  });

  app.post("/api/runs", writeLimiter, requireUser, async (req, res) => {
    const parsed = insertRunSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Invalid input" });
    const total = await storage.countRuns(req.userId!);
    if (total >= MAX_RUNS_PER_USER) {
      return res.status(409).json({ message: `Run limit reached (${MAX_RUNS_PER_USER}).` });
    }
    const run = await storage.createRun(
      req.userId!,
      parsed.data.name,
      JSON.stringify(parsed.data.jokerIds),
      parsed.data.notes ?? null,
      parsed.data.meta ? JSON.stringify(parsed.data.meta) : null,
    );
    res.json(serializeRun(run));
  });

  app.patch("/api/runs/:id", writeLimiter, requireUser, async (req, res) => {
    const parsed = updateRunSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
    const patch: Partial<{ name: string; jokerIds: string; notes: string | null; meta: string | null }> = {};
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.jokerIds !== undefined) patch.jokerIds = JSON.stringify(parsed.data.jokerIds);
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;
    if (parsed.data.meta !== undefined) patch.meta = parsed.data.meta ? JSON.stringify(parsed.data.meta) : null;
    const updated = await storage.updateRun(id, req.userId!, patch);
    if (!updated) return res.status(404).json({ message: "Run not found" });
    res.json(serializeRun(updated));
  });

  app.delete("/api/runs/:id", writeLimiter, requireUser, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteRun(id, req.userId!);
    res.status(204).end();
  });

  return _httpServer;
}
