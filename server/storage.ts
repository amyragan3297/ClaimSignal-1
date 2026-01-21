import { 
  type Adjuster, 
  type InsertAdjuster,
  type Claim,
  type InsertClaim,
  type Interaction,
  type InsertInteraction,
  type Document,
  type InsertDocument,
  type ClaimAdjuster,
  type InsertClaimAdjuster,
  type Attachment,
  type InsertAttachment,
  adjusters,
  claims,
  claimAdjusters,
  interactions,
  documents,
  attachments
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, inArray } from "drizzle-orm";

function trimStringFields<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = (result[key] as string).trim();
    }
  }
  return result;
}

export interface AdjusterIntelligence {
  totalInteractions: number;
  totalClaims: number;
  escalationCount: number;
  reinspectionCount: number;
  avgDaysToResolution: number | null;
  outcomesResolved: number;
  outcomesStalled: number;
  outcomesOpen: number;
  patternTags: string[];
}

export interface CarrierIntelligence {
  carrier: string;
  totalAdjusters: number;
  totalClaims: number;
  avgInteractionsPerClaim: number | null;
  avgDaysToResolution: number | null;
  escalationEffectiveness: number | null;
  outcomesResolved: number;
  outcomesStalled: number;
  outcomesOpen: number;
  frictionLevel: 'Low' | 'Normal' | 'High' | null;
  resolutionTendency: 'Fast' | 'Normal' | 'Slow' | null;
}

export interface IStorage {
  // Adjuster methods
  getAllAdjusters(): Promise<Adjuster[]>;
  getAdjuster(id: string): Promise<Adjuster | undefined>;
  createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster>;
  updateAdjuster(id: string, data: Partial<InsertAdjuster>): Promise<Adjuster | undefined>;
  getAdjusterIntelligence(id: string): Promise<AdjusterIntelligence | undefined>;
  getAllCarriers(): Promise<string[]>;
  getCarrierIntelligence(carrier: string): Promise<CarrierIntelligence | undefined>;
  
  // Claim methods
  getAllClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimsByAdjuster(adjusterId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, data: Partial<InsertClaim>): Promise<Claim | undefined>;
  linkAdjusterToClaim(claimId: string, adjusterId: string): Promise<ClaimAdjuster>;
  getAdjustersByClaimId(claimId: string): Promise<Adjuster[]>;
  
