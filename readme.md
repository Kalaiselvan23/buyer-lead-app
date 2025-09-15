# Real Estate Buyer Leads Management System

A comprehensive full-stack application for managing real estate buyer leads with advanced search, filtering, CSV import/export, and complete audit trail functionality.

**Live Link**: https://buyer-lead-app-khaki.vercel.app/login

**Api Doc**: https://documenter.getpostman.com/view/25063121/2sB3HqGHvQ

## 🚀 Features

### Core Functionality
- **Lead Management**: Complete CRUD operations for buyer leads
- **Advanced Search & Filtering**: Real-time search with multiple filter combinations
- **CSV Import/Export**: Bulk operations with validation and error handling
- **History Tracking**: Complete audit trail with field-level change tracking
- **Authentication**: Secure JWT-based authentication with magic link support
- **Responsive Design**: Mobile-friendly interface with modern UI components

### Business Features
- **Property Type Management**: Support for apartments, villas, plots, and commercial properties
- **Location Coverage**: Chandigarh, Mohali, Panchkula, and Zirakpur
- **Budget Range Handling**: Flexible budget management with proper formatting
- **Lead Status Tracking**: New, contacted, interested, not interested, closed
- **Tag System**: Categorize leads with custom tags
- **Timeline Management**: Track buyer urgency (immediate, 1-3 months, 3-6 months, 6+ months)

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Validation**: Zod for schema validation
- **CSV Processing**: csv-parse, csv-stringify

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## ⚙️ Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_leads_db"

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-key-here"

# Optional: Email configuration for magic links
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
\`\`\`

### 2. Database Setup

\`\`\`bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
\`\`\`

### 3. Running Locally

\`\`\`bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Database management
npm run db:studio  # Open Prisma Studio
\`\`\`

The application will be available at `http://localhost:3000`

### 4. Default Login

For development, use the demo login:
- **Email**: `demo@example.com`
- **Password**: Any password (demo mode)

## ⚠️ Important Setup Notes

### Prisma Client Generation Required

If you see an error like `"@prisma/client" module does not provide an export named "PrismaClient"`, you need to generate the Prisma client:

\`\`\`bash
# Generate the Prisma client (required before first run)
npm run db:generate

# Or use the direct command
npx prisma generate
\`\`\`

This step is **required** before running the application for the first time.

## 🏗 Architecture & Design Notes

### Validation Strategy
- **Client-side**: Real-time form validation using Zod schemas
- **Server-side**: API route validation for data integrity
- **Business Rules**: BHK required for apartments/villas, budget validation, phone format checking
- **Location**: `lib/validations.ts` contains all validation schemas

### SSR vs Client Components
- **Server Components**: Used for data fetching, initial page loads, and SEO-critical content
- **Client Components**: Interactive forms, search interfaces, and real-time updates
- **Hybrid Approach**: Server Components for shell, Client Components for interactivity

### Ownership Enforcement
- **Middleware**: Route-level authentication protection (`middleware.ts`)
- **API Routes**: User-based data filtering and access control
- **Database**: User ID foreign keys ensure data isolation
- **UI**: Conditional rendering based on user permissions

### State Management
- **URL State**: Search params for filters, pagination, and sorting
- **Server State**: Prisma queries with proper caching
- **Form State**: React Hook Form with Zod validation
- **No Global State**: Leverages Next.js server components and URL state

### Database Design
- **Audit Trail**: `BuyerHistory` table tracks all changes with JSON diffs
- **Enums**: Strongly typed enums for cities, property types, statuses
- **Relationships**: Proper foreign keys with cascade deletes
- **Indexing**: Optimized queries for search and filtering

## 📊 What's Implemented

### ✅ Core Features
- [x] Complete CRUD operations for buyer leads
- [x] Advanced search with debounced input
- [x] Multi-field filtering (city, property type, status, timeline)
- [x] Server-side pagination with configurable page sizes
- [x] CSV import with validation and error reporting
- [x] CSV export with field selection
- [x] Complete audit trail and history tracking
- [x] JWT-based authentication with secure cookies
- [x] Responsive design with mobile support
- [x] Form validation with real-time feedback
- [x] Tag management system
- [x] Status management with visual indicators

### ✅ Technical Implementation
- [x] Prisma ORM with PostgreSQL
- [x] TypeScript throughout for type safety
- [x] Server Components for performance
- [x] API routes with proper error handling
- [x] Middleware for authentication
- [x] Zod validation schemas
- [x] shadcn/ui component library
- [x] Tailwind CSS v4 styling
- [x] Loading states and error boundaries

### ⚠️ Simplified/Skipped Features

#### Magic Link Authentication
- **Status**: Simulated (demo login available)
- **Reason**: Requires SMTP configuration and email service setup
- **Implementation**: Framework exists, needs email service integration

#### Advanced Permissions
- **Status**: Basic ownership model implemented
- **Reason**: Requirements specified simple user-based access
- **Future**: Role-based permissions can be added to User model

#### Real-time Updates
- **Status**: Not implemented
- **Reason**: Not specified in requirements
- **Alternative**: Manual refresh, could add WebSocket/SSE later

#### File Attachments
- **Status**: Not implemented  
- **Reason**: Not in original requirements
- **Future**: Could add document upload for buyer profiles

#### Advanced Analytics
- **Status**: Basic filtering only
- **Reason**: Focus on core CRUD functionality
- **Future**: Dashboard with charts and metrics

## 🔧 Development Commands

\`\`\`bash
# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:studio     # Open database GUI
npm run db:seed       # Seed with sample data

# Development
npm run dev           # Start development server
npm run build         # Production build
npm run lint          # Run ESLint
\`\`\`

## 📁 Project Structure

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── buyers/            # Buyer management pages
│   ├── login/             # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── buyers/           # Buyer-specific components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Database client
│   └── validations.ts    # Zod schemas
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
\`\`\`

## 🚀 Deployment

The application is ready for deployment on Vercel or any Node.js hosting platform:

1. Set environment variables in your hosting platform
2. Ensure PostgreSQL database is accessible
3. Run database migrations in production
4. Deploy with `npm run build`
