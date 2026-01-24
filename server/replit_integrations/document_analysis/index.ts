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

const systemPrompt = `You are an expert insurance claims analyst. Analyze the provided document and extract ALL relevant information you can find.

IMPORTANT: Be thorough and look for information in various formats. Insurance documents come in many types:
- Xactimate estimates and reports
- Carrier correspondence and letters
- Customer copies of estimates
- Inspection reports
- Policy documents
- Emails and communications

Look for these pieces of information (they may be labeled differently):
- Claim number, claim ID, file number, reference number, estimate number, policy number
- Insurance company/carrier name (State Farm, Allstate, USAA, Farmers, etc.)
- Date of loss, loss date, incident date
- Adjuster name, field adjuster, desk adjuster
- Adjuster contact info (phone, email)
- Property address, risk location, insured location
- Homeowner/insured name, policyholder name
- Estimate amounts, RCV, ACV, deductible, total
- Any dates related to inspections, calls, or correspondence

Return a JSON object with these fields. Extract whatever you can find - use null ONLY if the information is truly not present:
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
  "internalNotes": string (observations about the document) or null,
  "riskImpression": string (any notes about claim complexity or issues) or null,
  "whatWorked": string (any negotiation notes) or null,
  "claimNotes": string (summary of key claim details, amounts, coverage) or null,
  "estimateAmount": string or null,
  "documentSummary": string (what type of document this is and its main purpose) or null
}

Be aggressive about finding data. If you see a number that could be a claim number, extract it. If you see a company logo or name, extract the carrier.`;

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

      // Limit to first 3 pages to avoid context overload
      const pagesToAnalyze = docContent.images.slice(0, 3);
      console.log(`[analyze-document] Processing ${pagesToAnalyze.length} of ${docContent.images.length} page(s), isPdf: ${docContent.isPdf}`);
      console.log(`[analyze-document] First image size: ${pagesToAnalyze[0]?.base64?.length || 0} chars`);

      const imageContent = pagesToAnalyze.map(img => ({
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
        max_completion_tokens: 8192,
      });

      const rawContent = response.choices[0]?.message?.content;
      console.log("AI raw response:", rawContent);
      console.log("AI finish reason:", response.choices[0]?.finish_reason);
      const content = rawContent || "{}";
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

      // Limit to first 3 pages to avoid context overload
      const pagesToAnalyze = docContent.images.slice(0, 3);

      const imageContent = pagesToAnalyze.map(img => ({
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
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const extracted: ExtractedData = JSON.parse(content);

      const savedItems: string[] = [];
      let targetAdjusterId = adjusterId;
      let targetClaimId = claimId;

      if (!targetAdjusterId && extracted.adjusterName && extracted.carrier) {
        // Check if adjuster already exists
        const existingAdjuster = await storage.findAdjusterByNameAndCarrier(extracted.adjusterName, extracted.carrier);
        if (existingAdjuster) {
          targetAdjusterId = existingAdjuster.id;
          savedItems.push(`found existing adjuster: ${extracted.adjusterName}`);
        } else {
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
      }

      if (!targetClaimId && extracted.claimId && extracted.carrier) {
        // Check if claim already exists by claim number
        const existingClaim = await storage.findClaimByMaskedId(extracted.claimId);
        if (existingClaim) {
          targetClaimId = existingClaim.id;
          savedItems.push(`found existing claim: ${extracted.claimId}`);
        } else if (extracted.dateOfLoss) {
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
        }

        if (targetClaimId && targetAdjusterId) {
          // Check if already linked before linking
          try {
            await storage.linkAdjusterToClaim(targetClaimId, targetAdjusterId);
            savedItems.push('linked adjuster to claim');
          } catch (e) {
            // Already linked, ignore
          }
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
