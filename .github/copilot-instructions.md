# Copilot Instructions for weblienquan

## Project Overview

This is a Next.js 16.2 e-commerce application for selling gaming accounts (Liên Quân Mobile). It uses TypeScript, React 19, Tailwind CSS 4, and includes both client-facing pages and an admin panel with session-based authentication.

**Key features:**
- Client area: browse products, purchase accounts, view orders, recharge balance, submit consignments
- Admin panel: manage products, orders, recharges, account stock, reconciliation, settings
- Middleware-protected `/admin/*` routes with session-based auth
- Security headers configured in `next.config.ts`

## Build, Test, and Lint Commands

```bash
# Development
npm run dev                 # Start dev server on http://localhost:3000

# Build
npm run build              # Production build

# Linting
npm run lint               # Run ESLint (uses eslint.config.mjs)

# Testing
npm run test               # Run Vitest unit tests (runs all tests in src/**/*.{test,spec}.{ts,tsx})
npm run test:watch         # Run Vitest in watch mode
npm run test:e2e           # Run Playwright e2e tests (automatically starts dev server)

# Run specific tests
npx vitest run src/lib/auth.test.tsx              # Run single unit test file
npx playwright test tests/e2e/smoke.spec.ts       # Run single e2e test file
npx playwright test --ui                          # Run e2e tests in UI mode
```

## Architecture

### Directory Structure

- `src/app/` - App Router pages (Next.js 13+ pattern)
  - `src/app/client/*` - Client-facing pages (orders, recharge, consignments)
  - `src/app/admin/*` - Admin panel pages (protected by middleware)
  - `src/app/api/*` - API routes (auth, upload, telemetry)
- `src/components/` - React components (Header, Footer, AdminLayout, RequireAuth, etc.)
- `src/lib/` - Core logic modules (auth, security, data, reconciliation, backup, observability, settings)
- `src/test/` - Test setup files
- `tests/e2e/` - Playwright e2e tests
- `middleware.ts` - Route protection for `/admin/*` paths

### Authentication Architecture

**Two auth systems:**

1. **Client auth** (`src/lib/auth.tsx`)
   - Client-side React Context for user state
   - Uses localStorage for persistence (transitioning to server-side)
   - Handles user registration, login, balance, orders, transactions
   
2. **Admin auth** (`src/lib/server-session.ts`)
   - Server-side HMAC-signed session tokens
   - Cookie name: `slq_admin_session`
   - Protected by middleware (`middleware.ts`) for all `/admin/*` routes
   - Uses Web Crypto API for signing (works in Edge Runtime)

**Important:** The codebase is currently transitioning from client-side localStorage to server-side data storage (see PLAN_GO_LIVE.md P0.1). New features should use server-side APIs.

### Data Layer (`src/lib/data.ts`)

Currently JSON-based with localStorage. Key types:
- `User` - User account with balance, orders, transactions
- `Product` - Game accounts with stats (winRate, totalGold, heroes, skins, gems, rank)
- `Order` - Purchase orders
- `Transaction` - Balance changes (recharge, purchase)
- `AccountStock` - Available accounts per product
- `PendingRecharge` - Recharge requests awaiting admin approval
- `ConsignmentItem` - User-submitted accounts for sale

### Security Features (`src/lib/security.ts`)

- Rate limiting for login attempts (tracked per username)
- Input sanitization and validation
- XSS protection via obfuscation utils
- Session validation with timing-safe comparison
- CSRF protection via SameSite cookies

### Path Aliases

`@/*` resolves to `src/*` (configured in tsconfig.json and vitest.config.ts)

## Key Conventions

### Component Patterns

- **Client components**: Use `'use client'` directive for components that need React hooks or browser APIs
- **Server components**: Default in App Router; use for static content and data fetching
- **Auth components**: `RequireAuth` (client), `AdminLayout` (admin panel wrapper)

### API Route Pattern

API routes return JSON with structure:
```typescript
{ success: true, data: ... }           // Success
{ success: false, error: 'message' }   // Error
```

### Admin Route Protection

All `/admin/*` routes are protected by `middleware.ts`:
1. Checks for `slq_admin_session` cookie
2. Verifies HMAC signature and expiration
3. Redirects to `/admin/login?redirect=<path>` if unauthorized

### Testing Patterns

- **Unit tests**: Co-located with source files (`*.test.ts`, `*.test.tsx`)
- **Test setup**: `src/test/setup.ts` configures jsdom and testing-library
- **E2E tests**: Use Playwright with auto-starting dev server (port 3000)

### State Management

- Client auth: React Context (`AuthProvider` in `src/lib/auth.tsx`)
- Admin state: Direct API calls (no global state management)
- Transitioning to server-side data storage (see PLAN_GO_LIVE.md)

### Security Review Status

See `SECURITY_REVIEW_SPRINT4.md` for latest security audit findings. Priority items:
- P0: Server-side data source, auth hardening, upload API protection, SSR hydration
- P1: Test automation and quality gates
- P2: Monitoring, logging, runbooks

### Observability (`src/lib/observability.ts`)

Use `logBusinessEvent()` for tracking important actions:
```typescript
logBusinessEvent('user_registered', { userId, username });
logBusinessEvent('order_created', { orderId, userId, productId, amount });
```

## File Upload

Upload API at `src/app/api/upload/route.ts`:
- Accepts image files for product images
- **Security note**: Currently needs auth enforcement (see PLAN_GO_LIVE.md P0.3)
- Stores in `/public/uploads/`

## Environment Variables

- `SESSION_SECRET` - HMAC secret for admin sessions (defaults to dev secret)
- Production deployment: Set `SESSION_SECRET` to strong random value

## Important Notes

- **Hydration**: Components using localStorage/client state must handle SSR carefully (check mounted state)
- **Middleware**: Runs on Edge Runtime - use Web Crypto API, not Node.js crypto
- **Admin prefix**: All admin features use `/admin/*` prefix for consistent protection
- **Vietnamese content**: UI contains Vietnamese text (gaming account marketplace for Vietnam)
