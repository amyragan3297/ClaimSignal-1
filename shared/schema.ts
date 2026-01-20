import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const adjusters = pgTable("adjusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  carrier: text("carrier").notNull(),
  riskLevel: text("risk_level").notNull(),
  behaviorScore: integer("behavior_score").notNull(),
  metrics: jsonb("metrics").notNull().$type<{
    aggressiveness: number;
    responsiveness: number;
    fairness: number;
    knowledge: number;
    negotiation: number;
  }>(),
  commonDenialStyles: text("common_denial_styles").array().notNull(),
  responsivenessRating: text("responsiveness_rating").notNull(),
  narrative: text("narrative").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjusterId: varchar("adjuster_id").notNull().references(() => adjusters.id, { onDelete: 'cascade' }),
  publicId: text("public_id").notNull(),
  privateId: text("private_id").notNull(),
  status: text("status").notNull(),
  dateOpened: text("date_opened").notNull(),
  dateClosed: text("date_closed"),
  duration: text("duration"),
  outcome: text("outcome"),
  whatWorked: text("what_worked"),
});

export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjusterId: varchar("adjuster_id").notNull().references(() => adjusters.id, { onDelete: 'cascade' }),
  date: text("date").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  outcome: text("outcome"),
  claimId: text("claim_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAdjusterSchema = createInsertSchema(adjusters).omit({
  id: true,
  createdAt: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertAdjuster = z.infer<typeof insertAdjusterSchema>;
export type Adjuster = typeof adjusters.$inferSelect;

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;
