# ClaimSignal

## Overview

ClaimSignal is a private adjuster risk analysis and claim intelligence dashboard. It enables insurance professionals to track, analyze, and manage interactions with insurance adjusters, log claims, and store related documents. The application provides a searchable database of adjusters with behavioral profiles, interaction history, and document management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### Authentication System
- **Team Login**: Shared credentials for team access - all team members use same username/password
- **Individual Login**: Personal accounts with email/password requiring paid Stripe subscription
- Session-based auth with HTTP-only cookies (7-day expiry)
- Auth middleware protects all `/api/adjusters`, `/api/claims`, `/api/carriers`, `/api/documents`, `/api/attachments`, and `/api/tactical-advice` routes

### Stripe Integration
- Stripe payments for individual subscriptions
- Webhook handling syncs subscription status from Stripe events
- Checkout session flow with verify-subscription endpoint
- Customer portal for managing subscriptions

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