import OpenAI from "openai";
import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { format } from "date-fns";
import { ObjectStorageService } from "../object_storage";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const objectStorageService = new ObjectStorageService();

interface ExtractedData {
  adjusterName?: string | null;
  adjusterEmail?: string | null;
  adjusterPhone?: string | null;
  carrier?: string | null;
  claimId?: string | null;
  dateOfLoss?: string | null;
  propertyAddress?: string | null;
  homeownerName?: string | null;
  interactionType?: string | null;
  interactionDate?: string | null;
  interactionDescription?: string | null;
  interactionOutcome?: string | null;
  internalNotes?: string | null;
  riskImpression?: string | null;
  whatWorked?: string | null;
  claimNotes?: string | null;
  estimateAmount?: string | null;
  documentSummary?: string | null;
}

async function getFileBuffer(objectPath: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType || 'application/octet-stream';
    
    const chunks: Buffer[] = [];
    const stream = file.createReadStream();
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, mimeType });
      });
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error fetching file from object storage:', error);
    return null;
  }
}

async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  const tempDir = os.tmpdir();
  const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
  const MAX_PAGES = 20;
  
  try {
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    const options = {
      density: 150,
      saveFilename: `page_${Date.now()}`,
      savePath: tempDir,
      format: "png",
      width: 1200,
      height: 1600,
    };
    
    const convert = fromPath(tempPdfPath, options);
    const images: string[] = [];
    
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const result = await convert(page, { responseType: "base64" });
        if (result.base64) {
          images.push(result.base64);
        }
      } catch (e) {
        break;
      }
    }
    
    return images;
  } finally {
    try {
      fs.unlinkSync(tempPdfPath);
    } catch (e) {}
  }
}

async function getDocumentContent(objectPath: string): Promise<{ images: Array<{ base64: string; mimeType: string }>; isPdf: boolean } | null> {
  const fileData = await getFileBuffer(objectPath);
  if (!fileData) return null;
  
  const { buffer, mimeType } = fileData;
  
  if (mimeType === 'application/pdf' || objectPath.toLowerCase().endsWith('.pdf')) {
    const pdfImages = await convertPdfToImages(buffer);
    if (pdfImages.length === 0) {
      return null;
    }
    return {
      images: pdfImages.map(b64 => ({ base64: b64, mimeType: 'image/png' })),
      isPdf: true,
    };
  }
  
  if (mimeType.startsWith('image/')) {
    return {
      images: [{ base64: buffer.toString('base64'), mimeType }],
      isPdf: false,
    };
  }
  
  return {
    images: [{ base64: buffer.toString('base64'), mimeType: 'image/png' }],
    isPdf: false,
  };
}

const systemPrompt = `You are an expert insurance claims analyst. Analyze the provided document and extract relevant information.

Extract the following information if present:
- Adjuster name, email, phone, company/carrier
- Claim ID or reference number (look for claim numbers, estimate numbers, policy numbers)
- Date of loss
- Property address
- Homeowner/insured name
- Any interactions (calls, emails, inspections) with dates
- Key observations about adjuster behavior
- Claim amounts, estimates, deductibles
- Any notes about what worked or didn't work in negotiations
- A brief summary of what this document is about

Return a JSON object with these fields (use null for missing data):
{
  "adjusterName": string or null,
  "adjusterEmail": string or null,
  "adjusterPhone": string or null,
  "carrier": string or null,
  "claimId": string or null,
  "dateOfLoss": string (YYYY-MM-DD format) or null,
  "propertyAddress": string or null,
  "homeownerName": string or null,
  "interactionType": "Call" | "Email" | "Inspection" | "Reinspection" | "Escalation" | "Estimate" | "Letter" | "Other" or null,
  "interactionDate": string (YYYY-MM-DD format) or null,
  "interactionDescription": string or null,
  "interactionOutcome": string or null,
  "internalNotes": string (observations about adjuster or document) or null,
  "riskImpression": string (assessment of adjuster difficulty) or null,
  "whatWorked": string (successful strategies) or null,
  "claimNotes": string (summary of claim details) or null,
  "estimateAmount": string or null,
  "documentSummary": string (brief 1-2 sentence description of the document) or null
}`;

