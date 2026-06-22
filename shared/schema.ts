import { pgTable, text, integer, serial, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  language: text("language").default("en"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const updateLanguageSchema = z.object({
  language: z.enum(["en", "fr", "es"]),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jokerId: text("joker_id").notNull(),
  note: text("note"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  jokerIds: text("joker_ids").notNull(),
  notes: text("notes"),
  meta: text("meta"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const runMetaSchema = z.object({
  deckId: z.string().nullable().optional(),
  stakeId: z.string().nullable().optional(),
  voucherIds: z.array(z.string()).optional(),
});
export type RunMeta = z.infer<typeof runMetaSchema>;

export const passwordRules = [
  { id: "min", label: "At least 10 characters", test: (s: string) => s.length >= 10 },
  { id: "upper", label: "One uppercase letter", test: (s: string) => /[A-Z]/.test(s) },
  { id: "lower", label: "One lowercase letter", test: (s: string) => /[a-z]/.test(s) },
  { id: "digit", label: "One digit", test: (s: string) => /[0-9]/.test(s) },
  { id: "symbol", label: "One symbol", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
] as const;

export const strongPassword = z
  .string()
  .min(10, "Min 10 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one digit")
  .regex(/[^A-Za-z0-9]/, "At least one symbol");

export const signupSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const insertFavoriteSchema = z.object({
  jokerId: z.string().min(1),
  note: z.string().optional().nullable(),
});
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export const updateFavoriteSchema = z.object({
  note: z.string().nullable(),
});

export const insertRunSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jokerIds: z.array(z.string()),
  notes: z.string().optional().nullable(),
  meta: runMetaSchema.nullable().optional(),
});
export type InsertRun = z.infer<typeof insertRunSchema>;

export const updateRunSchema = z.object({
  name: z.string().min(1).optional(),
  jokerIds: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  meta: runMetaSchema.nullable().optional(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Run = typeof runs.$inferSelect;

export type PublicUser = { id: number; email: string; language: string };

export const _insertUserSchema = createInsertSchema(users);

