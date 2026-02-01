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
  type TeamCredentials,
  type User,
  type Session,
  type ServiceRequest,
  type InsertServiceRequest,
  type AppSetting,
  type Supplement,
  type InsertSupplement,
  type SupplementLineItem,
  type InsertSupplementLineItem,
  type TacticalNote,
  type InsertTacticalNote,
  type AddonPurchase,
  type InsertAddonPurchase,
  adjusters,
  claims,
  claimAdjusters,
  interactions,
  documents,
  attachments,
  teamCredentials,
  users,
  sessions,
  serviceRequests,
  appSettings,
  supplements,
  supplementLineItems,
  caseStudies,
  tacticalNotes,
  addonPurchases,
  type CaseStudy,
  type InsertCaseStudy
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, inArray, lt, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

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
  // Behavioral metrics
  riskScore: number;
  responsivenessScore: number | null;
  cooperationLevel: 'Low' | 'Moderate' | 'High' | null;
  supplementApprovalRate: number | null;
  avgInteractionsPerClaim: number | null;
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
  riskScore: number | null;
  supplementSuccessRate: number | null;
  reinspectionWinRate: number | null;
}

export interface IStorage {
  // Adjuster methods
  getAllAdjusters(): Promise<Adjuster[]>;
  getAdjuster(id: string): Promise<Adjuster | undefined>;
  findAdjusterByNameAndCarrier(name: string, carrier: string): Promise<Adjuster | undefined>;
  createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster>;
  updateAdjuster(id: string, data: Partial<InsertAdjuster>): Promise<Adjuster | undefined>;
  getAdjusterIntelligence(id: string): Promise<AdjusterIntelligence | undefined>;
  getAllCarriers(): Promise<string[]>;
  getCarrierIntelligence(carrier: string): Promise<CarrierIntelligence | undefined>;
  
  // Claim methods
  getAllClaims(): Promise<Claim[]>;
  getClaim(id: string): Promise<Claim | undefined>;
  findClaimByMaskedId(maskedId: string): Promise<Claim | undefined>;
  getClaimsByAdjuster(adjusterId: string): Promise<Claim[]>;
  getAllClaimAdjusters(): Promise<ClaimAdjuster[]>;
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
  
  // Case Study methods
  getAllCaseStudies(): Promise<CaseStudy[]>;
  getCaseStudy(id: string): Promise<CaseStudy | undefined>;
  createCaseStudy(caseStudy: InsertCaseStudy): Promise<CaseStudy>;
  updateCaseStudy(id: string, data: Partial<InsertCaseStudy>): Promise<CaseStudy | undefined>;
  deleteCaseStudy(id: string): Promise<void>;
  
  // Tactical Notes methods
  getTacticalNotes(claimId?: string, adjusterId?: string): Promise<TacticalNote[]>;
  createTacticalNote(note: InsertTacticalNote): Promise<TacticalNote>;
  updateTacticalNote(id: string, content: string): Promise<TacticalNote | undefined>;
  deleteTacticalNote(id: string): Promise<void>;
  
  // Analytics methods
  getPerformanceSummary(): Promise<PerformanceSummary>;
}

export interface PerformanceSummary {
  supplementSuccessRate: number | null;
  reinspectionWinRate: number | null;
  escalationSuccessRate: number | null;
  avgDaysToApproval: number | null;
  totalSupplements: number;
  totalReinspections: number;
  totalEscalations: number;
}

export class DBStorage implements IStorage {
  // Adjuster methods
  async getAllAdjusters(): Promise<Adjuster[]> {
    return await db.select().from(adjusters);
  }

  async searchAdjusters(query: string): Promise<Adjuster[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(adjusters).where(
      sql`LOWER(${adjusters.name}) LIKE ${searchTerm} OR LOWER(${adjusters.carrier}) LIKE ${searchTerm}`
    );
  }

