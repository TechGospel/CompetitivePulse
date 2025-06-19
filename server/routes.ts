import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendTemporaryPasswordEmail } from "./email";
import { insertCompetitorSchema, insertPricingDataSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const tempPassword = generateTemporaryPassword();
      const validatedData = insertUserSchema.parse({
        ...req.body,
        password: tempPassword
      });
      
      const hashedPassword = await hashPassword(tempPassword);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Send temporary password email
      try {
        await sendTemporaryPasswordEmail(user.email, user.name || user.username, tempPassword);
      } catch (emailError) {
        console.error("Failed to send temporary password email:", emailError);
        // Continue with user creation even if email fails
      }

      // Remove password from response
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
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

  // Bulk upload endpoint (admin and analyst only)
  app.post("/api/bulk-upload", requireAnalystOrAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { type } = req.body;
      const filePath = req.file.path;
      
      // Read and parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "File must contain at least headers and one data row" });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1);
      
      let recordsProcessed = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const values = dataRows[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
          });

          if (type === 'competitors') {
            const competitorData = {
              name: rowData.name,
              category: rowData.industry || rowData.category || 'Technology',
              priceRangeMin: rowData.price_range_min || '0.00',
              priceRangeMax: rowData.price_range_max || '100.00',
              marketShare: rowData.market_share || '0.00',
              trendStatus: (rowData.trend_status as 'growing' | 'declining' | 'stable') || 'stable'
            };
            await storage.createCompetitor(competitorData, req.user!.id);
            recordsProcessed++;
          } else if (type === 'pricing') {
            // Find competitor by name
            const competitors = await storage.getAllCompetitors();
            const competitor = competitors.find(c => c.name.toLowerCase() === rowData.competitor?.toLowerCase());
            
            if (competitor) {
              const pricingData = {
                competitorId: competitor.id,
                price: (parseFloat(rowData.price) || 0).toString()
              };
              await storage.createPricingData(pricingData);
              recordsProcessed++;
            } else {
              errors.push(`Row ${i + 2}: Competitor "${rowData.competitor}" not found`);
            }
          }
        } catch (rowError) {
          errors.push(`Row ${i + 2}: ${(rowError as Error).message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        recordsProcessed,
        totalRows: dataRows.length,
        errors: errors.slice(0, 10), // Limit errors returned
        success: true
      });

    } catch (error) {
      console.error("Error processing bulk upload:", error);
      // Clean up file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Failed to cleanup file:", cleanupError);
        }
      }
      res.status(500).json({ message: "Failed to process upload" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
