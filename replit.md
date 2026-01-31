# ClaimSignal

## Overview

ClaimSignal is a private adjuster risk analysis and claim intelligence dashboard. It enables insurance professionals to track, analyze, and manage interactions with insurance adjusters, log claims, and store related documents. The application provides a searchable database of adjusters with behavioral profiles, interaction history, and document management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

### Document Processing Rules
- **Always check for duplicates** before adding new claims, adjusters, or interactions from uploaded documents
- Check by: claim number, adjuster name, property address, homeowner name
- If duplicate found: Do not add again, inform user it already exists
- If not duplicate: Add new adjuster/claim/interaction to the database
- Link adjusters to claims via claim_adjusters junction table
- Log interactions with dates and outcomes from document content

### Duplicate Detection & Merge Rules (Updated 2026-01-31)

**Adjuster Duplicates:**
- Match by: name (case-insensitive) + carrier
- If duplicate: Merge notes/interactions into existing adjuster, do not create new

**Claim Duplicates:**
- Match by: masked_id OR (property_address + homeowner_name)
- If duplicate: Update existing claim, do not create new

**Interaction Duplicates:**
- Match by: adjuster_id + claim_id + date + type + similar description (>80% match)
- If duplicate: Skip, do not add again

**Known Cleaned Duplicates (2026-01-31):**
- Removed duplicate claim `01-88W1-94C` (kept ID: 3bd88fb8-f1a7-45d1-bf24-ff0932242511)
- Removed duplicate claim `H0001064902` (kept ID: 1e00d13b-f5ef-4b8c-8ed5-5527a3653bce)
- Removed duplicate interaction for William Farris on 2025-10-01 (kept ID: 795af0ab-ace2-4c98-bfc1-618da36dce39)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, Zustand for client state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **UI Components**: Radix UI primitives wrapped with shadcn/ui styling

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Development**: tsx for TypeScript execution, Vite dev server for frontend HMR

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync
- **Connection**: `db/index.ts` initializes the database pool using `DATABASE_URL`

### Key Data Models
- **Adjusters**: Insurance adjusters with carrier info, notes, and risk impressions
- **Claims**: Claim records with masked IDs, carrier, status, and dates
- **Interactions**: Logged interactions between adjusters and claims (emails, calls, etc.)
- **Documents**: File attachments linked to adjusters
- **ClaimAdjusters**: Junction table linking claims to adjusters (many-to-many)
- **TeamCredentials**: Shared team login credentials (username/password hash)
- **Users**: Individual user accounts with Stripe subscription info
- **Sessions**: Active user sessions with tokens and expiry

### Claim Status Workflow (Key Feature)
Claim statuses show the lifecycle of fighting insurance denials:
- **Open** (blue) - Active claim being worked
- **Approved** (emerald green) - Straightforward approval
- **Overturned** (amber/gold) - **KEY STATUS** - Won after initial denial, proves the fight was worth it
- **Resolved** (green) - Claim fully closed/settled
- **Denied** (red) - Currently denied by carrier
- **In Litigation** (orange) - Legal action in progress

Quick action: When a claim is "Denied", a prominent button appears to mark it as "Overturned (Won!)"

### Privacy Protection
- **Team users** (admin login): See all data clearly - full claim numbers, homeowner names, addresses
- **Individual users** / non-authenticated: See masked data with toggle to reveal
- Masking format: Claim "0001064902" → "***-4902", Name "John Smith" → "J*** S***"
- Uses `PrivacyText` component in `client/src/components/privacy-text.tsx`

### Authentication System
- **Team Login**: Shared credentials for team access - all team members use same username/password
- **Individual Login**: Personal accounts with email/password requiring paid Stripe subscription
- Session-based auth with HTTP-only cookies (7-day expiry)
- Auth middleware protects all `/api/adjusters`, `/api/claims`, `/api/carriers`, `/api/documents`, `/api/attachments`, and `/api/tactical-advice` routes

### Stripe Integration
- **Subscription Products**: ClaimSignal Pro ($49/month, $499/year) and Enterprise ($199/month, $1999/year)
- **One-time Add-ons**: Expert Claim Review ($299), Carrier Intelligence Report ($99), Training Session ($149)
- **stripe-replit-sync**: Handles webhook processing and database sync with stripe schema
- Checkout session flow with verify-subscription endpoint
- Customer portal for managing subscriptions
- **Billing Page** (/billing): View subscription, invoices, and purchase add-ons
- **Seed Script**: `scripts/seed-stripe-products.ts` creates products in Stripe

