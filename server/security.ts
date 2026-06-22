import rateLimit from "express-rate-limit";
import type { Request } from "express";

const isProd = process.env.NODE_ENV === "production";

function keyByIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]!.trim();
  if (Array.isArray(fwd) && fwd[0]) return fwd[0]!.split(",")[0]!.trim();
  return req.ip || "unknown";
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { message: "Too many auth attempts. Try again in 15 minutes." },
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { message: "Too many requests. Slow down." },
});

export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { message: "Too many requests. Slow down." },
});

export const spriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { message: "Sprite rate limit reached." },
});

export const MAX_RUNS_PER_USER = 50;
export const MAX_FAVORITES_PER_USER = 200;
export const MAX_NOTE_LENGTH = 2000;
export const MAX_RUN_NAME_LENGTH = 80;
export const MAX_JOKERS_PER_RUN = 5;

export const BCRYPT_ROUNDS = 8;

export class LRUCache<K, V> {
  private max: number;
  private map = new Map<K, V>();
  constructor(max: number) {
    this.max = max;
  }
  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key: K, value: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
  }
  size(): number {
    return this.map.size;
  }
}

export function safeError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; statusCode?: number; message?: string };
  const status = e?.status || e?.statusCode || 500;
  if (isProd) {
    return {
      status,
      message: status >= 500 ? "Internal server error" : (e?.message || "Bad request"),
    };
  }
  return { status, message: e?.message || "Internal server error" };
}
