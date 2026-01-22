import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Access level types: 'admin' (full access), 'editor' (add/edit), 'viewer' (read only)
export type AccessLevel = 'admin' | 'editor' | 'viewer';

// Team credentials for shared login
export const teamCredentials = pgTable("team_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  accessLevel: text("access_level").notNull().default('viewer'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Individual users (for paid subscriptions)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  accessLevel: text("access_level").notNull().default('viewer'),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default('inactive'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Active sessions (for both team and individual logins)
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  userType: text("user_type").notNull(), // 'team' or 'individual'
  userId: text("user_id"), // null for team, user id for individual
  accessLevel: text("access_level").notNull().default('viewer'), // 'admin', 'editor', 'viewer'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for auth
export const insertTeamCredentialsSchema = createInsertSchema(teamCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionStatus: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// Types for auth
export type InsertTeamCredentials = z.infer<typeof insertTeamCredentialsSchema>;
export type TeamCredentials = typeof teamCredentials.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const adjusters = pgTable("adjusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  carrier: text("carrier").notNull(),
  region: text("region"),
  phone: text("phone"),
  email: text("email"),
  internalNotes: text("internal_notes"),
  riskImpression: text("risk_impression"),
  whatWorked: text("what_worked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maskedId: text("masked_id").notNull(),
  carrier: text("carrier").notNull(),
  dateOfLoss: text("date_of_loss").notNull(),
  status: text("status").notNull().default('open'),
  notes: text("notes"),
  outcomeNotes: text("outcome_notes"),
  homeownerName: text("homeowner_name"),
  propertyAddress: text("property_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claimAdjusters = pgTable("claim_adjusters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id, { onDelete: 'cascade' }),
  adjusterId: varchar("adjuster_id").notNull().references(() => adjusters.id, { onDelete: 'cascade' }),
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

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjusterId: varchar("adjuster_id").notNull().references(() => adjusters.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  objectPath: text("object_path").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id, { onDelete: 'cascade' }),
  adjusterId: varchar("adjuster_id").references(() => adjusters.id, { onDelete: 'set null' }),
  type: text("type").notNull(), // 'file' or 'email'
  date: text("date").notNull(),
  // File fields
  objectPath: text("object_path"),
  filename: text("filename"),
  contentType: text("content_type"),
  size: integer("size"),
  description: text("description"),
  // Email fields
  direction: text("direction"), // 'sent' or 'received'
  subject: text("subject"),
  body: text("body"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAdjusterSchema = createInsertSchema(adjusters).omit({
  id: true,
  createdAt: true,
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  createdAt: true,
});

export const insertClaimAdjusterSchema = createInsertSchema(claimAdjusters).omit({
  id: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertAdjuster = z.infer<typeof insertAdjusterSchema>;
export type Adjuster = typeof adjusters.$inferSelect;

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;

export type InsertClaimAdjuster = z.infer<typeof insertClaimAdjusterSchema>;
export type ClaimAdjuster = typeof claimAdjusters.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// Re-export chat models for AI integrations
export * from "./models/chat";