  // Interaction methods
  getInteractionsByAdjuster(adjusterId: string): Promise<Interaction[]>;
  getInteractionsByClaimId(claimId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  deleteAdjuster(id: string): Promise<void>;
  
  // Document methods
  getDocumentsByAdjuster(adjusterId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Attachment methods
  getAttachmentsByClaimId(claimId: string): Promise<Attachment[]>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;
}

export class DBStorage implements IStorage {
  // Adjuster methods
  async getAllAdjusters(): Promise<Adjuster[]> {
    return await db.select().from(adjusters);
  }

  async getAdjuster(id: string): Promise<Adjuster | undefined> {
    const result = await db.select().from(adjusters).where(eq(adjusters.id, id));
    return result[0];
  }

  async createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster> {
    const trimmedData = trimStringFields(adjuster);
    const result = await db.insert(adjusters).values(trimmedData).returning();
    return result[0];
  }

  async updateAdjuster(id: string, data: Partial<InsertAdjuster>): Promise<Adjuster | undefined> {
    const trimmedData = trimStringFields(data);
    const result = await db.update(adjusters).set(trimmedData).where(eq(adjusters.id, id)).returning();
    return result[0];
  }

  // Claim methods
  async getAllClaims(): Promise<Claim[]> {
    return await db.select().from(claims).orderBy(desc(claims.createdAt));
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    const result = await db.select().from(claims).where(eq(claims.id, id));
    return result[0];
  }

  async getClaimsByAdjuster(adjusterId: string): Promise<Claim[]> {
    const links = await db.select().from(claimAdjusters).where(eq(claimAdjusters.adjusterId, adjusterId));
    if (links.length === 0) return [];
    const claimIds = links.map(l => l.claimId);
    return await db.select().from(claims).where(inArray(claims.id, claimIds));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const trimmedData = trimStringFields(claim);
    const result = await db.insert(claims).values(trimmedData).returning();
    return result[0];
  }

  async updateClaim(id: string, data: Partial<InsertClaim>): Promise<Claim | undefined> {
    const trimmedData = trimStringFields(data);
    const result = await db.update(claims).set(trimmedData).where(eq(claims.id, id)).returning();
    return result[0];
  }

  async linkAdjusterToClaim(claimId: string, adjusterId: string): Promise<ClaimAdjuster> {
    const result = await db.insert(claimAdjusters).values({ claimId, adjusterId }).returning();
    return result[0];
  }

  async getAdjustersByClaimId(claimId: string): Promise<Adjuster[]> {
    const links = await db.select().from(claimAdjusters).where(eq(claimAdjusters.claimId, claimId));
    if (links.length === 0) return [];
    const adjusterIds = links.map(l => l.adjusterId);
    return await db.select().from(adjusters).where(inArray(adjusters.id, adjusterIds));
  }

  // Interaction methods
  async getInteractionsByAdjuster(adjusterId: string): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.adjusterId, adjusterId)).orderBy(interactions.createdAt);
  }

  async getInteractionsByClaimId(claimId: string): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.claimId, claimId)).orderBy(desc(interactions.createdAt));
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const result = await db.insert(interactions).values(interaction).returning();
    return result[0];
  }

  async deleteAdjuster(id: string): Promise<void> {
    await db.delete(adjusters).where(eq(adjusters.id, id));
  }

  // Document methods
  async getDocumentsByAdjuster(adjusterId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.adjusterId, adjusterId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Attachment methods
  async getAttachmentsByClaimId(claimId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.claimId, claimId)).orderBy(desc(attachments.date));
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const result = await db.select().from(attachments).where(eq(attachments.id, id));
    return result[0];
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(attachment).returning();
    return result[0];
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  async getAdjusterIntelligence(id: string): Promise<AdjusterIntelligence | undefined> {
    const adjuster = await this.getAdjuster(id);
    if (!adjuster) return undefined;

    const adjusterInteractions = await this.getInteractionsByAdjuster(id);
    const adjusterClaims = await this.getClaimsByAdjuster(id);

    const escalationCount = adjusterInteractions.filter(i => i.type === 'Escalation').length;
    const reinspectionCount = adjusterInteractions.filter(i => i.type === 'Reinspection').length;

    const resolvedClaims = adjusterClaims.filter(c => c.status === 'resolved' || c.status === 'closed');
    const stalledClaims = adjusterClaims.filter(c => c.status === 'stalled' || c.status === 'denied');
    const openClaims = adjusterClaims.filter(c => c.status === 'open' || c.status === 'in_progress');

    // Calculate average days to resolution for resolved claims
    let avgDaysToResolution: number | null = null;
    if (resolvedClaims.length > 0) {
      const resolutionDays = resolvedClaims.map(claim => {
        const claimInteractions = adjusterInteractions.filter(i => i.claimId === claim.id);
        if (claimInteractions.length === 0) return null;
        
        // Use dateOfLoss as start if available, otherwise first interaction
        const startDate = claim.dateOfLoss 
          ? new Date(claim.dateOfLoss).getTime()
          : Math.min(...claimInteractions.map(i => new Date(i.date).getTime()));
        const lastInteractionDate = Math.max(...claimInteractions.map(i => new Date(i.date).getTime()));
        
        const days = Math.round((lastInteractionDate - startDate) / (1000 * 60 * 60 * 24));
        return days >= 0 ? days : null;
      }).filter((d): d is number => d !== null);
      
      if (resolutionDays.length > 0) {
        avgDaysToResolution = Math.round(resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length);
      }
    }

    // Generate pattern tags based on behavior
    const patternTags: string[] = [];
    
    const totalInteractions = adjusterInteractions.length;
    const escalationRate = totalInteractions > 0 ? escalationCount / totalInteractions : 0;
    const reinspectionRate = totalInteractions > 0 ? reinspectionCount / totalInteractions : 0;

    if (reinspectionRate > 0.15) patternTags.push("Reinspection-heavy");
    if (escalationRate > 0.1 && resolvedClaims.length > stalledClaims.length) patternTags.push("Escalation-responsive");
    if (avgDaysToResolution !== null && avgDaysToResolution > 60) patternTags.push("Slow resolution");
    if (avgDaysToResolution !== null && avgDaysToResolution <= 30) patternTags.push("Fast resolution");
    if (stalledClaims.length > resolvedClaims.length && adjusterClaims.length > 2) patternTags.push("High friction");
    if (resolvedClaims.length > stalledClaims.length * 2 && adjusterClaims.length > 2) patternTags.push("Low friction");
    
    // Check for documentation sensitivity (if claims with more interactions resolved better)
    const avgInteractionsResolved = resolvedClaims.length > 0 
      ? resolvedClaims.reduce((sum, c) => sum + adjusterInteractions.filter(i => i.claimId === c.id).length, 0) / resolvedClaims.length 
      : 0;
    if (avgInteractionsResolved > 5) patternTags.push("Documentation-sensitive");

    return {
      totalInteractions,
      totalClaims: adjusterClaims.length,
      escalationCount,
      reinspectionCount,
      avgDaysToResolution,
      outcomesResolved: resolvedClaims.length,
      outcomesStalled: stalledClaims.length,
      outcomesOpen: openClaims.length,
      patternTags,
    };
  }

  async getAllCarriers(): Promise<string[]> {
    const allAdjusters = await this.getAllAdjusters();
    const allClaims = await this.getAllClaims();
    const carriers = new Set<string>();
    allAdjusters.forEach(a => carriers.add(a.carrier));
    allClaims.forEach(c => carriers.add(c.carrier));
    return Array.from(carriers).sort();
  }

  async getCarrierIntelligence(carrier: string): Promise<CarrierIntelligence | undefined> {
    const allAdjusters = await this.getAllAdjusters();
    const carrierAdjusters = allAdjusters.filter(a => a.carrier === carrier);
    
    const allClaims = await this.getAllClaims();
    const carrierClaims = allClaims.filter(c => c.carrier === carrier);
    
    if (carrierAdjusters.length === 0 && carrierClaims.length === 0) {
      return undefined;
    }

    // Get all interactions linked to carrier claims
    let allInteractions: Interaction[] = [];
    for (const claim of carrierClaims) {
      const claimInteractions = await this.getInteractionsByClaimId(claim.id);
      allInteractions = allInteractions.concat(claimInteractions);
    }

    // Also get interactions from carrier adjusters not linked to claims
    for (const adj of carrierAdjusters) {
      const adjInteractions = await this.getInteractionsByAdjuster(adj.id);
      for (const int of adjInteractions) {
        if (!allInteractions.find(i => i.id === int.id)) {
          allInteractions.push(int);
        }
      }
    }

    const resolvedClaims = carrierClaims.filter(c => c.status === 'resolved' || c.status === 'closed');
    const stalledClaims = carrierClaims.filter(c => c.status === 'stalled' || c.status === 'denied');
    const openClaims = carrierClaims.filter(c => c.status === 'open' || c.status === 'in_progress');

    // Avg interactions per claim - count directly from claim's interactions
    const claimInteractionCounts = carrierClaims.map(claim => 
      allInteractions.filter(i => i.claimId === claim.id).length
    );
    const avgInteractionsPerClaim = claimInteractionCounts.length > 0
      ? Math.round(claimInteractionCounts.reduce((a, b) => a + b, 0) / claimInteractionCounts.length * 10) / 10
      : null;

    // Avg days to resolution - use dateOfLoss and last interaction as milestones
    let avgDaysToResolution: number | null = null;
    if (resolvedClaims.length > 0) {
      const resolutionDays = resolvedClaims.map(claim => {
        const claimInteractions = allInteractions.filter(i => i.claimId === claim.id);
        if (claimInteractions.length === 0) return null;
        
        // Use dateOfLoss as start if available, otherwise first interaction
        const startDate = claim.dateOfLoss 
          ? new Date(claim.dateOfLoss).getTime()
          : Math.min(...claimInteractions.map(i => new Date(i.date).getTime()));
        const lastInteractionDate = Math.max(...claimInteractions.map(i => new Date(i.date).getTime()));
        
        const days = Math.round((lastInteractionDate - startDate) / (1000 * 60 * 60 * 24));
        return days >= 0 ? days : null;
      }).filter((d): d is number => d !== null);
      
      if (resolutionDays.length > 0) {
        avgDaysToResolution = Math.round(resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length);
      }
    }

    // Escalation effectiveness: % of claims with escalations that resolved
    const escalations = allInteractions.filter(i => i.type === 'Escalation');
    const claimsWithEscalations = new Set(escalations.map(e => e.claimId).filter(Boolean));
    let escalationEffectiveness: number | null = null;
    if (claimsWithEscalations.size > 0) {
      const escalatedAndResolved = resolvedClaims.filter(c => claimsWithEscalations.has(c.id)).length;
      escalationEffectiveness = Math.round((escalatedAndResolved / claimsWithEscalations.size) * 100);
    }

    // Friction level based on outcomes
    let frictionLevel: 'Low' | 'Normal' | 'High' | null = null;
    if (carrierClaims.length >= 3) {
      const stalledRatio = stalledClaims.length / carrierClaims.length;
      if (stalledRatio > 0.4) frictionLevel = 'High';
      else if (stalledRatio > 0.2) frictionLevel = 'Normal';
      else frictionLevel = 'Low';
    }

    // Resolution tendency
    let resolutionTendency: 'Fast' | 'Normal' | 'Slow' | null = null;
    if (avgDaysToResolution !== null) {
      if (avgDaysToResolution <= 30) resolutionTendency = 'Fast';
      else if (avgDaysToResolution <= 60) resolutionTendency = 'Normal';
      else resolutionTendency = 'Slow';
    }

    return {
      carrier,
      totalAdjusters: carrierAdjusters.length,
      totalClaims: carrierClaims.length,
      avgInteractionsPerClaim,
      avgDaysToResolution,
      escalationEffectiveness,
      outcomesResolved: resolvedClaims.length,
      outcomesStalled: stalledClaims.length,
      outcomesOpen: openClaims.length,
      frictionLevel,
      resolutionTendency,
    };
  }
}

export const storage = new DBStorage();