### Stripe Routes
- GET `/api/stripe/config` - Publishable key
- GET `/api/stripe/products` - Subscription products with prices
- GET `/api/stripe/addons` - One-time purchase products
- GET `/api/stripe/subscription` - User's current subscription details
- GET `/api/stripe/invoices` - User's invoice history
- POST `/api/stripe/checkout` - Create subscription checkout
- POST `/api/stripe/one-time-checkout` - Create one-time payment checkout
- GET `/api/stripe/verify-subscription` - Verify subscription after checkout
- POST `/api/stripe/portal` - Customer billing portal

### File Upload System
- Uses Uppy for client-side file management with dashboard modal UI
- Presigned URL upload flow via Google Cloud Storage
- Object storage integration in `server/replit_integrations/object_storage/`

### Build Process
- Custom build script at `script/build.ts`
- Client builds to `dist/public` via Vite
- Server bundles with esbuild to `dist/index.cjs`
- Selected dependencies are bundled for faster cold starts

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Cloud Storage
- **Google Cloud Storage**: File uploads via `@google-cloud/storage`
- Uses Replit sidecar endpoint for credential management (`http://127.0.0.1:1106`)

### File Upload
- **Uppy**: Client-side file upload library with AWS S3 compatible presigned URLs
- Dashboard modal for file selection and upload progress

### UI Framework
- **shadcn/ui**: Pre-styled component library using Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for page transitions

### Key Runtime Dependencies
- Express for HTTP server
- TanStack React Query for data fetching
- Zod for validation with drizzle-zod integration
- date-fns for date formatting

## Analytics Features

### Performance Summary (/analytics)
- Global KPIs: Supplement Success %, Re-inspection Win %, Escalation Success %, Avg Time to Approval
- API: GET `/api/analytics/performance-summary`

### Risk Alerts (/risk-alerts)
- Calculates risk scores (0-100) from adjuster behavior
- Color-coded classification: RED (70+), YELLOW (50-69), GREEN (<50)
- Carrier breakdown with visual stats

### Case Studies (/case-studies)
- Auto-generated from claim interactions
- Friction signals and actions tracking with chip/tag inputs
- Turning points for documentation

### Carrier Intelligence (/carriers/:name)
- Carrier-level metrics: Risk Score, Supplement Success Rate, Re-inspection Win Rate
- Resolution tendency analysis
- Friction level assessment
- API: GET `/api/carriers/:name/intelligence`

### Adjuster Behavioral Performance
- Risk Score (0-100, color coded)
- Responsiveness Score (based on avg days to resolution)
- Cooperation Level (High/Moderate/Low)
- Supplement Approval Rate
- Avg Interactions Per Claim
- API: GET `/api/adjusters/:id/intelligence`

### Tactical Advisor (/tactical-advisor)
- AI-powered claim strategy recommendations
- Team Notes: Shared notes for claims/adjusters that all team members can view and add
- Auto-save AI advice as team notes
- Tabbed interface: AI Advice | Team Notes
- API: POST `/api/tactical-advice`, GET/POST/PUT/DELETE `/api/tactical-notes`

## Addon Purchase System

### One-Time Add-ons
- Expert Claim Review ($299) - Professional review of complex claims
- Carrier Intelligence Report ($99) - Detailed carrier behavior analysis
- Training Session ($149) - Team training session booking

### Admin Panel (/admin/addons)
- View pending addon purchases with user email and product info
- Fulfill or cancel purchases with status tracking
- Notification badge shows count of pending purchases
- Status values: pending, fulfilled, cancelled

### Email Notifications
- Currently using in-app admin panel for purchase alerts
- No automated email integration (user declined SendGrid/Resend)
- Admin checks /admin/addons panel for new purchases

## Free Trial System

### Trial Features
- 12-hour duration from signup
- Viewer-only access (read-only data)
- No AI features (tactical advisor restricted)
- Masked data (privacy protected view)
- Stored in sessions table with userType='trial'

### Trial Flow
1. User clicks "12-Hour Free Trial" on home page
2. Session created with 12-hour expiration
3. User redirected to dashboard with limited access
4. After expiration, session becomes invalid
5. User can upgrade to paid plan anytime