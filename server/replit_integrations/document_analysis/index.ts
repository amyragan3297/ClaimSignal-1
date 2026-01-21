import OpenAI from "openai";
import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { format } from "date-fns";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ExtractedData {
  adjusterName?: string;
  adjusterEmail?: string;
  adjusterPhone?: string;
  carrier?: string;
  claimId?: string;
  dateOfLoss?: string;
  propertyAddress?: string;
  homeownerName?: string;
  interactionType?: string;
  interactionDate?: string;
  interactionDescription?: string;
  interactionOutcome?: string;
  internalNotes?: string;
  riskImpression?: string;
  whatWorked?: string;
  claimNotes?: string;
  estimateAmount?: string;
}

export function registerDocumentAnalysisRoutes(app: Express): void {
  app.post("/api/analyze-document", async (req: Request, res: Response) => {
    try {
      const { documentUrl, documentName, adjusterId, claimId } = req.body;

      if (!documentUrl) {
        return res.status(400).json({ error: "Document URL is required" });
      }

      const systemPrompt = `You are an expert insurance claims analyst. Analyze the provided document and extract relevant information.

Extract the following information if present:
- Adjuster name, email, phone, company/carrier
- Claim ID or reference number
- Date of loss
- Property address
- Homeowner/insured name
- Any interactions (calls, emails, inspections) with dates
- Key observations about adjuster behavior
- Claim amounts, estimates, deductibles
- Any notes about what worked or didn't work in negotiations

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
  "interactionType": "Call" | "Email" | "Inspection" | "Reinspection" | "Escalation" | "Other" or null,
  "interactionDate": string (YYYY-MM-DD format) or null,
  "interactionDescription": string or null,
  "interactionOutcome": string or null,
  "internalNotes": string (observations about adjuster) or null,
  "riskImpression": string (assessment of adjuster difficulty) or null,
  "whatWorked": string (successful strategies) or null,
  "claimNotes": string (summary of claim details) or null,
  "estimateAmount": string or null
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this document "${documentName || 'document'}" and extract all relevant insurance claim information.`,
              },
              {
                type: "image_url",
                image_url: { url: documentUrl },
              },
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

      const systemPrompt = `You are an expert insurance claims analyst. Analyze the provided document and extract relevant information.

Extract the following information if present:
- Adjuster name, email, phone, company/carrier
- Claim ID or reference number
- Date of loss
- Property address
- Homeowner/insured name
- Any interactions (calls, emails, inspections) with dates
- Key observations about adjuster behavior
- Claim amounts, estimates, deductibles
- Any notes about what worked or didn't work in negotiations

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
  "interactionType": "Call" | "Email" | "Inspection" | "Reinspection" | "Escalation" | "Other" or null,
  "interactionDate": string (YYYY-MM-DD format) or null,
  "interactionDescription": string or null,
  "interactionOutcome": string or null,
  "internalNotes": string (observations about adjuster) or null,
  "riskImpression": string (assessment of adjuster difficulty) or null,
  "whatWorked": string (successful strategies) or null,
  "claimNotes": string (summary of claim details) or null,
  "estimateAmount": string or null
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this document "${documentName || 'document'}" and extract all relevant insurance claim information.`,
              },
              {
                type: "image_url",
                image_url: { url: documentUrl },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const extracted: ExtractedData = JSON.parse(content);

      const savedItems: string[] = [];

      if (adjusterId && extracted.interactionDescription) {
        await storage.createInteraction({
          adjusterId,
          date: extracted.interactionDate || format(new Date(), 'yyyy-MM-dd'),
          type: extracted.interactionType || 'Other',
          description: extracted.interactionDescription,
          outcome: extracted.interactionOutcome || null,
          claimId: extracted.claimId || claimId || null,
        });
        savedItems.push('interaction');
      }

      if (adjusterId) {
        const updates: any = {};
        if (extracted.internalNotes) updates.internalNotes = extracted.internalNotes;
        if (extracted.riskImpression) updates.riskImpression = extracted.riskImpression;
        if (extracted.whatWorked) updates.whatWorked = extracted.whatWorked;
        if (extracted.adjusterPhone) updates.phone = extracted.adjusterPhone;
        if (extracted.adjusterEmail) updates.email = extracted.adjusterEmail;

        if (Object.keys(updates).length > 0) {
          await storage.updateAdjuster(adjusterId, updates);
          savedItems.push('adjuster profile');
        }
      }

      if (claimId && extracted.claimNotes) {
        await storage.updateClaim(claimId, {
          notes: extracted.claimNotes,
        });
        savedItems.push('claim notes');
      }

      res.json({
        success: true,
        extracted,
        savedItems,
        message: `Analyzed and saved: ${savedItems.join(', ') || 'no items to save'}`,
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });
}