  async findAdjusterByNameAndCarrier(name: string, carrier: string): Promise<Adjuster | undefined> {
    const results = await db.select().from(adjusters).where(
      sql`LOWER(${adjusters.name}) = LOWER(${name}) AND LOWER(${adjusters.carrier}) = LOWER(${carrier})`
    );
    return results[0];
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

  async findClaimByMaskedId(maskedId: string): Promise<Claim | undefined> {
    const results = await db.select().from(claims).where(
      sql`LOWER(${claims.maskedId}) = LOWER(${maskedId})`
    );
    return results[0];
  }

  async getClaimsByAdjuster(adjusterId: string): Promise<Claim[]> {
    const links = await db.select().from(claimAdjusters).where(eq(claimAdjusters.adjusterId, adjusterId));
    if (links.length === 0) return [];
    const claimIds = links.map(l => l.claimId);
    return await db.select().from(claims).where(inArray(claims.id, claimIds));
  }

  async getAllClaimAdjusters(): Promise<ClaimAdjuster[]> {
    return await db.select().from(claimAdjusters);
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

    // Case-insensitive interaction type matching
    const escalationCount = adjusterInteractions.filter(i => 
      i.type.toLowerCase().includes('escalat') || 
      i.type.toLowerCase().includes('dispute') ||
      i.type.toLowerCase().includes('appeal')
    ).length;
    const reinspectionCount = adjusterInteractions.filter(i => 
      i.type.toLowerCase().includes('reinspect') || 
      i.type.toLowerCase().includes('re-inspect') ||
      i.type.toLowerCase().includes('inspection')
    ).length;
    const supplementCount = adjusterInteractions.filter(i =>
      i.type.toLowerCase().includes('supplement')
    ).length;

    // Case-insensitive status matching - 'overturned' and 'approved' are wins!
    const resolvedClaims = adjusterClaims.filter(c => 
      ['resolved', 'closed', 'overturned', 'approved'].includes(c.status?.toLowerCase() || '')
    );
    const stalledClaims = adjusterClaims.filter(c => 
      ['stalled', 'denied', 'litigation'].includes(c.status?.toLowerCase() || '')
    );
    const openClaims = adjusterClaims.filter(c => 
      ['open', 'in_progress', 'active', 'negotiating'].includes(c.status?.toLowerCase() || '')
    );

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

    // Calculate behavioral metrics
    // Risk score based on riskImpression field
    let riskScore = 50;
    const impression = (adjuster.riskImpression || '').toLowerCase();
    if (impression.includes('difficult') || impression.includes('aggressive')) riskScore += 15;
    if (impression.includes('unresponsive') || impression.includes('delay')) riskScore += 10;
    if (impression.includes('denied') || impression.includes('rejection')) riskScore += 10;
    if (impression.includes('lowball') || impression.includes('scope reduction')) riskScore += 10;
    if (impression.includes('fair') || impression.includes('reasonable')) riskScore -= 15;
    if (impression.includes('responsive') || impression.includes('cooperative')) riskScore -= 10;
    if (impression.includes('approved') || impression.includes('professional')) riskScore -= 10;
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Responsiveness score (0-100) based on how quickly claims progress
    let responsivenessScore: number | null = null;
    if (avgDaysToResolution !== null && adjusterClaims.length > 0) {
      // Lower days = higher responsiveness
      if (avgDaysToResolution <= 14) responsivenessScore = 90;
      else if (avgDaysToResolution <= 30) responsivenessScore = 75;
      else if (avgDaysToResolution <= 45) responsivenessScore = 60;
      else if (avgDaysToResolution <= 60) responsivenessScore = 45;
      else responsivenessScore = 30;
    }

    // Cooperation level based on outcomes and escalation patterns
    let cooperationLevel: 'Low' | 'Moderate' | 'High' | null = null;
    if (adjusterClaims.length >= 2) {
      const resolvedRatio = (resolvedClaims.length + openClaims.length) / adjusterClaims.length;
      const escalationRatio = totalInteractions > 0 ? escalationCount / totalInteractions : 0;
      
      if (resolvedRatio > 0.7 && escalationRatio < 0.15) cooperationLevel = 'High';
      else if (resolvedRatio > 0.4 && escalationRatio < 0.3) cooperationLevel = 'Moderate';
      else cooperationLevel = 'Low';
    }

    // Supplement approval rate for this adjuster's claims
    const adjusterClaimIds = adjusterClaims.map(c => c.id);
    const adjusterSupplements = adjusterClaimIds.length > 0 
      ? await db.select().from(supplements).where(inArray(supplements.claimId, adjusterClaimIds))
      : [];
    let supplementApprovalRate: number | null = null;
    const completedSupplements = adjusterSupplements.filter(s => s.status === 'approved' || s.status === 'denied');
    if (completedSupplements.length > 0) {
      const approvedCount = completedSupplements.filter(s => s.status === 'approved').length;
      supplementApprovalRate = Math.round((approvedCount / completedSupplements.length) * 100);
    }

    // Avg interactions per claim
    const avgInteractionsPerClaim = adjusterClaims.length > 0
      ? Math.round((totalInteractions / adjusterClaims.length) * 10) / 10
      : null;

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
      riskScore,
      responsivenessScore,
      cooperationLevel,
      supplementApprovalRate,
      avgInteractionsPerClaim,
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

    // Case-insensitive status matching - 'overturned' and 'approved' are wins!
    const resolvedClaims = carrierClaims.filter(c => 
      ['resolved', 'closed', 'overturned', 'approved'].includes(c.status?.toLowerCase() || '')
    );
    const stalledClaims = carrierClaims.filter(c => 
      ['stalled', 'denied', 'litigation'].includes(c.status?.toLowerCase() || '')
    );
    const openClaims = carrierClaims.filter(c => 
      ['open', 'in_progress', 'active', 'negotiating'].includes(c.status?.toLowerCase() || '')
    );

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
    const escalations = allInteractions.filter(i => 
      i.type.toLowerCase().includes('escalat') || 
      i.type.toLowerCase().includes('dispute') ||
      i.type.toLowerCase().includes('appeal')
    );
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

    // Calculate carrier risk score based on adjuster behavior
    let riskScore: number | null = null;
    if (carrierAdjusters.length > 0) {
      let totalScore = 0;
      for (const adj of carrierAdjusters) {
        let score = 50;
        const impression = (adj.riskImpression || '').toLowerCase();
        if (impression.includes('difficult') || impression.includes('aggressive')) score += 15;
        if (impression.includes('unresponsive') || impression.includes('delay')) score += 10;
        if (impression.includes('denied') || impression.includes('rejection')) score += 10;
        if (impression.includes('lowball') || impression.includes('scope reduction')) score += 10;
        if (impression.includes('fair') || impression.includes('reasonable')) score -= 15;
        if (impression.includes('responsive') || impression.includes('cooperative')) score -= 10;
        if (impression.includes('approved') || impression.includes('professional')) score -= 10;
        totalScore += Math.max(0, Math.min(100, score));
      }
      riskScore = Math.round(totalScore / carrierAdjusters.length);
    }

    // Supplement success rate (based on claims that had supplements or overturned status)
    let supplementSuccessRate: number | null = null;
    const carrierClaimIds = carrierClaims.map(c => c.id);
    
    if (carrierClaimIds.length > 0) {
      const allSupplements = await db.select().from(supplements).where(
        inArray(supplements.claimId, carrierClaimIds)
      );
      
      // Count from supplements table
      const completedSupplements = allSupplements.filter(s => 
        s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'denied'
      );
      
      // Also count 'overturned' claims as supplement wins
      const overturnedClaims = carrierClaims.filter(c => c.status?.toLowerCase() === 'overturned').length;
      const deniedClaims = stalledClaims.length;
      
      if (completedSupplements.length > 0) {
        const approvedSupplements = completedSupplements.filter(s => s.status?.toLowerCase() === 'approved').length;
        supplementSuccessRate = Math.round((approvedSupplements / completedSupplements.length) * 100);
      } else if (overturnedClaims + deniedClaims > 0) {
        // Fallback: use claim statuses - overturned = win, denied = loss
        supplementSuccessRate = Math.round((overturnedClaims / (overturnedClaims + deniedClaims)) * 100);
      } else if (resolvedClaims.length > 0) {
        // Second fallback: if claims resolved, assume supplements were successful
        supplementSuccessRate = Math.round((resolvedClaims.length / carrierClaims.length) * 100);
      }
    }

    // Reinspection win rate (based on interactions with type containing "reinspection" or "re-inspection")
    const reinspectionInteractions = allInteractions.filter(i => 
      i.type.toLowerCase().includes('reinspection') || 
      i.type.toLowerCase().includes('re-inspection') ||
      i.type === 'Inspection'
    );
    let reinspectionWinRate: number | null = null;
    if (reinspectionInteractions.length > 0) {
      const successfulReinspections = reinspectionInteractions.filter(i => 
        i.outcome?.toLowerCase().includes('approved') || 
        i.outcome?.toLowerCase().includes('successful') ||
        i.outcome?.toLowerCase().includes('favorable')
      ).length;
      reinspectionWinRate = Math.round((successfulReinspections / reinspectionInteractions.length) * 100);
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
      riskScore,
      supplementSuccessRate,
      reinspectionWinRate,
    };
  }

  // Auth methods - Team credentials
  async getTeamCredentials(): Promise<TeamCredentials | undefined> {
    const result = await db.select().from(teamCredentials).limit(1);
    return result[0];
  }

  async createTeamCredentials(username: string, password: string, accessLevel: string = 'viewer'): Promise<TeamCredentials> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(teamCredentials).values({
      username: username.trim(),
      passwordHash,
      accessLevel,
    }).returning();
    return result[0];
  }

