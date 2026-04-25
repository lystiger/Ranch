import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  int,
  bigint,
  timestamp,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["online", "degraded", "offline"]).notNull().default("online"),
  tokensUsed: bigint("tokens_used", { mode: "number" }).notNull().default(0),
  tokensLimit: bigint("tokens_limit", { mode: "number" }).notNull().default(0),
  latency: int("latency").notNull().default(0),
  performanceScore: int("performance_score").notNull().default(0),
  cookies: int("cookies").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

export const runs = mysqlTable("runs", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  prompt: text("prompt"),
  output: text("output"),
  tokensUsed: int("tokens_used").notNull().default(0),
  latency: int("latency").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;

export const comparisons = mysqlTable("comparisons", {
  id: serial("id").primaryKey(),
  prompt: text("prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Comparison = typeof comparisons.$inferSelect;

export const comparisonResults = mysqlTable("comparison_results", {
  id: serial("id").primaryKey(),
  comparisonId: bigint("comparison_id", { mode: "number", unsigned: true }).notNull(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  output: text("output"),
  tokensUsed: int("tokens_used").notNull().default(0),
  latency: int("latency").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ComparisonResult = typeof comparisonResults.$inferSelect;

export const ratings = mysqlTable("ratings", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  runId: bigint("run_id", { mode: "number", unsigned: true }).notNull(),
  score: int("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
