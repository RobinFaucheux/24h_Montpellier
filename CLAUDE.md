# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trocdeal** — a French classifieds/marketplace app (like LeBonCoin). Users can post listings, browse by category/city/price, favorite listings, and message sellers. Built with Nuxt 4 + Nuxt UI, Prisma ORM, and PostgreSQL.

All application code lives in the `web/` directory.

## Commands

All commands run from `web/`:

```bash
pnpm dev              # dev server on localhost:3000
pnpm build            # production build
pnpm preview          # preview production build
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check (vue-tsc)

pnpm db:migrate       # run Prisma migrations (dev)
pnpm db:seed          # seed database (prisma/seed.ts)
pnpm db:reset         # reset DB and re-run migrations
```

## Docker

```bash
# Development (with hot reload, mounts ./web into container)
docker compose -f docker-compose.dev.yml up --build

# Production
docker compose up --build
```

The dev compose mounts `./web:/app` with an anonymous volume protecting `node_modules`. The production image runs `pnpm build` then `node .output/server/index.mjs`.

## Environment Variables

Required in `web/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `NUXT_SESSION_PASSWORD` — secret for `nuxt-auth-utils` session encryption (min 32 chars)

## Architecture

### File layout (Nuxt 4 convention)
- `web/app/pages/` — file-based routing
- `web/app/components/` — auto-imported Vue components
- `web/app/middleware/auth.ts` — route guard using `nuxt-auth-utils`'s `useUserSession()`
- `web/server/api/` — Nitro API routes (file name = HTTP method, e.g. `index.get.ts`, `index.post.ts`)
- `web/server/utils/prisma.ts` — singleton Prisma client (exported as `prisma`, auto-imported in server routes)

### Auth
Uses `nuxt-auth-utils`. Session is set server-side via `setUserSession(event, { user })` and read client-side via `useUserSession()`. Protected pages add `definePageMeta({ middleware: 'auth' })`. Passwords are hashed with bcrypt.

### API conventions
All server routes validate input with Zod before touching the database. Auth-required routes call `requireUserSession(event)` at the top. The `prisma` singleton from `server/utils/prisma.ts` is available without import in all server routes (Nuxt auto-imports `server/utils/`).

### Image uploads
`POST /api/upload` saves files to `./uploads/` (local disk, relative to CWD) and returns `/uploads/<uuid>.<ext>` URLs served as static files. Max 5 MB, JPEG/PNG/WebP/GIF only.

### Data model key relations
- `Listing` → belongs to `User`, has many `ListingImage`, many-to-many `Category` via `CategoriesOnListings`
- `Conversation` → ties a `Listing` + buyer `User` + seller `User`; unique per `(listingId, buyerId)`
- `Message` → belongs to `Conversation` + sender `User`

### UI
Uses **Nuxt UI v4** (component prefix `U`). Icons come from `@iconify-json/lucide` (`i-lucide-*`) and `@iconify-json/simple-icons`. Styling is Tailwind CSS v4. Color mode (dark/light) is managed by `@nuxtjs/color-mode`.
