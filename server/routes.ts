import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCompetitorSchema, insertPricingDataSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Middleware to check analyst or admin role
  const requireAnalystOrAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !["admin", "analyst"].includes(req.user.role)) {
      return res.status(403).json({ message: "Analyst or Admin access required" });
    }
    next();
  };

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Pricing trends data
  app.get("/api/dashboard/pricing-trends", requireAuth, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 180;
      const trends = await storage.getRecentPricingTrends(days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching pricing trends:", error);
      res.status(500).json({ message: "Failed to fetch pricing trends" });
    }
  });

  // Competitors CRUD
  app.get("/api/competitors", requireAuth, async (req, res) => {
    try {
      const competitors = await storage.getAllCompetitors();
      res.json(competitors);
    } catch (error) {
      console.error("Error fetching competitors:", error);
      res.status(500).json({ message: "Failed to fetch competitors" });
    }
  });

  app.post("/api/competitors", requireAnalystOrAdmin, async (req, res) => {
    try {
      const validatedData = insertCompetitorSchema.parse(req.body);
      const competitor = await storage.createCompetitor(validatedData, req.user!.id);
      res.status(201).json(competitor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid competitor data", errors: error.errors });
      }
      console.error("Error creating competitor:", error);
      res.status(500).json({ message: "Failed to create competitor" });
    }
  });

  app.put("/api/competitors/:id", requireAnalystOrAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCompetitorSchema.partial().parse(req.body);
      const competitor = await storage.updateCompetitor(id, validatedData);
      
      if (!competitor) {
        return res.status(404).json({ message: "Competitor not found" });
      }
      
      res.json(competitor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid competitor data", errors: error.errors });
      }
      console.error("Error updating competitor:", error);
      res.status(500).json({ message: "Failed to update competitor" });
    }
  });

  app.delete("/api/competitors/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompetitor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting competitor:", error);
      res.status(500).json({ message: "Failed to delete competitor" });
    }
  });

  // Pricing data
  app.post("/api/pricing-data", requireAnalystOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPricingDataSchema.parse(req.body);
      const pricingData = await storage.createPricingData(validatedData);
      res.status(201).json(pricingData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pricing data", errors: error.errors });
      }
      console.error("Error creating pricing data:", error);
      res.status(500).json({ message: "Failed to create pricing data" });
    }
  });

  app.get("/api/pricing-data/competitor/:id", requireAuth, async (req, res) => {
    try {
      const competitorId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 30;
      const pricingData = await storage.getPricingDataByCompetitor(competitorId, limit);
      res.json(pricingData);
    } catch (error) {
      console.error("Error fetching pricing data:", error);
      res.status(500).json({ message: "Failed to fetch pricing data" });
    }
  });

  // User management (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = insertUserSchema.partial().omit({ password: true });
      const validatedData = updateSchema.parse(req.body);
      
      const user = await storage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
