import { users, sessions, favorites, runs } from "@shared/schema";
import type { User, Session, Favorite, Run } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, lt, count } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (Neon connection string).");
}
const client = neon(process.env.DATABASE_URL);
export const db = drizzle(client);

async function bootstrap() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      created_at BIGINT NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      joker_id TEXT NOT NULL,
      note TEXT,
      created_at BIGINT NOT NULL
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS runs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      joker_ids TEXT NOT NULL,
      notes TEXT,
      meta TEXT,
      created_at BIGINT NOT NULL
    )
  `);
}

bootstrap().catch((e) => console.error("[bootstrap] failed", e));

export interface IStorage {

  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
  updateUserLanguage(id: number, language: string): Promise<User | undefined>;

  createSession(token: string, userId: number, createdAt: number, expiresAt: number): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;

  getFavorites(userId: number): Promise<Favorite[]>;
  getFavorite(id: number, userId: number): Promise<Favorite | undefined>;
  getFavoriteByJoker(userId: number, jokerId: string): Promise<Favorite | undefined>;
  createFavorite(userId: number, jokerId: string, note: string | null): Promise<Favorite>;
  updateFavorite(id: number, userId: number, note: string | null): Promise<Favorite | undefined>;
  deleteFavorite(id: number, userId: number): Promise<void>;

  countFavorites(userId: number): Promise<number>;

  getRuns(userId: number): Promise<Run[]>;
  getRun(id: number, userId: number): Promise<Run | undefined>;
  countRuns(userId: number): Promise<number>;

  deleteExpiredSessions(now: number): Promise<void>;
  createRun(userId: number, name: string, jokerIds: string, notes: string | null, meta: string | null): Promise<Run>;
  updateRun(id: number, userId: number, patch: Partial<{ name: string; jokerIds: string; notes: string | null; meta: string | null }>): Promise<Run | undefined>;
  deleteRun(id: number, userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  }
  async createUser(email: string, passwordHash: string): Promise<User> {
    const rows = await db
      .insert(users)
      .values({ email, passwordHash, language: "en", createdAt: Date.now() })
      .returning();
    return rows[0];
  }
  async updateUserLanguage(id: number, language: string): Promise<User | undefined> {
    await db.update(users).set({ language }).where(eq(users.id, id));
    return this.getUser(id);
  }

  async createSession(token: string, userId: number, createdAt: number, expiresAt: number): Promise<Session> {
    const rows = await db.insert(sessions).values({ token, userId, createdAt, expiresAt }).returning();
    return rows[0];
  }
  async getSession(token: string): Promise<Session | undefined> {
    const rows = await db.select().from(sessions).where(eq(sessions.token, token));
    return rows[0];
  }
  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async getFavorites(userId: number): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }
  async getFavorite(id: number, userId: number): Promise<Favorite | undefined> {
    const rows = await db.select().from(favorites).where(and(eq(favorites.id, id), eq(favorites.userId, userId)));
    return rows[0];
  }
  async getFavoriteByJoker(userId: number, jokerId: string): Promise<Favorite | undefined> {
    const rows = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.jokerId, jokerId)));
    return rows[0];
  }
  async createFavorite(userId: number, jokerId: string, note: string | null): Promise<Favorite> {
    const rows = await db
      .insert(favorites)
      .values({ userId, jokerId, note, createdAt: Date.now() })
      .returning();
    return rows[0];
  }
  async updateFavorite(id: number, userId: number, note: string | null): Promise<Favorite | undefined> {
    await db.update(favorites).set({ note }).where(and(eq(favorites.id, id), eq(favorites.userId, userId)));
    return this.getFavorite(id, userId);
  }
  async deleteFavorite(id: number, userId: number): Promise<void> {
    await db.delete(favorites).where(and(eq(favorites.id, id), eq(favorites.userId, userId)));
  }
  async countFavorites(userId: number): Promise<number> {
    const rows = await db.select({ c: count() }).from(favorites).where(eq(favorites.userId, userId));
    return Number(rows[0]?.c ?? 0);
  }

  async getRuns(userId: number): Promise<Run[]> {
    return db.select().from(runs).where(eq(runs.userId, userId)).orderBy(desc(runs.createdAt));
  }
  async getRun(id: number, userId: number): Promise<Run | undefined> {
    const rows = await db.select().from(runs).where(and(eq(runs.id, id), eq(runs.userId, userId)));
    return rows[0];
  }
  async createRun(userId: number, name: string, jokerIds: string, notes: string | null, meta: string | null): Promise<Run> {
    const rows = await db
      .insert(runs)
      .values({ userId, name, jokerIds, notes, meta, createdAt: Date.now() })
      .returning();
    return rows[0];
  }
  async updateRun(
    id: number,
    userId: number,
    patch: Partial<{ name: string; jokerIds: string; notes: string | null; meta: string | null }>,
  ): Promise<Run | undefined> {
    if (Object.keys(patch).length > 0) {
      await db.update(runs).set(patch).where(and(eq(runs.id, id), eq(runs.userId, userId)));
    }
    return this.getRun(id, userId);
  }
  async deleteRun(id: number, userId: number): Promise<void> {
    await db.delete(runs).where(and(eq(runs.id, id), eq(runs.userId, userId)));
  }
  async countRuns(userId: number): Promise<number> {
    const rows = await db.select({ c: count() }).from(runs).where(eq(runs.userId, userId));
    return Number(rows[0]?.c ?? 0);
  }

  async deleteExpiredSessions(now: number): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, now));
  }
}

export const storage = new DatabaseStorage();

