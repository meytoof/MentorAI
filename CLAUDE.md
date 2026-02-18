# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MentorIA is an AI-powered homework assistant for French-speaking primary school children (CP–CM2). It uses a Socratic pedagogical approach — guiding students step by step without giving direct answers. The app includes TDAH-optimized UI/UX, a Stripe subscription model, and IP-based anti-abuse protection.

## Commands

```bash
npm run dev          # Start development server
npm run build        # prisma generate + next build
npm run start        # Start production server
npm run lint         # ESLint (Next.js config)
```

Database:
```bash
npx prisma migrate dev   # Apply migrations
npx prisma studio        # Open Prisma GUI
npx prisma generate      # Regenerate Prisma client after schema changes
```

No test suite is configured.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — SQLite path (e.g. `file:./prisma/dev.db`)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `LLAMA_API_URL`, `LLAMA_MODEL`, `LLAMA_API_KEY` — Groq LLM API
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LIFETIME` (and their `NEXT_PUBLIC_` counterparts)

## Architecture

### Stack
- **Next.js 15** (App Router) + **React 19**, **TypeScript** (strict)
- **Prisma 6** + **SQLite** (dev) via `src/lib/prisma.ts` singleton
- **NextAuth 4** — JWT strategy with credentials provider (`src/lib/auth.ts`)
- **Groq API** — `meta-llama/llama-4-scout-17b-16e-instruct` model
- **Stripe** — monthly subscription + one-time lifetime purchase
- **Tailwind CSS 4**

### Key Directories

```
src/
├── app/
│   ├── api/
│   │   ├── assist/route.ts         # Core AI tutoring endpoint
│   │   ├── signup/route.ts         # Registration + IP anti-abuse
│   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   └── stripe/                 # checkout, portal, webhook
│   ├── accueil/                    # Landing page with login/signup modal
│   ├── dashboard/
│   │   ├── layout.tsx              # Enforces active access check
│   │   ├── (app)/whiteboard/       # Main chat interface (protected)
│   │   └── compte/                 # Account + billing portal
│   └── [cgv|confidentialite|mentions-legales|pricing|trial-expired]/
├── components/
│   ├── ui/                         # Shared UI (Navbar, Footer, LoginModal, etc.)
│   └── providers.tsx               # SessionProvider wrapper
├── lib/
│   ├── auth.ts                     # NextAuth config + JWT callbacks
│   ├── prisma.ts                   # Prisma client singleton
│   ├── stripe.ts                   # Stripe client + hasActiveAccess()
│   └── calculation-decomposition.ts # Math step-by-step visual helpers
└── types/
    └── drawing.ts                  # AIDrawingResponse type
```

### Access Control Flow

1. `middleware.ts` protects `/dashboard/*` — redirects unauthenticated users to `/accueil?login=1`
2. `dashboard/layout.tsx` calls `hasActiveAccess(user)` from `src/lib/stripe.ts`:
   ```ts
   user.isLifetime || user.stripeCurrentPeriodEnd > now || user.trialEndsAt > now
   ```
3. Expired users are redirected to `/trial-expired`

### AI Endpoint (`/api/assist`)

- Accepts `{ question, image }` (image is base64 data URL)
- Calls Groq with a strict French pedagogical system prompt (Socratic method, never reveals answers)
- Returns `AIDrawingResponse`: `{ messageBubbles, hint, segments, encouragement, drawing }`
- Saves conversation to DB non-blocking (fire-and-forget)
- 30-second timeout; returns a safe fallback on failure

### Database Models (Prisma)

- **User** — auth, trial (`trialEndsAt`), TDAH flag (`isTdah`), Stripe fields, signup IP
- **SignupFromIp** — IP → count/lastAt for anti-abuse (1 account per IP per 7 days)
- **Conversation** — question + AI response (hint, encouragement), indexed by userId + createdAt

### Signup Anti-Abuse

`/api/signup` checks `SignupFromIp`: if same IP has signed up within 7 days, registration is rejected. Trial is 24 hours from signup. Emails starting with `quentinlevis` receive hardcoded lifetime access (developer bypass).

### TDAH Mode

The `isTdah` flag on `User` adapts both the UI (minimal animations, larger controls) and AI responses (ultra-short bubbles, single action per message). This flag is set at registration and is stored in the JWT token/session.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
