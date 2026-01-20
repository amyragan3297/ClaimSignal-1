import { 
  type Adjuster, 
  type InsertAdjuster,
  type Claim,
  type InsertClaim,
  type Interaction,
  type InsertInteraction,
  adjusters,
  claims,
  interactions
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Adjuster methods
  getAllAdjusters(): Promise<Adjuster[]>;
  getAdjuster(id: string): Promise<Adjuster | undefined>;
  createAdjuster(adjuster: InsertAdjuster): Promise<Adjuster>;
  
  // Claim methods
  getClaimsByAdjuster(adjusterId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  
  // Interaction methods
  getInteractionsByAdjuster(adjusterId: string): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
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

  // Claim methods
  async getClaimsByAdjuster(adjusterId: string): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.adjusterId, adjusterId));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const result = await db.insert(claims).values(claim).returning();
    return result[0];
  }

  // Interaction methods
  async getInteractionsByAdjuster(adjusterId: string): Promise<Interaction[]> {
    return await db.select().from(interactions).where(eq(interactions.adjusterId, adjusterId)).orderBy(interactions.createdAt);
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const result = await db.insert(interactions).values(interaction).returning();
    return result[0];
  }
}

export const storage = new DBStorage();
