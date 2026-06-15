# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Auto-format with Prettier
pnpm format:check # Check formatting without writing
```

No test framework is configured in this project.

## Architecture

This is a **Next.js 16 App Router** admin panel with TypeScript, MUI, and multi-language support.

### Routing Structure

Routes live under `app/[locale]/` for i18n. Layout groups organize routes:

- `(app)/(dashboard)/` — protected routes (order, account settings)
- `(app)/auth/` — public auth pages (sign-in, sign-up, password reset)

The middleware at `proxy.ts` handles:

- Redirecting authenticated users to `/order`
- Redirecting unauthenticated users away from protected routes
- Global maintenance mode (`NEXT_PUBLIC_MAINTENANCE` env flag)

API requests are proxied: `/api/:path*` → `NEXT_PUBLIC_NEST_URL/api/:path*`

### State Management

Zustand stores in `stores/` use a factory pattern (e.g., `createAuthStore`). Each store is wrapped in a React Context provider in `providers/` to allow server-safe instantiation. Always access stores via their hooks (e.g., `useAuthStore((state) => state.x)`), not directly.

### Data Fetching

- **Server-side**: Use React `cache()` for deduplication (see `utils/orders.ts`)
- **Client-side**: SWR via `SWRProvider` — errors auto-show via notistack (403/404 excluded)
- **Fetcher** (`utils/fetcher.ts`): Relative URLs resolve against `NEXT_PUBLIC_NEST_URL` server-side; client-side uses Next.js rewrites

### Forms

React Hook Form + Zod schemas (`definitions.ts` files). Form schemas and error handling are co-located with the page/component.

### Internationalization

5 locales: `zh-TW` (default), `en`, `ja`, `ko`, `zh-CN`. Translation files are in `messages/[locale]/`. Always use `useTranslations()` from `next-intl` and locale-aware navigation from `@/i18n/navigation` (not `next/navigation`).

### UI & Theme

MUI v7 with a custom theme (`theme.ts`) supporting light/dark via CSS variables (`colorSchemeSelector: "class"`). Tailwind CSS v4 is also available for utilities. MUI DataGrid (`@mui/x-data-grid`) is used for all tabular data with server-side pagination/sorting/filtering.

### Auth

`better-auth` client in `lib/auth-client.ts` with `adminClient` and `organizationClient` plugins. Auth flow: sign in → verify org membership → redirect to `/order`.

### Path Alias

`@/` maps to the project root. Use it for all non-relative imports.

## biru Sync

Mirror repo (frontend): `/Users/yuanshuohsu/Desktop/biru`. Changes in either repo must be synced to the other.

Superset files (admin is a superset of frontend — transplant hunks only, never overwrite the whole file):
`utils/menus.ts`, `CustomerPaymentForm`, `messages/*/common.json`, `types/api.ts`

All other mirrored components, stores, hooks, constants, and messages can be synced with `cp`.
