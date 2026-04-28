# conestaatuamulta.pt — System Architecture

## Overview

SaaS platform for contesting Portuguese traffic fines. Generates legally valid
contestation letters ("minutas") based on Portuguese law (Código da Estrada +
Regime Geral das Contraordenações).

---

## Tech Stack

| Layer        | Technology                              |
|------------- |-----------------------------------------|
| Framework    | Next.js 14 (App Router, TypeScript)     |
| Styling      | Tailwind CSS                            |
| Database     | PostgreSQL via Prisma ORM               |
| Auth         | NextAuth.js (Google + Email/Password)   |
| Payments     | Stripe (Checkout Sessions + Webhooks)   |
| PDF          | @react-pdf/renderer                     |
| Hosting      | Vercel (recommended)                    |
| DB Hosting   | Supabase / Railway / Neon               |

---

## Folder Structure

```
conestaatuamulta/
├── prisma/
│   ├── schema.prisma          # DB schema (User, Case, Document, Payment)
│   └── seed.ts                # Legal template seed data
│
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page (SEO-optimised)
│   │   ├── layout.tsx         # Root layout + metadata
│   │   ├── globals.css        # Tailwind + custom CSS
│   │   ├── wizard/            # Multi-step wizard
│   │   ├── dashboard/         # User dashboard
│   │   ├── auth/login/        # Login + Register page
│   │   ├── checkout/success/  # Post-payment success page
│   │   └── api/
│   │       ├── auth/          # NextAuth + Register
│   │       ├── cases/         # CRUD for cases
│   │       ├── documents/     # PDF generation
│   │       └── stripe/        # Checkout + Webhooks
│   │
│   ├── components/
│   │   ├── layout/            # Navbar, Providers
│   │   ├── wizard/            # 5-step wizard + all step forms
│   │   └── dashboard/         # Dashboard client component
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── stripe.ts          # Stripe helpers
│   │   ├── utils.ts           # Date, format, string helpers
│   │   ├── templates/         # Legal minuta generators
│   │   │   ├── speeding.ts    # Excesso de velocidade
│   │   │   ├── parking.ts     # Estacionamento
│   │   │   ├── admin-error.ts # Erros administrativos
│   │   │   ├── grounds.ts     # Legal grounds per case type
│   │   │   └── index.ts       # Entry point + dispatcher
│   │   └── pdf/
│   │       └── generator.tsx  # @react-pdf/renderer PDF generation
│   │
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces
```

---

## Database Schema

```
User
 ├── id, name, email, password (bcrypt)
 ├── stripeCustomerId, subscriptionId, subscriptionStatus
 ├── → Account[], Session[] (NextAuth)
 ├── → Case[]
 ├── → Document[]
 └── → Payment[]

Case
 ├── id, userId, title, caseType, status
 ├── fineNumber, fineDate, fineEntity, fineLocation
 ├── vehiclePlate, vehicleOwnerName
 ├── violationData (JSON)       ← type-specific fields
 ├── contestationGrounds (JSON) ← selected legal grounds
 └── additionalNotes

Document
 ├── id, userId, caseId, templateId, status
 ├── content (text minuta)
 ├── pdfUrl, pdfHash (SHA-256)
 └── → Payment?

Payment
 ├── id, userId, documentId
 ├── amount (cents), currency, status, type
 └── stripeSessionId, stripePaymentIntent

LegalTemplate
 ├── slug, name, caseType
 ├── bodyText (template)
 └── legalBasis[]
```

---

## API Routes

| Method | Route                         | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | /api/cases                    | List user's cases                    |
| POST   | /api/cases                    | Create / update case                 |
| DELETE | /api/cases/[id]               | Delete case                          |
| POST   | /api/cases/[id]/downloaded    | Mark case as downloaded              |
| POST   | /api/documents/generate       | Generate PDF + minuta text           |
| POST   | /api/auth/register            | Email registration                   |
| POST   | /api/auth/[...nextauth]       | NextAuth handler                     |
| POST   | /api/stripe/checkout          | Create Stripe Checkout Session       |
| POST   | /api/stripe/webhook           | Handle Stripe webhook events         |

---

## User Flow

```
Landing Page
    │
    ▼
[Seleciona tipo de multa]
    │
    ▼
Wizard Step 1: Tipo de infração
    │
    ▼
Wizard Step 2: Dados da multa (n.º auto, data, entidade, local, matrícula, NIF, morada)
    │
    ▼
Wizard Step 3: Detalhes específicos (conditional — campos diferentes por tipo)
    │ Speeding: velocidade, radar, calibração, sinalização
    │ Parking: entidade, tipo proibição, sinalização, cartão deficiência
    │ Admin: tipo erro, descrição
    │
    ▼
Wizard Step 4: Fundamentos legais (checkboxes com base legal + campo livre)
    │
    ▼
Wizard Step 5: Revisão + Gerar documento
    │
    ├─[NOT LOGGED IN]──→ Redirect to /auth/login ──→ back to wizard
    │
    ├─[SUBSCRIBER]──────→ Generate PDF immediately ──→ Dashboard download
    │
    └─[FREE USER]───────→ Stripe Checkout (€4.99) ──→ Webhook confirms payment
                                                    ──→ PDF generated + unlocked
                                                    ──→ Dashboard download
```