export function registerDocumentAnalysisRoutes(app: Express): void {
  app.post("/api/analyze-document", async (req: Request, res: Response) => {
    try {
      const { documentUrl, documentName } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ error: "Document URL is required" });
      }

      const docContent = await getDocumentContent(documentUrl);
      if (!docContent || docContent.images.length === 0) {
        return res.status(400).json({ error: "Could not fetch or convert document" });
      }

      const imageContent = docContent.images.map(img => ({
        type: "image_url" as const,
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this document "${documentName || 'document'}" and extract all relevant insurance claim information.${docContent.isPdf ? ' This is a multi-page PDF document.' : ''}`,
              },
              ...imageContent,
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const extracted: ExtractedData = JSON.parse(content);

      res.json({
        success: true,
        extracted,
        message: "Document analyzed successfully",
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  app.post("/api/analyze-and-save", async (req: Request, res: Response) => {
    try {
      const { documentUrl, documentName, adjusterId, claimId } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ error: "Document URL is required" });
      }

      const docContent = await getDocumentContent(documentUrl);
      if (!docContent || docContent.images.length === 0) {
        return res.status(400).json({ error: "Could not fetch or convert document" });
      }

      const imageContent = docContent.images.map(img => ({
        type: "image_url" as const,
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this document "${documentName || 'document'}" and extract all relevant insurance claim information.${docContent.isPdf ? ' This is a multi-page PDF document.' : ''}`,
              },
              ...imageContent,
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const extracted: ExtractedData = JSON.parse(content);

      const savedItems: string[] = [];
      let targetAdjusterId = adjusterId;
      let targetClaimId = claimId;

      if (!targetAdjusterId && extracted.adjusterName && extracted.carrier) {
        const newAdjuster = await storage.createAdjuster({
          name: extracted.adjusterName,
          carrier: extracted.carrier,
          email: extracted.adjusterEmail || undefined,
          phone: extracted.adjusterPhone || undefined,
          internalNotes: extracted.internalNotes || undefined,
          riskImpression: extracted.riskImpression || undefined,
          whatWorked: extracted.whatWorked || undefined,
        });
        targetAdjusterId = newAdjuster.id;
        savedItems.push(`new adjuster: ${extracted.adjusterName}`);
      }

      if (!targetClaimId && extracted.claimId && extracted.carrier && extracted.dateOfLoss) {
        const newClaim = await storage.createClaim({
          maskedId: extracted.claimId,
          carrier: extracted.carrier,
          dateOfLoss: extracted.dateOfLoss,
          homeownerName: extracted.homeownerName || undefined,
          propertyAddress: extracted.propertyAddress || undefined,
          notes: extracted.claimNotes || undefined,
          status: 'open',
        });
        targetClaimId = newClaim.id;
        savedItems.push(`new claim: ${extracted.claimId}`);

        if (targetAdjusterId) {
          await storage.linkAdjusterToClaim(targetClaimId, targetAdjusterId);
          savedItems.push('linked adjuster to claim');
        }
      }

      if (targetAdjusterId) {
        const interactionDesc = extracted.interactionDescription || extracted.documentSummary || 
          `Document analyzed: ${documentName || 'uploaded document'}${extracted.estimateAmount ? ` - Estimate: ${extracted.estimateAmount}` : ''}`;
        
        await storage.createInteraction({
          adjusterId: targetAdjusterId,
          date: extracted.interactionDate || format(new Date(), 'yyyy-MM-dd'),
          type: extracted.interactionType || 'Other',
          description: interactionDesc,
          outcome: extracted.interactionOutcome || extracted.claimNotes || null,
          claimId: extracted.claimId || targetClaimId || null,
        });
        savedItems.push('interaction log');

        const updates: Record<string, string> = {};
        if (extracted.internalNotes) updates.internalNotes = extracted.internalNotes;
        if (extracted.riskImpression) updates.riskImpression = extracted.riskImpression;
        if (extracted.whatWorked) updates.whatWorked = extracted.whatWorked;
        if (extracted.adjusterPhone) updates.phone = extracted.adjusterPhone;
        if (extracted.adjusterEmail) updates.email = extracted.adjusterEmail;

        if (Object.keys(updates).length > 0) {
          await storage.updateAdjuster(targetAdjusterId, updates);
          savedItems.push('adjuster profile updated');
        }
      }

      if (targetClaimId && extracted.claimNotes) {
        await storage.updateClaim(targetClaimId, {
          notes: extracted.claimNotes,
          homeownerName: extracted.homeownerName || undefined,
          propertyAddress: extracted.propertyAddress || undefined,
        });
        savedItems.push('claim details updated');
      }

      res.json({
        success: true,
        extracted,
        savedItems,
        createdAdjusterId: !adjusterId && targetAdjusterId !== adjusterId ? targetAdjusterId : undefined,
        createdClaimId: !claimId && targetClaimId !== claimId ? targetClaimId : undefined,
        message: savedItems.length > 0 
          ? `Analyzed and saved: ${savedItems.join(', ')}` 
          : 'Document analyzed but no new data to save',
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });
}
