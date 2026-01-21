import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInteractionSchema, insertAdjusterSchema, insertDocumentSchema, insertClaimSchema, insertAttachmentSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);
  
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
      const documents = await storage.getDocumentsByAdjuster(adjuster.id);

      res.json({
        ...adjuster,
        claims,
        interactions,
        documents
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

  // Create document for adjuster
  app.post("/api/adjusters/:id/documents", async (req, res) => {
    try {
      const validationResult = insertDocumentSchema.safeParse({
        adjusterId: req.params.id,
        ...req.body
      });

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const document = await storage.createDocument(validationResult.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Get all claims
  app.get("/api/claims", async (_req, res) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Get claim by ID with linked adjusters and interactions
  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      const adjusters = await storage.getAdjustersByClaimId(claim.id);
      const interactions = await storage.getInteractionsByClaimId(claim.id);
      res.json({ ...claim, adjusters, interactions });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // Create claim
  app.post("/api/claims", async (req, res) => {
    try {
      const validationResult = insertClaimSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }
      const claim = await storage.createClaim(validationResult.data);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  // Update claim
  app.patch("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.updateClaim(req.params.id, req.body);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ error: "Failed to update claim" });
    }
  });

  // Link adjuster to claim
  app.post("/api/claims/:id/adjusters", async (req, res) => {
    try {
      const { adjusterId } = req.body;
      if (!adjusterId) {
        return res.status(400).json({ error: "adjusterId is required" });
      }
      const link = await storage.linkAdjusterToClaim(req.params.id, adjusterId);
      res.status(201).json(link);
    } catch (error) {
      console.error("Error linking adjuster to claim:", error);
      res.status(500).json({ error: "Failed to link adjuster to claim" });
    }
  });

  // Get attachments for a claim
  app.get("/api/claims/:id/attachments", async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByClaimId(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  // Create attachment for a claim
  app.post("/api/claims/:id/attachments", async (req, res) => {
    try {
      const data = { ...req.body, claimId: req.params.id };
      
      // Validate type
      if (!['file', 'email'].includes(data.type)) {
        return res.status(400).json({ error: "Type must be 'file' or 'email'" });
      }
      
      // Validate required fields based on type
      if (data.type === 'file') {
        if (!data.objectPath || !data.filename) {
          return res.status(400).json({ error: "File attachments require objectPath and filename" });
        }
      } else if (data.type === 'email') {
        if (!data.subject || !data.body) {
          return res.status(400).json({ error: "Email attachments require subject and body" });
        }
        if (!['sent', 'received'].includes(data.direction)) {
          return res.status(400).json({ error: "Email direction must be 'sent' or 'received'" });
        }
      }
      
      const validationResult = insertAttachmentSchema.safeParse(data);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }
      const attachment = await storage.createAttachment(validationResult.data);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ error: "Failed to create attachment" });
    }
  });

  // Get single attachment
  app.get("/api/attachments/:id", async (req, res) => {
    try {
      const attachment = await storage.getAttachment(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      res.json(attachment);
    } catch (error) {
      console.error("Error fetching attachment:", error);
      res.status(500).json({ error: "Failed to fetch attachment" });
    }
  });

  // Delete attachment
  app.delete("/api/attachments/:id", async (req, res) => {
    try {
      await storage.deleteAttachment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  return httpServer;
}
