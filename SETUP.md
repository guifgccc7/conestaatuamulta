# Contesta a Tua Multa — Setup Guide

## Prerequisites

- Node.js 18+ (`brew install node`)
- PostgreSQL 14+ (`brew install postgresql@16`)
- A Stripe account (test mode is enough to start)
- Optional: Google OAuth credentials (for Google login)

---

## 1. Install Dependencies

```bash
cd /Users/Gui/Desktop/conestaatuamulta
npm install
```

---

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

### Required (minimum to run)

```env
# PostgreSQL — replace with your local credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/conestaatuamulta"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-generated-secret-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."        # see step 5
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_SINGLE_DOC="price_..."      # see step 4
STRIPE_PRICE_SUBSCRIPTION="price_..."   # see step 4

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Optional (for Google login)

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Optional (for email delivery)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="app-password"
EMAIL_FROM="Contesta a Tua Multa <noreply@conestaatuamulta.pt>"
```

---

## 3. Set Up the Database

### Start PostgreSQL (macOS)

```bash
brew services start postgresql@16
```

### Create the database

```bash
createdb conestaatuamulta
```

### Push schema and generate Prisma client

```bash
npm run db:push       # applies schema to DB
```

### Seed initial legal templates

```bash
npm run db:seed
```

To inspect the database visually:

```bash
npm run db:studio     # opens Prisma Studio at http://localhost:5555
```

---

## 4. Set Up Stripe Products

### Create the two prices in Stripe dashboard

Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Products → Add product:

**Product 1 — Documento Avulso**
- Name: `Documento de Contestação`
- Price: `€4.99` · One-time
- Copy the Price ID → paste as `STRIPE_PRICE_SINGLE_DOC` in `.env`

**Product 2 — Subscrição Mensal**
- Name: `Contesta a Tua Multa — Mensal`
- Price: `€9.99` · Recurring · Monthly
- Add free trial: 7 days
- Copy the Price ID → paste as `STRIPE_PRICE_SUBSCRIPTION` in `.env`

---

## 5. Set Up Stripe Webhooks (local dev)

Install the Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` secret it prints → paste as `STRIPE_WEBHOOK_SECRET` in `.env`.

**Events to enable** (also needed in production):
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

---

## 6. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Application Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth/login` | Login / Register |
| `/wizard` | 6-step contestation wizard |
| `/wizard?type=SPEEDING` | Wizard pre-set to speeding |
| `/wizard?type=PARKING` | Wizard pre-set to parking |
| `/dashboard` | User dashboard (protected) |
| `/checkout/success` | Post-payment confirmation |
| `/legal/privacidade` | Privacy policy (GDPR) |
| `/legal/termos` | Terms and conditions |

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Email/password registration |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/cases` | List / create cases |
| GET/DELETE | `/api/cases/[id]` | Fetch / delete a case |
| POST | `/api/documents/generate` | Generate PDF document |
| POST | `/api/stripe/checkout` | Create Stripe session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

---

## Testing Payments (Stripe Test Mode)

Use these test card numbers:

| Scenario | Card number |
|---|---|
| Successful payment | `4242 4242 4242 4242` |
| Payment requires auth | `4000 0025 0000 3155` |
| Payment declined | `4000 0000 0000 9995` |

Expiry: any future date · CVC: any 3 digits · ZIP: any 5 digits

---

## Production Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard → Settings → Environment Variables.

**Important production changes:**
1. Set `NEXTAUTH_URL` to your production domain
2. Replace local file storage in `generate/route.ts` with S3 or Cloudflare R2 for PDFs
3. Set up Stripe production webhook pointing to `https://yourdomain.pt/api/stripe/webhook`
4. Provision a managed PostgreSQL instance (Supabase, Neon, or Railway are good options)
5. Configure DNS and SSL for `conestaatuamulta.pt`

---

## Project Structure

```
conestaatuamulta/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # Legal template seeds
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout + metadata
│   │   ├── globals.css        # Tailwind + component classes
│   │   ├── auth/login/        # Login / register
│   │   ├── dashboard/         # User dashboard
│   │   ├── wizard/            # SmartWizard page
│   │   ├── checkout/success/  # Post-payment page
│   │   ├── legal/             # Termos + Privacidade
│   │   └── api/
│   │       ├── auth/          # NextAuth + register
│   │       ├── cases/         # CRUD for cases
│   │       ├── documents/     # PDF generation
│   │       └── stripe/        # Checkout + webhook
│   ├── components/
│   │   ├── layout/            # Navbar, Providers
│   │   ├── dashboard/         # DashboardClient
│   │   └── wizard-v2/         # SmartWizard + 6 steps
│   └── lib/
│       ├── auth.ts            # NextAuth config
│       ├── stripe.ts          # Stripe client
│       ├── prisma.ts          # Prisma singleton
│       ├── utils.ts           # Helpers
│       ├── pdf/               # @react-pdf/renderer generator
│       ├── templates/         # Text minuta generators (6 case types)
│       └── wizard/            # Logic engine, validation, form schema
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## AI Assistant Setup

The AI assistant uses Claude (claude-sonnet-4-6) via the Anthropic API.

### Get an API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to `.env`: `ANTHROPIC_API_KEY="sk-ant-..."`

### Features enabled by the AI

| Location | Feature |
|---|---|
| Step 4 (Legal Grounds) | Inline "Analisar" badge — one-tap AI case assessment |
| All steps 3–6 | Floating "Assistente IA" panel — full chat interface |
| Chat panel → Reformular texto mode | Rewrites user's text into formal legal Portuguese |

### Costs

Approximate cost per AI interaction: **$0.003–0.010** (claude-sonnet-4-6 pricing).
Consider rate-limiting per user session to control spend in production.

### Rate limiting (recommended for production)

Add to `/api/ai/chat/route.ts`:
```typescript
// Example: 20 AI requests per user per day using Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Inter font |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js v4 (Google + email/password) |
| Payments | Stripe Checkout + Webhooks |
| PDF generation | @react-pdf/renderer (server-side) |
| Validation | Zod |
| Animations | framer-motion |
| Icons | lucide-react |
| Passwords | bcryptjs (cost factor 12) |
