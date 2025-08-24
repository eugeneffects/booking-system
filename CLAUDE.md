# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15** TypeScript application implementing a lottery-based accommodation booking system (숙소예약 추첨 시스템) for company employees. The system uses **Supabase** for authentication, database, and storage.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production  
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

### Database
```bash
npm run supabase:types # Generate TypeScript types from Supabase schema
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage), Server Actions
- **Email**: Nodemailer with SMTP
- **State**: React Context (AuthProvider)

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes group
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   └── applications/      # User application pages
├── components/
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── lib/
│   ├── actions/           # Server actions for CRUD operations
│   ├── auth/              # Authentication utilities
│   ├── email/             # Email service and templates
│   └── supabase/          # Supabase client configurations
└── types/                 # TypeScript definitions
```

### Authentication Flow
- Uses Supabase Auth with email/password
- `AuthProvider` wraps the app for global auth state
- `useAuth` hook provides auth operations
- Server-side auth utilities for API routes
- Row Level Security (RLS) policies enforce data access

### Data Layer Patterns
- Type-safe operations using generated Supabase types
- Server Actions in `lib/actions/` for database operations:
  - `accommodation.ts` - 숙소 관리
  - `application.ts` - 신청 관리  
  - `employee.ts` - 직원 관리
  - `lottery.ts` - 추첨 관리
- Separate Supabase clients for browser vs server operations

### UI Architecture
- App Router with route groups for logical organization
- `MainLayout` component provides consistent structure
- Reusable UI components in `components/ui/`
- Korean language used for business logic and UI
- Tailwind CSS with custom configuration

## Important Implementation Details

### Path Aliases
- `@/*` resolves to `./src/*` in both TypeScript and Next.js webpack config

### Email System
- Nodemailer configured for SMTP (default: Gmail)
- Email templates in `lib/email/templates/`
- Korean-language email notifications for lottery results

### File Uploads
- Employee data via Excel upload using `react-dropzone` and `xlsx`
- Accommodation images stored in Supabase Storage

### Database Schema
- 7 migration files in `supabase/migrations/`
- Key tables: employees, accommodations, reservation_periods, applications, lottery_results
- RLS policies enforce data security

### Environment Variables
Required for development:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
SMTP_USER=
SMTP_PASSWORD=
ADMIN_EMAIL=
```

## Development Guidelines

### Code Conventions (from DEVELOPMENT.md)
- Use TypeScript strict mode
- Korean comments for business logic, English for technical
- Server Actions for database mutations
- Consistent error handling with toast notifications
- Follow existing component patterns in `components/ui/`

### Testing
- Check codebase for existing test patterns before adding tests
- Verify functionality through the application UI

### Git Workflow
- Follow conventional commit format specified in DEVELOPMENT.md
- Do not commit environment files or sensitive data