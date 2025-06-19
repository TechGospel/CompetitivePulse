import { users, competitors, pricingData, type User, type InsertUser, type Competitor, type InsertCompetitor, type PricingData, type InsertPricingData } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastActive(id: number): Promise<void>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  getAllCompetitors(): Promise<Competitor[]>;
  getCompetitor(id: number): Promise<Competitor | undefined>;
  createCompetitor(competitor: InsertCompetitor, createdBy: number): Promise<Competitor>;
  updateCompetitor(id: number, updates: Partial<InsertCompetitor>): Promise<Competitor | undefined>;
  deleteCompetitor(id: number): Promise<void>;

  createPricingData(data: InsertPricingData): Promise<PricingData>;
  getPricingDataByCompetitor(competitorId: number, limit?: number): Promise<PricingData[]>;
  getRecentPricingTrends(days: number): Promise<any[]>;

  getDashboardMetrics(): Promise<{
    totalCompetitors: number;
    avgPrice: number;
    marketShare: number;
    trendScore: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLastActive(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCompetitors(): Promise<Competitor[]> {
    return await db.select().from(competitors).orderBy(desc(competitors.updatedAt));
  }

  async getCompetitor(id: number): Promise<Competitor | undefined> {
    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, id));
    return competitor || undefined;
  }

  async createCompetitor(competitor: InsertCompetitor, createdBy: number): Promise<Competitor> {
    const [newCompetitor] = await db
      .insert(competitors)
      .values({ ...competitor, createdBy })
      .returning();
    return newCompetitor;
  }

  async updateCompetitor(id: number, updates: Partial<InsertCompetitor>): Promise<Competitor | undefined> {
    const [competitor] = await db
      .update(competitors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(competitors.id, id))
      .returning();
    return competitor || undefined;
  }

  async deleteCompetitor(id: number): Promise<void> {
    // Delete related pricing data first
    await db.delete(pricingData).where(eq(pricingData.competitorId, id));
    // Then delete the competitor
    await db.delete(competitors).where(eq(competitors.id, id));
  }

  async createPricingData(data: InsertPricingData): Promise<PricingData> {
    const [pricing] = await db
      .insert(pricingData)
      .values(data)
      .returning();
    return pricing;
  }

  async getPricingDataByCompetitor(competitorId: number, limit = 30): Promise<PricingData[]> {
    return await db
      .select()
      .from(pricingData)
      .where(eq(pricingData.competitorId, competitorId))
      .orderBy(desc(pricingData.recordedAt))
      .limit(limit);
  }

  async getRecentPricingTrends(days: number): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select({
        date: sql<string>`DATE(${pricingData.recordedAt})`,
        avgPrice: sql<number>`AVG(${pricingData.price})::numeric`,
      })
      .from(pricingData)
      .where(gte(pricingData.recordedAt, cutoffDate))
      .groupBy(sql`DATE(${pricingData.recordedAt})`)
      .orderBy(sql`DATE(${pricingData.recordedAt})`);
  }

  async getDashboardMetrics(): Promise<{
    totalCompetitors: number;
    avgPrice: number;
    marketShare: number;
    trendScore: number;
  }> {
    const [competitorCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(competitors);

    const [avgPriceResult] = await db
      .select({ 
        avgPrice: sql<number>`AVG((${competitors.priceRangeMin} + ${competitors.priceRangeMax}) / 2)::numeric` 
      })
      .from(competitors);

    const [marketShareResult] = await db
      .select({ 
        totalShare: sql<number>`SUM(${competitors.marketShare})::numeric` 
      })
      .from(competitors);

    // Calculate a simple trend score based on growing vs declining competitors
    const [trendResult] = await db
      .select({
        growing: sql<number>`COUNT(CASE WHEN ${competitors.trendStatus} = 'growing' THEN 1 END)::int`,
        declining: sql<number>`COUNT(CASE WHEN ${competitors.trendStatus} = 'declining' THEN 1 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(competitors);

    const trendScore = trendResult.total > 0 
      ? ((trendResult.growing - trendResult.declining) / trendResult.total * 5) + 5
      : 5;

    return {
      totalCompetitors: competitorCount.count || 0,
      avgPrice: Number(avgPriceResult.avgPrice) || 0,
      marketShare: Number(marketShareResult.totalShare) || 0,
      trendScore: Math.max(0, Math.min(10, Number(trendScore.toFixed(1)))),
    };
  }
}

export const storage = new DatabaseStorage();
