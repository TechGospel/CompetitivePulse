import { pgTable, text, serial, integer, boolean, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "analyst", "viewer"]);
export const trendStatusEnum = pgEnum("trend_status", ["growing", "declining", "stable"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const competitors = pgTable("competitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  priceRangeMin: decimal("price_range_min", { precision: 10, scale: 2 }).notNull(),
  priceRangeMax: decimal("price_range_max", { precision: 10, scale: 2 }).notNull(),
  marketShare: decimal("market_share", { precision: 5, scale: 2 }).notNull(),
  trendStatus: trendStatusEnum("trend_status").notNull().default("stable"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const pricingData = pgTable("pricing_data", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").references(() => competitors.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [competitors.createdBy],
    references: [users.id],
  }),
  pricingData: many(pricingData),
}));

export const pricingDataRelations = relations(pricingData, ({ one }) => ({
  competitor: one(competitors, {
    fields: [pricingData.competitorId],
    references: [competitors.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  competitors: many(competitors),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

export const insertCompetitorSchema = createInsertSchema(competitors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const insertPricingDataSchema = createInsertSchema(pricingData).omit({
  id: true,
  recordedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type Competitor = typeof competitors.$inferSelect;
export type InsertPricingData = z.infer<typeof insertPricingDataSchema>;
export type PricingData = typeof pricingData.$inferSelect;
