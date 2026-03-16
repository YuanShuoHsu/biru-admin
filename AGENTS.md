# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js 16 routes, layouts, and server actions. Pages share theming via `providers/` and fetch data through the `lib/` API helpers.
- `components/`: Reusable MUI-based UI pieces; collocate variants under feature folders. Domain constants live in `constants/`, enums in `enums/`, and shared schemas/utilities in `types/`, `utils/`, and `hooks/`.
- `stores/`: Zustand stores for client-side state, while `i18n/` + `messages/` hold translations consumed by the `next-intl` middleware.
- Assets reside in `public/`; theme tokens are centralized in `theme.ts` and `global.ts`. Keep new assets or locale files alongside their feature directories to reduce lookup time.

## Build, Test, and Development Commands

- `pnpm install` (or `npm install`): ensure dependencies align with the exact versions committed in the lockfiles.
- `pnpm dev`: runs `next dev` with hot reload; pair with `next-intl` middleware by setting `NEXT_PUBLIC_LOCALE` in `.env.local`.
- `pnpm build`: verifies production readiness through `next build`; fails on type errors and missing env vars.
- `pnpm start`: serves the production build for smoke tests.
- `pnpm lint`: executes ESLint + the Next.js config; add `pnpm format:check` in CI to guarantee consistent formatting.

## Coding Style & Naming Conventions

- TypeScript + React 19; favor functional components with hooks. Use PascalCase for components, camelCase for hooks/utilities (prefix custom hooks with `use`).
- Styling relies on MUI + Emotion; colocate `*.styles.ts` when variants are complex. Use 2-space indentation and trailing commas as enforced by Prettier 3.
- Run `pnpm format` before committing. Husky + lint-staged will reformat staged files; avoid bypassing them.

## Testing Guidelines

- Automated tests are not yet scaffolded; until a framework is added, cover changes with `pnpm lint`, type-checks, and manual verification in `pnpm dev` and `pnpm start`.
- When introducing tests, follow the folder mirroring pattern (`components/Button/__tests__/Button.test.tsx`) and name describe blocks after user-facing behaviors.

## Commit & Pull Request Guidelines

- Follow the conventional prefix observed in history (`feat:`, `refactor:`, `style:`, etc.) and keep subjects under ~72 characters.
- Each commit should bundle related changes only; include rationale in the body when touching data contracts or storage changes.
- Pull requests must list the motivation, screenshots or GIFs for UI updates, and explicit testing notes (`pnpm dev`, `pnpm build`). Link issue IDs in the description using `Closes #123` for automatic closure.

## Environment & Configuration Tips

- Copy `.env.example` to `.env.local` (create one if missing) and define API endpoints, auth secrets, and `NEXT_PUBLIC_WS_URL` for socket clients.
- Keep proxy adjustments in `proxy.ts` and shared auth logic in `providers/`; document any new env key in README and PR notes to prevent drift.
