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
  adjusters,
  claims,
  claimAdjusters,
  interactions,
  documents
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Adjuster methods
  getAllAdjusters(): Promise<Adjuster[]>;
  getAdjuster(id: string): Promise<Adjuster | undefined>;
  createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster>;
  updateAdjuster(id: string, data: Partial<InsertAdjuster>): Promise<Adjuster | undefined>;
  
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
    const result = await db.insert(adjusters).values(adjuster).returning();
    return result[0];
  }

  async updateAdjuster(id: string, data: Partial<InsertAdjuster>): Promise<Adjuster | undefined> {
    const result = await db.update(adjusters).set(data).where(eq(adjusters.id, id)).returning();
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
    const result = await db.insert(claims).values(claim).returning();
    return result[0];
  }

  async updateClaim(id: string, data: Partial<InsertClaim>): Promise<Claim | undefined> {
    const result = await db.update(claims).set(data).where(eq(claims.id, id)).returning();
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
}

export const storage = new DBStorage();