---

## Payment Flow

### Pay-per-document (€4.99)
1. User clicks "Gerar documento"
2. API checks: no active subscription
3. `POST /api/stripe/checkout` → creates Stripe Checkout Session (mode: payment)
4. User redirected to Stripe hosted page
5. On success: Stripe webhook fires `checkout.session.completed`
6. Webhook marks `Payment.status = COMPLETED`, `Document.status = PAID`
7. User redirected to `/checkout/success?case_id=...`
8. Document available for download in dashboard

### Subscription (€9.99/month)
1. User clicks "Subscrever"
2. `POST /api/stripe/checkout` → creates Subscription Checkout (mode: subscription)
3. Stripe webhook `checkout.session.completed` → `User.subscriptionStatus = ACTIVE`
4. All future documents generate without payment check
5. Renewal: `invoice.paid` → extends `subscriptionPeriodEnd`
6. Cancellation: `customer.subscription.deleted` → `status = CANCELED`

---

## Legal Template System

Each case type has:
- **Generator function** in `src/lib/templates/` — builds the full formal text
- **Ground paragraphs** — pre-written legal paragraphs per ground ID
- **Legal basis** — exact article references (CE, RGCO, CRP, DL)

### Ground selection flow:
1. `getAvailableGrounds(caseType)` returns relevant grounds
2. User selects grounds in Step 4
3. `generateMinuta(formData)` calls the type-specific generator
4. Generator maps each selected ground ID → full legal paragraph
5. Assembled into formal letter with header, sections, and signature block

### Legal references used:
- **Código da Estrada** (CE) — Art. 24, 48, 49, 69, 82, 84, 162, 169, 170
- **RGCO** (DL 433/82) — Art. 3, 18, 27, 28, 50, 58, 59, 68, 70, 79
- **CRP** — Art. 29(5), 32(1), 32(2)
- **DL 291/90** + **Portaria 1504/2008** — Metrologia / calibração radares
- **DL 307/2003** — Cartão de estacionamento para deficientes
- **DL 44/2002** — Competência de fiscalização de estacionamento
- **RST (DL 22-A/98)** — Regulamento de Sinalização do Trânsito
- **Tallinn Manual** references where cyber/GPS spoofing applicable

---

## Environment Variables

```
DATABASE_URL          PostgreSQL connection string
NEXTAUTH_URL          App URL
NEXTAUTH_SECRET       Random secret (openssl rand -base64 32)
GOOGLE_CLIENT_ID      Google OAuth
GOOGLE_CLIENT_SECRET  Google OAuth
STRIPE_SECRET_KEY     Stripe sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET Stripe webhook signing secret
STRIPE_PRICE_SINGLE_DOC   Price ID for €4.99 one-off
STRIPE_PRICE_SUBSCRIPTION  Price ID for €9.99/month
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_live_...
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   Email
```

---

## Deployment Checklist

- [ ] Set all env vars in Vercel dashboard
- [ ] Run `prisma migrate deploy` on production DB
- [ ] Configure Stripe webhook endpoint: `https://conestaatuamulta.pt/api/stripe/webhook`
    - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- [ ] Add `conestaatuamulta.pt` to Google OAuth allowed redirect URIs
- [ ] Configure SMTP for transactional emails
- [ ] Replace local file storage (`public/documents/`) with S3/Cloudflare R2 for PDF storage
- [ ] Set up GDPR-compliant cookie consent
- [ ] Register domain + configure DNS
- [ ] SSL certificate (auto-provisioned by Vercel)

---

## Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions (not database sessions) — no session fixation risk
- Stripe webhook signature verified before processing
- All case/document endpoints verify `userId` ownership before access
- PDF hash (SHA-256) stored for document integrity verification
- Rate limiting recommended for `/api/auth/register` and `/api/documents/generate`
- NIF data stored encrypted at rest (add field encryption with `prisma-field-encryption` in production)

---

## GDPR / Legal Compliance

- Privacy Policy page required at `/legal/privacidade`
- Terms of Use at `/legal/termos`
- Legal Notice at `/legal/aviso-legal`
- Cookie consent banner
- Data retention policy (suggest 2 years for legal documents, then auto-delete)
- Right to erasure: DELETE /api/account endpoint needed
- Data stored in EU (use Supabase EU region or Railway Frankfurt)
