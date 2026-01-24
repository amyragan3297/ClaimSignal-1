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

// Service requests from customers who purchased add-ons
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Customer info
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  // Service details
  serviceType: text("service_type").notNull(), // 'expert_review', 'carrier_report', 'training'
  stripePaymentId: text("stripe_payment_id"), // reference to the Stripe payment
  // Claim/request details
  claimDescription: text("claim_description"),
  carrierName: text("carrier_name"),
  urgency: text("urgency").default('normal'), // 'normal', 'urgent'
  // Document paths (stored in object storage)
  documentPaths: text("document_paths").array(),
  // Status tracking
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  adminNotes: true,
});

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

// App settings for configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

// Supplements for claims - additional damage discovered after initial claim
export const supplements = pgTable("supplements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id, { onDelete: 'cascade' }),
  // Supplement info
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending', 'submitted', 'approved', 'denied', 'negotiating'
  // Amounts
  requestedAmount: integer("requested_amount"), // in cents
  approvedAmount: integer("approved_amount"), // in cents
  // AI-extracted data from documents
  extractedData: jsonb("extracted_data"), // { lineItems: [...], damageDescriptions: [...], etc }
  // Document references
  documentPaths: text("document_paths").array(),
  // Dates
  submittedDate: text("submitted_date"),
  responseDate: text("response_date"),
  // Notes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplementSchema = createInsertSchema(supplements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  extractedData: true,
});

export type InsertSupplement = z.infer<typeof insertSupplementSchema>;
export type Supplement = typeof supplements.$inferSelect;

// Supplement line items (individual items within a supplement)
export const supplementLineItems = pgTable("supplement_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplementId: varchar("supplement_id").notNull().references(() => supplements.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  category: text("category"), // 'roof', 'siding', 'interior', 'contents', etc
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price"), // in cents
  totalPrice: integer("total_price"), // in cents
  status: text("status").default('pending'), // 'pending', 'approved', 'denied', 'partial'
  approvedAmount: integer("approved_amount"), // in cents
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupplementLineItemSchema = createInsertSchema(supplementLineItems).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplementLineItem = z.infer<typeof insertSupplementLineItemSchema>;
export type SupplementLineItem = typeof supplementLineItems.$inferSelect;

// Case Studies - Training-grade templates for successful claim strategies
export const caseStudies = pgTable("case_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: text("case_id").notNull(), // e.g., "CS-2024-0001"
  title: text("title").notNull(), // e.g., "Initial denial reversed after photo sequencing correction"
  carrier: text("carrier").notNull(),
  region: text("region"), // e.g., "Alabama", "Southeast"
  claimType: text("claim_type"), // 'roof', 'water', 'fire', 'wind', 'hail', etc.
  outcome: text("outcome").notNull().default('approved'), // 'approved', 'partial', 'denied'
  // The story
  summary: text("summary"), // Brief description of what happened
  frictionSignals: text("friction_signals").array(), // What obstacles were encountered
  actionsTaken: text("actions_taken").array(), // What was done to overcome them
  turningPoint: text("turning_point"), // The key moment that changed the outcome
  keySignal: text("key_signal"), // The main learning/takeaway
  // Metrics
  denialsOvercome: integer("denials_overcome").default(0), // How many times denied before approval
  daysToResolution: integer("days_to_resolution"),
  amountRecovered: integer("amount_recovered"), // in cents
  // Linked data (optional)
  linkedClaimId: varchar("linked_claim_id").references(() => claims.id),
  linkedAdjusterId: varchar("linked_adjuster_id").references(() => adjusters.id),
  // Visibility
  isPublic: boolean("is_public").default(false), // Can be shared/anonymized
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCaseStudySchema = createInsertSchema(caseStudies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCaseStudy = z.infer<typeof insertCaseStudySchema>;
export type CaseStudy = typeof caseStudies.$inferSelect;

// Re-export chat models for AI integrations
export * from "./models/chat";
