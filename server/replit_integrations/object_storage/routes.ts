import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { randomUUID } from "crypto";

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      try {
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
        res.json({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        });
      } catch (signError) {
        const objectId = randomUUID();
        const uploadPath = `/api/uploads/proxy/${objectId}`;
        res.json({
          uploadURL: uploadPath,
          objectPath: `/objects/uploads/${objectId}`,
          useProxy: true,
          metadata: { name, size, contentType },
        });
      }
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.put("/api/uploads/proxy/:objectId", async (req, res) => {
    try {
      const { objectId } = req.params;
      const privateDir = process.env.PRIVATE_OBJECT_DIR || "";
      if (!privateDir) {
        return res.status(500).json({ error: "Storage not configured" });
      }

      const parts = privateDir.replace(/^\//, '').split('/');
      const bucketName = parts[0];
      const dirPath = parts.slice(1).join('/');
      const objectName = `${dirPath}/uploads/${objectId}`;

      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          await file.save(buffer, {
            contentType: req.headers['content-type'] || 'application/octet-stream',
          });
          res.status(200).json({ success: true, objectPath: `/objects/uploads/${objectId}` });
        } catch (saveError) {
          console.error("Error saving to object storage:", saveError);
          res.status(500).json({ error: "Failed to save file" });
        }
      });
    } catch (error) {
      console.error("Error in proxy upload:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get(/^\/objects\/(.*)$/, async (req, res) => {
    try {
      const objectPath = `/objects/${req.params[0]}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

