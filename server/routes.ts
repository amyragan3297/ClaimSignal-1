import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInteractionSchema, insertAdjusterSchema, insertDocumentSchema, insertClaimSchema, insertAttachmentSchema, insertServiceRequestSchema, insertSupplementSchema, insertSupplementLineItemSchema, insertCaseStudySchema, insertTacticalNoteSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerDocumentAnalysisRoutes } from "./replit_integrations/document_analysis";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      session?: {
        userType: 'team' | 'individual';
        userId?: string;
        accessLevel?: 'admin' | 'editor' | 'viewer';
      };
    }
  }
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = await storage.getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired' });
  }

  if (session.userType === 'individual' && session.userId) {
    const user = await storage.getUserById(session.userId);
    if (!user || user.subscriptionStatus !== 'active') {
      return res.status(403).json({ error: 'Active subscription required' });
    }
  }

  req.session = {
    userType: session.userType as 'team' | 'individual',
    userId: session.userId || undefined,
    accessLevel: session.accessLevel as 'admin' | 'editor' | 'viewer',
  };
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || req.session.accessLevel !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireEditor(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !['admin', 'editor'].includes(req.session.accessLevel || '')) {
    return res.status(403).json({ error: 'Editor access required' });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);
  
  // Register document analysis routes for AI-powered extraction
  registerDocumentAnalysisRoutes(app);

  // ========== AUTH ROUTES ==========
  
  // Team login
  app.post("/api/auth/team/login", async (req, res) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const { username, password } = validationResult.data;
      const teamCreds = await storage.verifyTeamLogin(username, password);
      
      if (!teamCreds) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const session = await storage.createSession('team', teamCreds.accessLevel);
      res.cookie('session_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, userType: 'team', accessLevel: teamCreds.accessLevel });
    } catch (error) {
      console.error("Error in team login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Team credentials setup (first time only - creates admin)
  app.post("/api/auth/team/setup", async (req, res) => {
    try {
      const existing = await storage.getTeamCredentials();
      if (existing) {
        return res.status(400).json({ error: 'Team credentials already exist' });
      }

      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const { username, password } = validationResult.data;
      const teamCreds = await storage.createTeamCredentials(username, password, 'admin');
      
      const session = await storage.createSession('team', 'admin');
      res.cookie('session_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, userType: 'team', accessLevel: 'admin' });
    } catch (error) {
      console.error("Error in team setup:", error);
      res.status(500).json({ error: "Setup failed" });
    }
  });

  // Check if team is set up
  app.get("/api/auth/team/status", async (_req, res) => {
    try {
      const existing = await storage.getTeamCredentials();
      res.json({ isSetup: !!existing });
    } catch (error) {
      console.error("Error checking team status:", error);
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Individual user registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Valid email and password (6+ characters) required' });
      }

      const { email, password } = validationResult.data;
      
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Individual users get 'admin' access by default (they're paying customers)
      const user = await storage.createUser(email, password, 'admin');
      const session = await storage.createSession('individual', user.accessLevel, user.id);
      
      res.cookie('session_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, userType: 'individual', userId: user.id, accessLevel: user.accessLevel, needsSubscription: true });
    } catch (error) {
      console.error("Error in registration:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Individual user login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const { email, password } = validationResult.data;
      const user = await storage.verifyUserLogin(email, password);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const session = await storage.createSession('individual', user.accessLevel, user.id);
      res.cookie('session_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ 
        success: true, 
        userType: 'individual', 
        userId: user.id,
        accessLevel: user.accessLevel,
        subscriptionStatus: user.subscriptionStatus,
        needsSubscription: user.subscriptionStatus !== 'active'
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (token) {
        await storage.deleteSession(token);
      }
      res.clearCookie('session_token');
      res.json({ success: true });
    } catch (error) {
      console.error("Error in logout:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current session
  app.get("/api/auth/session", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.json({ authenticated: false });
      }

      const session = await storage.getSessionByToken(token);
      if (!session) {
        return res.json({ authenticated: false });
      }

      if (session.userType === 'individual' && session.userId) {
        const user = await storage.getUserById(session.userId);
        return res.json({ 
          authenticated: true, 
          userType: 'individual',
          userId: session.userId,
          email: user?.email,
          accessLevel: session.accessLevel,
          subscriptionStatus: user?.subscriptionStatus,
          needsSubscription: user?.subscriptionStatus !== 'active'
        });
      }

      return res.json({ 
        authenticated: true, 
        userType: 'team',
        accessLevel: session.accessLevel
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // ========== TEAM MANAGEMENT ROUTES (Admin only) ==========
  
  // Get all team credentials (admin only)
  app.get("/api/admin/team-credentials", authMiddleware, requireAdmin, async (_req, res) => {
    try {
      const teams = await storage.getAllTeamCredentials();
      // Don't send password hashes
      const sanitized = teams.map(t => ({
        id: t.id,
        username: t.username,
        accessLevel: t.accessLevel,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching team credentials:", error);
      res.status(500).json({ error: "Failed to fetch team credentials" });
    }
  });

  // Create new team credentials (admin only)
  app.post("/api/admin/team-credentials", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(1),
        password: z.string().min(6),
        accessLevel: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Username, password (6+ chars), and access level required' });
      }

      const { username, password, accessLevel } = validationResult.data;
      
      // Check if username exists
      const existing = await storage.getTeamCredentialsByUsername(username);
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const creds = await storage.createTeamCredentials(username, password, accessLevel);
      res.json({
        id: creds.id,
        username: creds.username,
        accessLevel: creds.accessLevel,
        createdAt: creds.createdAt,
      });
    } catch (error) {
      console.error("Error creating team credentials:", error);
      res.status(500).json({ error: "Failed to create team credentials" });
    }
  });

  // Update team access level (admin only)
  app.patch("/api/admin/team-credentials/:id/access-level", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        accessLevel: z.enum(['admin', 'editor', 'viewer']),
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: 'Valid access level required' });
      }

      const { accessLevel } = validationResult.data;
      const id = req.params.id as string;
      const updated = await storage.updateTeamAccessLevel(id, accessLevel);
      
      if (!updated) {
        return res.status(404).json({ error: 'Team credentials not found' });
      }

      res.json({
        id: updated.id,
        username: updated.username,
        accessLevel: updated.accessLevel,
      });
    } catch (error) {
      console.error("Error updating team access level:", error);
      res.status(500).json({ error: "Failed to update access level" });
    }
  });

  // ========== STRIPE ROUTES ==========

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Get products and prices
  app.get("/api/stripe/products", async (_req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Create checkout session
  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID required' });
      }

      const stripe = await getUncachableStripeClient();
      
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: { userId: user.id },
      });

      res.json({ url: checkoutSession.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Verify subscription after checkout
  app.get("/api/stripe/verify-subscription", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const { session_id } = req.query;
      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ error: 'Session ID required' });
      }

      const stripe = await getUncachableStripeClient();
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      
      if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
        await storage.updateUserStripeInfo(session.userId, {
          stripeSubscriptionId: checkoutSession.subscription as string,
          subscriptionStatus: 'active',
        });
        return res.json({ success: true, subscriptionStatus: 'active' });
      }

      res.json({ success: false, subscriptionStatus: 'inactive' });
    } catch (error) {
      console.error("Error verifying subscription:", error);
      res.status(500).json({ error: "Failed to verify subscription" });
    }
  });

  // Customer portal
  app.post("/api/stripe/portal", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: 'No subscription found' });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // One-time payment checkout (for add-on services)
  app.post("/api/stripe/one-time-checkout", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: 'Price ID required' });
      }

      const stripe = await getUncachableStripeClient();
      
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${baseUrl}/billing?payment=success`,
        cancel_url: `${baseUrl}/billing`,
        metadata: { userId: user.id, type: 'one_time' },
        invoice_creation: { enabled: true },
      });

      res.json({ url: checkoutSession.url });
    } catch (error) {
      console.error("Error creating one-time checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Get user invoices
  app.get("/api/stripe/invoices", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user?.stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const stripe = await getUncachableStripeClient();
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 24,
      });

      res.json({
        invoices: invoices.data.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          amount_due: inv.amount_due,
          amount_paid: inv.amount_paid,
          currency: inv.currency,
          created: inv.created,
          invoice_pdf: inv.invoice_pdf,
          hosted_invoice_url: inv.hosted_invoice_url,
          description: inv.description || inv.lines.data[0]?.description || 'Invoice',
        }))
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  // Get subscription details
  app.get("/api/stripe/subscription", async (req, res) => {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const session = await storage.getSessionByToken(token);
      if (!session || session.userType !== 'individual' || !session.userId) {
        return res.status(401).json({ error: 'Individual account required' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const stripe = await getUncachableStripeClient();
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['items.data.price.product'],
      });

      const item = subscription.items.data[0];
      const price = item?.price;
      const product = price?.product as any;

      const sub = subscription as any;
      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_start: sub.current_period_start || item?.current_period_start || Math.floor(Date.now() / 1000),
          current_period_end: sub.current_period_end || item?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: subscription.cancel_at_period_end,
          product_name: product?.name || 'Subscription',
          price_amount: price?.unit_amount || 0,
          price_currency: price?.currency || 'usd',
          price_interval: price?.recurring?.interval || 'month',
        }
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Get one-time products (add-on services)
  app.get("/api/stripe/addons", async (req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        const metadata = row.product_metadata || {};
        if (metadata.type !== 'one_time') continue;
        
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            category: metadata.category || 'service',
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
          });
        }
      }

      res.json({ addons: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Error getting addons:", error);
      res.status(500).json({ error: "Failed to get add-on products" });
    }
  });

  // Apply auth middleware to all protected routes
  app.use('/api/adjusters', authMiddleware);
  app.use('/api/claims', authMiddleware);
  app.use('/api/carriers', authMiddleware);
  app.use('/api/documents', authMiddleware);
  app.use('/api/attachments', authMiddleware);
  app.use('/api/tactical-advice', authMiddleware);
  app.use('/api/tactical-notes', authMiddleware);
  
  // Get all adjusters
  app.get("/api/adjusters", async (_req, res) => {
    try {
      const adjusters = await storage.getAllAdjusters();
      res.json(adjusters);
    } catch (error) {
      console.error("Error fetching adjusters:", error);
      res.status(500).json({ error: "Failed to fetch adjusters" });
    }
  });

  // Search adjusters by name or carrier
  app.get("/api/adjusters/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }
      const adjusters = await storage.searchAdjusters(query);
      res.json(adjusters);
    } catch (error) {
      console.error("Error searching adjusters:", error);
      res.status(500).json({ error: "Failed to search adjusters" });
    }
  });

  // Create adjuster
  app.post("/api/adjusters", async (req, res) => {
    try {
      const validationResult = insertAdjusterSchema.safeParse(req.body);

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const adjuster = await storage.createAdjuster(validationResult.data);
      res.status(201).json(adjuster);
    } catch (error) {
      console.error("Error creating adjuster:", error);
      res.status(500).json({ error: "Failed to create adjuster" });
    }
  });

  // Get adjuster by ID with claims and interactions
  app.get("/api/adjusters/:id", async (req, res) => {
    try {
      const adjuster = await storage.getAdjuster(req.params.id);
      if (!adjuster) {
        return res.status(404).json({ error: "Adjuster not found" });
      }

      const claims = await storage.getClaimsByAdjuster(adjuster.id);
      const interactions = await storage.getInteractionsByAdjuster(adjuster.id);
      const documents = await storage.getDocumentsByAdjuster(adjuster.id);

      res.json({
        ...adjuster,
        claims,
        interactions,
        documents
      });
    } catch (error) {
      console.error("Error fetching adjuster:", error);
      res.status(500).json({ error: "Failed to fetch adjuster" });
    }
  });

  // Update adjuster
  app.patch("/api/adjusters/:id", async (req, res) => {
    try {
      const adjuster = await storage.updateAdjuster(req.params.id, req.body);
      if (!adjuster) {
        return res.status(404).json({ error: "Adjuster not found" });
      }
      res.json(adjuster);
    } catch (error) {
      console.error("Error updating adjuster:", error);
      res.status(500).json({ error: "Failed to update adjuster" });
    }
  });

  // Create interaction
  app.post("/api/adjusters/:id/interactions", async (req, res) => {
    try {
      const validationResult = insertInteractionSchema.safeParse({
        adjusterId: req.params.id,
        ...req.body
      });

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const interaction = await storage.createInteraction(validationResult.data);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // Delete adjuster
  app.delete("/api/adjusters/:id", async (req, res) => {
    try {
      await storage.deleteAdjuster(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting adjuster:", error);
      res.status(500).json({ error: "Failed to delete adjuster" });
    }
  });

  // Get adjuster intelligence stats
  app.get("/api/adjusters/:id/intelligence", async (req, res) => {
    try {
      const intel = await storage.getAdjusterIntelligence(req.params.id);
      if (!intel) {
        return res.status(404).json({ error: "Adjuster not found" });
      }
      res.json(intel);
    } catch (error) {
      console.error("Error fetching adjuster intelligence:", error);
      res.status(500).json({ error: "Failed to fetch adjuster intelligence" });
    }
  });

  // Get all carriers
  app.get("/api/carriers", async (_req, res) => {
    try {
      const carriers = await storage.getAllCarriers();
      res.json(carriers);
    } catch (error) {
      console.error("Error fetching carriers:", error);
      res.status(500).json({ error: "Failed to fetch carriers" });
    }
  });

  // Get carrier intelligence
  app.get("/api/carriers/:name/intelligence", async (req, res) => {
    try {
      const intel = await storage.getCarrierIntelligence(decodeURIComponent(req.params.name));
      if (!intel) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.json(intel);
    } catch (error) {
      console.error("Error fetching carrier intelligence:", error);
      res.status(500).json({ error: "Failed to fetch carrier intelligence" });
    }
  });

  // Create document for adjuster
  app.post("/api/adjusters/:id/documents", async (req, res) => {
    try {
      const validationResult = insertDocumentSchema.safeParse({
        adjusterId: req.params.id,
        ...req.body
      });

      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }

      const document = await storage.createDocument(validationResult.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Get all claims
  app.get("/api/claims", async (_req, res) => {
    try {
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Get all claim-adjuster relationships for risk analysis
  app.get("/api/claim-adjusters", authMiddleware, async (_req, res) => {
    try {
      const claimAdjusters = await storage.getAllClaimAdjusters();
      res.json(claimAdjusters);
    } catch (error) {
      console.error("Error fetching claim-adjusters:", error);
      res.status(500).json({ error: "Failed to fetch claim-adjusters" });
    }
  });

  // Get claim by ID with linked adjusters and interactions
  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      const adjusters = await storage.getAdjustersByClaimId(claim.id);
      const interactions = await storage.getInteractionsByClaimId(claim.id);
      res.json({ ...claim, adjusters, interactions });
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ error: "Failed to fetch claim" });
    }
  });

  // Create claim
  app.post("/api/claims", async (req, res) => {
    try {
      const validationResult = insertClaimSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }
      const claim = await storage.createClaim(validationResult.data);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ error: "Failed to create claim" });
    }
  });

  // Update claim
  app.patch("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.updateClaim(req.params.id, req.body);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ error: "Failed to update claim" });
    }
  });

  // Link adjuster to claim
  app.post("/api/claims/:id/adjusters", async (req, res) => {
    try {
      const { adjusterId } = req.body;
      if (!adjusterId) {
        return res.status(400).json({ error: "adjusterId is required" });
      }
      const link = await storage.linkAdjusterToClaim(req.params.id, adjusterId);
      res.status(201).json(link);
    } catch (error) {
      console.error("Error linking adjuster to claim:", error);
      res.status(500).json({ error: "Failed to link adjuster to claim" });
    }
  });

  // Get attachments for a claim
  app.get("/api/claims/:id/attachments", async (req, res) => {
    try {
      const attachments = await storage.getAttachmentsByClaimId(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  // Create attachment for a claim
  app.post("/api/claims/:id/attachments", async (req, res) => {
    try {
      const data = { ...req.body, claimId: req.params.id };
      
      // Validate type
      if (!['file', 'email'].includes(data.type)) {
        return res.status(400).json({ error: "Type must be 'file' or 'email'" });
      }
      
      // Validate required fields based on type
      if (data.type === 'file') {
        if (!data.objectPath || !data.filename) {
          return res.status(400).json({ error: "File attachments require objectPath and filename" });
        }
      } else if (data.type === 'email') {
        if (!data.subject || !data.body) {
          return res.status(400).json({ error: "Email attachments require subject and body" });
        }
        if (!['sent', 'received'].includes(data.direction)) {
          return res.status(400).json({ error: "Email direction must be 'sent' or 'received'" });
        }
      }
      
      const validationResult = insertAttachmentSchema.safeParse(data);
      if (!validationResult.success) {
        const validationError = fromError(validationResult.error);
        return res.status(400).json({ error: validationError.toString() });
      }
      const attachment = await storage.createAttachment(validationResult.data);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      res.status(500).json({ error: "Failed to create attachment" });
    }
  });

  // Get single attachment
  app.get("/api/attachments/:id", async (req, res) => {
    try {
      const attachment = await storage.getAttachment(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      res.json(attachment);
    } catch (error) {
      console.error("Error fetching attachment:", error);
      res.status(500).json({ error: "Failed to fetch attachment" });
    }
  });

  // Delete attachment
  app.delete("/api/attachments/:id", async (req, res) => {
    try {
      await storage.deleteAttachment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // Performance Summary KPIs
  app.get("/api/analytics/performance-summary", authMiddleware, async (_req, res) => {
    try {
      const summary = await storage.getPerformanceSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching performance summary:", error);
      res.status(500).json({ error: "Failed to fetch performance summary" });
    }
  });

  // Tactical Advisor endpoint
  app.post("/api/tactical-advice", async (req, res) => {
    try {
      const { adjusterId, claimId, situation, autoGenerate } = req.body;
      
      let context = "";
      let adjusterData: any = null;
      let claimData: any = null;
      let interactions: any[] = [];
      
      if (adjusterId) {
        adjusterData = await storage.getAdjuster(adjusterId);
        if (adjusterData) {
          context += `\nAdjuster: ${adjusterData.name} (${adjusterData.carrier})`;
          if (adjusterData.riskImpression) context += `\nRisk Assessment: ${adjusterData.riskImpression}`;
          if (adjusterData.whatWorked) context += `\nWhat has worked before: ${adjusterData.whatWorked}`;
          if (adjusterData.internalNotes) context += `\nNotes: ${adjusterData.internalNotes}`;
          
          // Get interactions for this adjuster for auto-generate
          if (autoGenerate) {
            interactions = await storage.getInteractionsByAdjuster(adjusterId);
            if (interactions.length > 0) {
              context += `\n\nRecent Interactions (${interactions.length} total):`;
              interactions.slice(0, 5).forEach((int: any) => {
                context += `\n- ${int.type}: ${int.summary || int.outcome || 'No details'}`;
              });
            }
          }
        }
      }
      
      if (claimId) {
        claimData = await storage.getClaim(claimId);
        if (claimData) {
          context += `\nClaim: ${claimData.maskedId} (${claimData.carrier})`;
          context += `\nStatus: ${claimData.status}`;
          if (claimData.notes) context += `\nClaim Notes: ${claimData.notes}`;
          
          // Get interactions for this claim for auto-generate
          if (autoGenerate) {
            const claimInteractions = await storage.getInteractionsByClaimId(claimId);
            if (claimInteractions.length > 0) {
              context += `\n\nClaim Interactions (${claimInteractions.length} total):`;
              claimInteractions.slice(0, 5).forEach((int: any) => {
                context += `\n- ${int.type}: ${int.summary || int.outcome || 'No details'}`;
              });
            }
          }
        }
      }

      // For auto-generate, we build a situation from the data
      let finalSituation = situation || "";
      
      if (autoGenerate) {
        if (!adjusterId && !claimId) {
          return res.status(400).json({ error: "Select an adjuster or claim to auto-generate advice" });
        }
        
        // Build auto-generated situation description
        const parts = [];
        if (adjusterData) {
          parts.push(`Working with ${adjusterData.name} from ${adjusterData.carrier}`);
          if (adjusterData.riskImpression) {
            parts.push(`Risk level: ${adjusterData.riskImpression}`);
          }
        }
        if (claimData) {
          parts.push(`Claim ${claimData.maskedId} with ${claimData.carrier}`);
          parts.push(`Current status: ${claimData.status}`);
        }
        
        finalSituation = `Auto-analysis request: ${parts.join('. ')}. Provide strategic advice for handling this ${claimData ? 'claim' : 'adjuster relationship'} based on the available data and interaction history.`;
      } else if (!situation) {
        return res.status(400).json({ error: "Situation description is required" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert insurance claims strategist helping public adjusters and contractors negotiate with insurance adjusters. Provide tactical advice based on the situation described.

You MUST return a valid JSON object with exactly this structure:
{
  "strategy": "A 2-3 sentence overview of the recommended strategic approach",
  "keyPoints": ["Array of 3-5 key points to remember"],
  "riskLevel": "low" or "medium" or "high",
  "suggestedActions": ["Array of 4-6 specific actionable steps to take"]
}

Base your advice on insurance industry best practices, policy interpretation, and negotiation tactics.`
          },
          {
            role: "user",
            content: `Situation: ${finalSituation}${context ? `\n\nContext:${context}` : ''}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let advice;
      try {
        advice = JSON.parse(content);
      } catch (parseError) {
        console.error("Error parsing AI response:", content);
        advice = {
          strategy: content,
          keyPoints: [],
          riskLevel: "medium",
          suggestedActions: []
        };
      }

      if (!advice.riskLevel) advice.riskLevel = "medium";
      if (!advice.keyPoints) advice.keyPoints = [];
      if (!advice.suggestedActions) advice.suggestedActions = [];

      res.json({ success: true, advice });
    } catch (error) {
      console.error("Error getting tactical advice:", error);
      res.status(500).json({ error: "Failed to get tactical advice" });
    }
  });

  // Tactical Notes routes - team shared notes
  app.get("/api/tactical-notes", async (req, res) => {
    try {
      const { claimId, adjusterId } = req.query;
      const notes = await storage.getTacticalNotes(
        claimId as string | undefined,
        adjusterId as string | undefined
      );
      res.json(notes);
    } catch (error) {
      console.error("Error fetching tactical notes:", error);
      res.status(500).json({ error: "Failed to fetch tactical notes" });
    }
  });

  app.post("/api/tactical-notes", requireEditor, async (req, res) => {
    try {
      const parsed = insertTacticalNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).message });
      }
      
      const { claimId, adjusterId, content } = parsed.data;
      
      if (!claimId && !adjusterId) {
        return res.status(400).json({ error: "Either claimId or adjusterId is required" });
      }
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }
      
      const note = await storage.createTacticalNote({
        ...parsed.data,
        content: content.trim(),
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating tactical note:", error);
      res.status(500).json({ error: "Failed to create tactical note" });
    }
  });

  app.put("/api/tactical-notes/:id", requireEditor, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }
      
      const note = await storage.updateTacticalNote(req.params.id as string, content.trim());
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error updating tactical note:", error);
      res.status(500).json({ error: "Failed to update tactical note" });
    }
  });

  app.delete("/api/tactical-notes/:id", requireEditor, async (req, res) => {
    try {
      await storage.deleteTacticalNote(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tactical note:", error);
      res.status(500).json({ error: "Failed to delete tactical note" });
    }
  });

  // Service request routes - public route for customers to submit requests
  app.post("/api/service-requests", async (req, res) => {
    try {
      const parsed = insertServiceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).message });
      }

      const request = await storage.createServiceRequest(parsed.data);
      res.status(201).json({ success: true, request });
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(500).json({ error: "Failed to create service request" });
    }
  });

  // Get contact email for customers
  app.get("/api/contact-info", (req, res) => {
    const contactEmail = process.env.CONTACT_EMAIL || "support@claimsignal.com";
    res.json({ email: contactEmail });
  });

  // Protected routes for admins to manage service requests
  app.get("/api/service-requests", authMiddleware, async (req, res) => {
    try {
      const requests = await storage.getAllServiceRequests();
      res.json({ requests });
    } catch (error) {
      console.error("Error fetching service requests:", error);
      res.status(500).json({ error: "Failed to fetch service requests" });
    }
  });

  app.get("/api/service-requests/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id as string;
      const request = await storage.getServiceRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json({ request });
    } catch (error) {
      console.error("Error fetching service request:", error);
      res.status(500).json({ error: "Failed to fetch service request" });
    }
  });

  app.patch("/api/service-requests/:id", authMiddleware, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { status, adminNotes } = req.body;
      const updated = await storage.updateServiceRequest(id, {
        status,
        adminNotes,
      });
      if (!updated) {
        return res.status(404).json({ error: "Service request not found" });
      }
      res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Error updating service request:", error);
      res.status(500).json({ error: "Failed to update service request" });
    }
  });

  // App settings routes
  app.get("/api/settings", authMiddleware, async (_req, res) => {
    try {
      const settings = await storage.getAllAppSettings();
      const settingsMap: Record<string, string | null> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      res.json({ settings: settingsMap });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", authMiddleware, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      if (!key) {
        return res.status(400).json({ error: "Key is required" });
      }
      const setting = await storage.setAppSetting(key, value, description);
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Error saving setting:", error);
      res.status(500).json({ error: "Failed to save setting" });
    }
  });

  app.put("/api/settings/bulk", authMiddleware, async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: "Settings object is required" });
      }
      const updated: Record<string, string | null> = {};
      for (const [key, value] of Object.entries(settings)) {
        const setting = await storage.setAppSetting(key, value as string);
        updated[key] = setting.value;
      }
      res.json({ success: true, settings: updated });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // Supplement routes
  app.get("/api/supplements", authMiddleware, async (_req, res) => {
    try {
      const supplements = await storage.getAllSupplements();
      res.json({ supplements });
    } catch (error) {
      console.error("Error fetching supplements:", error);
      res.status(500).json({ error: "Failed to fetch supplements" });
    }
  });

  app.get("/api/claims/:claimId/supplements", authMiddleware, async (req, res) => {
    try {
      const claimId = req.params.claimId as string;
      const supplements = await storage.getSupplementsByClaimId(claimId);
      res.json({ supplements });
    } catch (error) {
      console.error("Error fetching claim supplements:", error);
      res.status(500).json({ error: "Failed to fetch supplements" });
    }
  });

  app.get("/api/supplements/:id", authMiddleware, async (req, res) => {
    try {
      const supplement = await storage.getSupplement(req.params.id as string);
      if (!supplement) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      const lineItems = await storage.getLineItemsBySupplement(supplement.id);
      res.json({ supplement, lineItems });
    } catch (error) {
      console.error("Error fetching supplement:", error);
      res.status(500).json({ error: "Failed to fetch supplement" });
    }
  });

  app.post("/api/supplements", authMiddleware, async (req, res) => {
    try {
      const parsed = insertSupplementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).message });
      }
      const supplement = await storage.createSupplement(parsed.data);
      res.json({ success: true, supplement });
    } catch (error) {
      console.error("Error creating supplement:", error);
      res.status(500).json({ error: "Failed to create supplement" });
    }
  });

  app.patch("/api/supplements/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updateSupplement(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      res.json({ success: true, supplement: updated });
    } catch (error) {
      console.error("Error updating supplement:", error);
      res.status(500).json({ error: "Failed to update supplement" });
    }
  });

  app.delete("/api/supplements/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteSupplement(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Supplement not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting supplement:", error);
      res.status(500).json({ error: "Failed to delete supplement" });
    }
  });

  // Supplement line item routes
  app.post("/api/supplements/:supplementId/line-items", authMiddleware, async (req, res) => {
    try {
      const supplementId = req.params.supplementId as string;
      const parsed = insertSupplementLineItemSchema.safeParse({ ...req.body, supplementId });
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).message });
      }
      const lineItem = await storage.createLineItem(parsed.data);
      
      // Recalculate supplement totals
      const totals = await storage.calculateSupplementTotal(supplementId);
      await storage.updateSupplement(supplementId, {
        requestedAmount: totals.requestedTotal,
        approvedAmount: totals.approvedTotal,
      });
      
      res.json({ success: true, lineItem });
    } catch (error) {
      console.error("Error creating line item:", error);
      res.status(500).json({ error: "Failed to create line item" });
    }
  });

  app.patch("/api/line-items/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updateLineItem(req.params.id as string, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Line item not found" });
      }
      
      // Recalculate supplement totals
      const totals = await storage.calculateSupplementTotal(updated.supplementId);
      await storage.updateSupplement(updated.supplementId, {
        requestedAmount: totals.requestedTotal,
        approvedAmount: totals.approvedTotal,
      });
      
      res.json({ success: true, lineItem: updated });
    } catch (error) {
      console.error("Error updating line item:", error);
      res.status(500).json({ error: "Failed to update line item" });
    }
  });

  app.delete("/api/line-items/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteLineItem(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Line item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting line item:", error);
      res.status(500).json({ error: "Failed to delete line item" });
    }
  });

  // Calculate claim supplement totals
  app.get("/api/claims/:claimId/supplement-totals", authMiddleware, async (req, res) => {
    try {
      const claimId = req.params.claimId as string;
      const supplements = await storage.getSupplementsByClaimId(claimId);
      
      let totalRequested = 0;
      let totalApproved = 0;
      
      for (const supp of supplements) {
        totalRequested += supp.requestedAmount || 0;
        totalApproved += supp.approvedAmount || 0;
      }
      
      res.json({
        claimId,
        totalSupplements: supplements.length,
        totalRequested,
        totalApproved,
        pendingAmount: totalRequested - totalApproved,
      });
    } catch (error) {
      console.error("Error calculating supplement totals:", error);
      res.status(500).json({ error: "Failed to calculate totals" });
    }
  });

  // ============ Case Studies Routes ============
  
  // Get all case studies
  app.get("/api/case-studies", authMiddleware, async (_req, res) => {
    try {
      const studies = await storage.getAllCaseStudies();
      res.json({ caseStudies: studies });
    } catch (error) {
      console.error("Error fetching case studies:", error);
      res.status(500).json({ error: "Failed to fetch case studies" });
    }
  });

  // Get single case study
  app.get("/api/case-studies/:id", authMiddleware, async (req, res) => {
    try {
      const study = await storage.getCaseStudy(req.params.id as string);
      if (!study) {
        return res.status(404).json({ error: "Case study not found" });
      }
      res.json(study);
    } catch (error) {
      console.error("Error fetching case study:", error);
      res.status(500).json({ error: "Failed to fetch case study" });
    }
  });

  // Create case study
  app.post("/api/case-studies", authMiddleware, async (req, res) => {
    try {
      const caseId = await storage.getNextCaseStudyId();
      const parsed = insertCaseStudySchema.safeParse({ ...req.body, caseId });
      if (!parsed.success) {
        return res.status(400).json({ error: fromError(parsed.error).message });
      }
      const study = await storage.createCaseStudy(parsed.data);
      res.status(201).json(study);
    } catch (error) {
      console.error("Error creating case study:", error);
      res.status(500).json({ error: "Failed to create case study" });
    }
  });

  // Update case study
  app.patch("/api/case-studies/:id", authMiddleware, async (req, res) => {
    try {
      const study = await storage.updateCaseStudy(req.params.id as string, req.body);
      if (!study) {
        return res.status(404).json({ error: "Case study not found" });
      }
      res.json(study);
    } catch (error) {
      console.error("Error updating case study:", error);
      res.status(500).json({ error: "Failed to update case study" });
    }
  });

  // Delete case study
  app.delete("/api/case-studies/:id", authMiddleware, async (req, res) => {
    try {
      await storage.deleteCaseStudy(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting case study:", error);
      res.status(500).json({ error: "Failed to delete case study" });
    }
  });

  // Auto-generate case study from claim using AI
  app.post("/api/case-studies/generate-from-claim/:claimId", authMiddleware, async (req, res) => {
    try {
      const claimId = req.params.claimId as string;
      const claim = await storage.getClaim(claimId);
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }

      // Get all interactions for this claim to build the story
      const interactions = await storage.getInteractionsByClaimId(claimId);
      const supplements = await storage.getSupplementsByClaimId(claimId);
      const adjusters = await storage.getAdjustersByClaimId(claimId);

      // Count denials and friction signals
      const denialInteractions = interactions.filter(i => 
        i.description?.toLowerCase().includes('denied') || 
        i.outcome?.toLowerCase().includes('denied')
      );
      
      const frictionSignals: string[] = [];
      const actionsTaken: string[] = [];
      
      interactions.forEach(i => {
        if (i.description?.toLowerCase().includes('denied') || i.description?.toLowerCase().includes('rejected')) {
          frictionSignals.push(i.description.substring(0, 100));
        }
        if (i.type === 'Escalation' || i.type === 'Re-inspection') {
          actionsTaken.push(`${i.type}: ${i.description?.substring(0, 100) || 'No details'}`);
        }
      });

      // Calculate total recovered from supplements
      const totalRecovered = supplements.reduce((sum, s) => sum + (s.approvedAmount || 0), 0);

      const caseId = await storage.getNextCaseStudyId();
      const study = await storage.createCaseStudy({
        caseId,
        title: `${claim.maskedId} - ${claim.carrier} claim ${claim.status === 'resolved' ? 'approved' : 'in progress'}`,
        carrier: claim.carrier,
        region: claim.propertyAddress?.split(',').pop()?.trim() || undefined,
        claimType: 'general',
        outcome: claim.status === 'resolved' ? 'approved' : 'partial',
        summary: claim.notes || `Claim at ${claim.propertyAddress || 'property'}`,
        frictionSignals: frictionSignals.length > 0 ? frictionSignals : undefined,
        actionsTaken: actionsTaken.length > 0 ? actionsTaken : undefined,
        denialsOvercome: denialInteractions.length,
        amountRecovered: totalRecovered > 0 ? totalRecovered : undefined,
        linkedClaimId: claim.id,
        linkedAdjusterId: adjusters[0]?.id || undefined,
      });

      res.status(201).json(study);
    } catch (error) {
      console.error("Error generating case study:", error);
      res.status(500).json({ error: "Failed to generate case study" });
    }
  });

  return httpServer;
}
