import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInteractionSchema, insertAdjusterSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all adjusters
  app.get("/api/adjusters", async (_req, res) => {
    try {
      const adjusters = await storage.getAllAdjusters();
      res.json(adjusters);
    } catch (error) {
      console.error("Error fetching adjusters:", error);
      res.status(500).json({ error: "Failed to fetch adjusters" });
    }
  });

  // Create adjuster
  app.post("/api/adjusters", async (req, res) => {
    try {
      const validationResult = insertAdjusterSchema.safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const adjuster = await storage.createAdjuster(validationResult.data);
      res.status(201).json(adjuster);
    } catch (error) {
      console.error("Error creating adjuster:", error);
      res.status(500).json({ error: "Failed to create adjuster" });
    }
  });

  // Get adjuster by ID with claims and interactions
  app.get("/api/adjusters/:id", async (req, res) => {
    try {
      const adjuster = await storage.getAdjuster(req.params.id);
      if (!adjuster) {
        return res.status(404).json({ error: "Adjuster not found" });
      }

      const claims = await storage.getClaimsByAdjuster(adjuster.id);
      const interactions = await storage.getInteractionsByAdjuster(adjuster.id);

      res.json({
        ...adjuster,
        claims,
        interactions
      });
    } catch (error) {
      console.error("Error fetching adjuster:", error);
      res.status(500).json({ error: "Failed to fetch adjuster" });
    }
  });

  // Update adjuster
  app.patch("/api/adjusters/:id", async (req, res) => {
    try {
      const adjuster = await storage.updateAdjuster(req.params.id, req.body);
      if (!adjuster) {
        return res.status(404).json({ error: "Adjuster not found" });
      }
      res.json(adjuster);
    } catch (error) {
      console.error("Error updating adjuster:", error);
      res.status(500).json({ error: "Failed to update adjuster" });
    }
  });

  // Create interaction
  app.post("/api/adjusters/:id/interactions", async (req, res) => {
    try {
      const validationResult = insertInteractionSchema.safeParse({
        adjusterId: req.params.id,
        ...req.body
      });

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const interaction = await storage.createInteraction(validationResult.data);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // Delete adjuster
  app.delete("/api/adjusters/:id", async (req, res) => {
    try {
      await storage.deleteAdjuster(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting adjuster:", error);
      res.status(500).json({ error: "Failed to delete adjuster" });
    }
  });

  return httpServer;
}