  async updateTeamCredentials(id: string, username: string, password: string): Promise<TeamCredentials | undefined> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.update(teamCredentials).set({
      username: username.trim(),
      passwordHash,
      updatedAt: new Date(),
    }).where(eq(teamCredentials.id, id)).returning();
    return result[0];
  }

  async updateTeamAccessLevel(id: string, accessLevel: string): Promise<TeamCredentials | undefined> {
    const result = await db.update(teamCredentials).set({
      accessLevel,
      updatedAt: new Date(),
    }).where(eq(teamCredentials.id, id)).returning();
    return result[0];
  }

  async getAllTeamCredentials(): Promise<TeamCredentials[]> {
    return await db.select().from(teamCredentials);
  }

  async verifyTeamLogin(username: string, password: string): Promise<TeamCredentials | null> {
    const creds = await db.select().from(teamCredentials).where(eq(teamCredentials.username, username.trim())).limit(1);
    if (!creds[0]) return null;
    const valid = await bcrypt.compare(password, creds[0].passwordHash);
    return valid ? creds[0] : null;
  }

  async getTeamCredentialsByUsername(username: string): Promise<TeamCredentials | undefined> {
    const result = await db.select().from(teamCredentials).where(eq(teamCredentials.username, username.trim())).limit(1);
    return result[0];
  }

  // Auth methods - Individual users
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async createUser(email: string, password: string, accessLevel: string = 'viewer'): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      accessLevel,
    }).returning();
    return result[0];
  }

  async updateUserAccessLevel(id: string, accessLevel: string): Promise<User | undefined> {
    const result = await db.update(users).set({ accessLevel }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async verifyUserLogin(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : undefined;
  }

  async updateUserStripeInfo(userId: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
  }): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return result[0];
  }

  // Session methods
  async createSession(userType: 'team' | 'individual', accessLevel: string = 'viewer', userId?: string): Promise<Session> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const result = await db.insert(sessions).values({
      token,
      userType,
      userId: userId || null,
      accessLevel,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    const session = result[0];
    if (!session) return undefined;
    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  // Stripe data queries (from stripe schema)
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return (result.rows as any[])[0] || null;
  }

  async listProducts() {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = true`
    );
    return result.rows;
  }

  async listProductsWithPrices() {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return (result.rows as any[])[0] || null;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return result[0];
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).limit(1);
    return result[0];
  }

  // Service request methods
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const result = await db.insert(serviceRequests).values(request).returning();
    return result[0];
  }

  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const result = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return result[0];
  }

  async updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const result = await db.update(serviceRequests).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(serviceRequests.id, id)).returning();
    return result[0];
  }

  // App settings methods
  async getAllAppSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings);
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return result[0];
  }

  async setAppSetting(key: string, value: string, description?: string): Promise<AppSetting> {
    const existing = await this.getAppSetting(key);
    if (existing) {
      const result = await db.update(appSettings).set({
        value,
        description: description || existing.description,
        updatedAt: new Date(),
      }).where(eq(appSettings.key, key)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values({
        key,
        value,
        description,
      }).returning();
      return result[0];
    }
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    const result = await db.delete(appSettings).where(eq(appSettings.key, key)).returning();
    return result.length > 0;
  }

  // Supplement methods
  async getSupplementsByClaimId(claimId: string): Promise<Supplement[]> {
    return await db.select().from(supplements).where(eq(supplements.claimId, claimId)).orderBy(desc(supplements.createdAt));
  }

  async getAllSupplements(): Promise<Supplement[]> {
    return await db.select().from(supplements).orderBy(desc(supplements.createdAt));
  }

  async getSupplement(id: string): Promise<Supplement | undefined> {
    const result = await db.select().from(supplements).where(eq(supplements.id, id));
    return result[0];
  }

  async createSupplement(data: InsertSupplement): Promise<Supplement> {
    const result = await db.insert(supplements).values(data).returning();
    return result[0];
  }

  async updateSupplement(id: string, data: Partial<Supplement>): Promise<Supplement | undefined> {
    const result = await db.update(supplements).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(supplements.id, id)).returning();
    return result[0];
  }

  async deleteSupplement(id: string): Promise<boolean> {
    const result = await db.delete(supplements).where(eq(supplements.id, id)).returning();
    return result.length > 0;
  }

  // Supplement line item methods
  async getLineItemsBySupplement(supplementId: string): Promise<SupplementLineItem[]> {
    return await db.select().from(supplementLineItems).where(eq(supplementLineItems.supplementId, supplementId));
  }

  async createLineItem(data: InsertSupplementLineItem): Promise<SupplementLineItem> {
    const result = await db.insert(supplementLineItems).values(data).returning();
    return result[0];
  }

  async updateLineItem(id: string, data: Partial<SupplementLineItem>): Promise<SupplementLineItem | undefined> {
    const result = await db.update(supplementLineItems).set(data).where(eq(supplementLineItems.id, id)).returning();
    return result[0];
  }

  async deleteLineItem(id: string): Promise<boolean> {
    const result = await db.delete(supplementLineItems).where(eq(supplementLineItems.id, id)).returning();
    return result.length > 0;
  }

  // Calculate supplement totals
  async calculateSupplementTotal(supplementId: string): Promise<{ requestedTotal: number; approvedTotal: number }> {
    const items = await this.getLineItemsBySupplement(supplementId);
    const requestedTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const approvedTotal = items.reduce((sum, item) => sum + (item.approvedAmount || 0), 0);
    return { requestedTotal, approvedTotal };
  }

  // Case Study methods
  async getAllCaseStudies(): Promise<CaseStudy[]> {
    return await db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt));
  }

  async getCaseStudy(id: string): Promise<CaseStudy | undefined> {
    const result = await db.select().from(caseStudies).where(eq(caseStudies.id, id));
    return result[0];
  }

  async createCaseStudy(caseStudy: InsertCaseStudy): Promise<CaseStudy> {
    const result = await db.insert(caseStudies).values(caseStudy).returning();
    return result[0];
  }

  async updateCaseStudy(id: string, data: Partial<InsertCaseStudy>): Promise<CaseStudy | undefined> {
    const result = await db.update(caseStudies).set({ ...data, updatedAt: new Date() }).where(eq(caseStudies.id, id)).returning();
    return result[0];
  }

  async deleteCaseStudy(id: string): Promise<void> {
    await db.delete(caseStudies).where(eq(caseStudies.id, id));
  }

  async getCaseStudyByClaimId(claimId: string): Promise<CaseStudy | undefined> {
    const result = await db.select().from(caseStudies).where(eq(caseStudies.linkedClaimId, claimId));
    return result[0];
  }

  async getNextCaseStudyId(): Promise<string> {
    const year = new Date().getFullYear();
    const allStudies = await this.getAllCaseStudies();
    const thisYearStudies = allStudies.filter(s => s.caseId.includes(`CS-${year}`));
    const nextNum = thisYearStudies.length + 1;
    return `CS-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async getPerformanceSummary(): Promise<PerformanceSummary> {
    // Get all supplements
    const allSupplements = await db.select().from(supplements);
    const completedSupplements = allSupplements.filter(s => s.status === 'approved' || s.status === 'denied');
    let supplementSuccessRate: number | null = null;
    if (completedSupplements.length > 0) {
      const approvedCount = completedSupplements.filter(s => s.status === 'approved').length;
      supplementSuccessRate = Math.round((approvedCount / completedSupplements.length) * 100);
    }

    // Get all interactions for reinspection and escalation metrics
    const allInteractions = await db.select().from(interactions);
    
    // Reinspection win rate
    const reinspectionInteractions = allInteractions.filter(i => 
      i.type.toLowerCase().includes('reinspection') || 
      i.type.toLowerCase().includes('re-inspection') ||
      i.type === 'Inspection'
    );
    let reinspectionWinRate: number | null = null;
    if (reinspectionInteractions.length > 0) {
      const successfulReinspections = reinspectionInteractions.filter(i => 
        i.outcome?.toLowerCase().includes('approved') || 
        i.outcome?.toLowerCase().includes('successful') ||
        i.outcome?.toLowerCase().includes('favorable')
      ).length;
      reinspectionWinRate = Math.round((successfulReinspections / reinspectionInteractions.length) * 100);
    }

    // Escalation success rate
    const escalationInteractions = allInteractions.filter(i => 
      i.type === 'Escalation' || i.type.toLowerCase().includes('escalat')
    );
    let escalationSuccessRate: number | null = null;
    if (escalationInteractions.length > 0) {
      const successfulEscalations = escalationInteractions.filter(i => 
        i.outcome?.toLowerCase().includes('approved') || 
        i.outcome?.toLowerCase().includes('successful') ||
        i.outcome?.toLowerCase().includes('favorable') ||
        i.outcome?.toLowerCase().includes('resolved')
      ).length;
      escalationSuccessRate = Math.round((successfulEscalations / escalationInteractions.length) * 100);
    }

    // Avg days to approval (from resolved claims)
    const allClaims = await this.getAllClaims();
    const resolvedClaims = allClaims.filter(c => c.status === 'resolved' || c.status === 'closed');
    let avgDaysToApproval: number | null = null;
    if (resolvedClaims.length > 0) {
      const approvalDays = resolvedClaims.map(claim => {
        if (!claim.dateOfLoss) return null;
        const startDate = new Date(claim.dateOfLoss).getTime();
        // Use createdAt or last update as end date
        const endDate = claim.createdAt ? new Date(claim.createdAt).getTime() : Date.now();
        const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        return days >= 0 ? days : null;
      }).filter((d): d is number => d !== null);
      
      if (approvalDays.length > 0) {
        avgDaysToApproval = Math.round(approvalDays.reduce((a, b) => a + b, 0) / approvalDays.length);
      }
    }

    return {
      supplementSuccessRate,
      reinspectionWinRate,
      escalationSuccessRate,
      avgDaysToApproval,
      totalSupplements: allSupplements.length,
      totalReinspections: reinspectionInteractions.length,
      totalEscalations: escalationInteractions.length,
    };
  }

  // Tactical Notes methods
  async getTacticalNotes(claimId?: string, adjusterId?: string): Promise<TacticalNote[]> {
    let query = db.select().from(tacticalNotes);
    
    if (claimId && adjusterId) {
      query = query.where(
        sql`${tacticalNotes.claimId} = ${claimId} AND ${tacticalNotes.adjusterId} = ${adjusterId}`
      ) as any;
    } else if (claimId) {
      query = query.where(eq(tacticalNotes.claimId, claimId)) as any;
    } else if (adjusterId) {
      query = query.where(eq(tacticalNotes.adjusterId, adjusterId)) as any;
    }
    
    return query.orderBy(desc(tacticalNotes.createdAt));
  }

  async createTacticalNote(note: InsertTacticalNote): Promise<TacticalNote> {
    const result = await db.insert(tacticalNotes).values(note).returning();
    return result[0];
  }

  async updateTacticalNote(id: string, content: string): Promise<TacticalNote | undefined> {
    const result = await db
      .update(tacticalNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(tacticalNotes.id, id))
      .returning();
    return result[0];
  }

  async deleteTacticalNote(id: string): Promise<void> {
    await db.delete(tacticalNotes).where(eq(tacticalNotes.id, id));
  }

  // Addon Purchases methods
  async getAddonPurchases(status?: string): Promise<AddonPurchase[]> {
    if (status) {
      return db.select().from(addonPurchases)
        .where(eq(addonPurchases.status, status))
        .orderBy(desc(addonPurchases.createdAt));
    }
    return db.select().from(addonPurchases).orderBy(desc(addonPurchases.createdAt));
  }

  async getAddonPurchase(id: string): Promise<AddonPurchase | undefined> {
    const result = await db.select().from(addonPurchases).where(eq(addonPurchases.id, id));
    return result[0];
  }

  async createAddonPurchase(purchase: InsertAddonPurchase): Promise<AddonPurchase> {
    const result = await db.insert(addonPurchases).values(purchase).returning();
    return result[0];
  }

  async updateAddonPurchaseStatus(id: string, status: string, notes?: string): Promise<AddonPurchase | undefined> {
    const updateData: any = { status };
    if (status === 'fulfilled') {
      updateData.fulfilledAt = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }
    const result = await db
      .update(addonPurchases)
      .set(updateData)
      .where(eq(addonPurchases.id, id))
      .returning();
    return result[0];
  }

  async getPendingAddonCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(addonPurchases)
      .where(eq(addonPurchases.status, 'pending'));
    return Number(result[0]?.count) || 0;
  }

  // Free trial sessions (stored in sessions with special userType)
  async createTrialSession(): Promise<Session> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    
    const result = await db.insert(sessions).values({
      token,
      userType: 'trial',
      accessLevel: 'viewer',
      expiresAt,
    }).returning();
    
    return result[0];
  }
}

export const storage = new DBStorage();
