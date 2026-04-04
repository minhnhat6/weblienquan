# Tạp Hóa ACC - Gaming Account Marketplace

E-commerce platform for buying and selling gaming accounts (Liên Quân Mobile). Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Features

### Client Area
- 🎮 Browse and purchase gaming accounts
- 💰 Wallet system with balance management
- 📝 Order history and tracking
- 🎰 Lucky spin wheel with rewards
- 📦 Account consignment submissions
- 👥 Affiliate program

### Admin Panel
- 📊 Dashboard with sales analytics
- 📦 Product and inventory management
- 💳 Recharge request approvals
- 👥 User management
- ⚙️ Site settings configuration
- 🔐 Secure session-based authentication

## Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: bcrypt + HMAC-signed sessions
- **Security**: Rate limiting, CSP, CSRF protection

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/weblienquan.git
cd weblienquan

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

See `.env.example` for all required variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | 32+ char secret for session signing | Yes (prod) |
| `ADMIN_USERNAME` | Admin login username | Yes (prod) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password | Yes (prod) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | Optional |
| `REDIS_URL` | Redis URL for rate limiting | Optional |

Generate admin password hash:
```bash
node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run optimize-images  # Compress images in public/
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/          # Admin panel pages
│   ├── api/            # API routes
│   ├── client/         # Client-facing pages
│   └── components/     # Page-specific components
├── components/         # Shared React components
├── lib/               # Core utilities
│   ├── auth.tsx       # Client auth context
│   ├── security.ts    # Security utilities
│   ├── rate-limiter.ts # Rate limiting
│   └── server-session.ts # Admin session management
└── test/              # Test setup files
```

## Security

- ✅ bcrypt password hashing
- ✅ HMAC-signed session tokens
- ✅ Rate limiting on all endpoints
- ✅ CSRF protection
- ✅ Content Security Policy
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ Path traversal protection

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Deployment

### Production Checklist

1. Set all required environment variables
2. Generate strong `SESSION_SECRET` (32+ random chars)
3. Set `ADMIN_PASSWORD_HASH` (never use plain password)
4. Enable HTTPS
5. Configure Cloudflare Turnstile for CAPTCHA
6. Set up PostgreSQL with proper credentials
7. Run `npm run build` and `npm run start`

### Docker

```bash
docker build -t weblienquan .
docker run -p 3000:3000 --env-file .env weblienquan
```

## License

Private - All rights reserved.
