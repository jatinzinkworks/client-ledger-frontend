# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **Client Ledger** frontend: one **pnpm + Turborepo monorepo** holding a **web app** and a **mobile app** that share their API client, validation rules and design tokens. The backend is the sibling Spring Boot service in `../client-ledger-backend` (base path `/psc/cl/v1`, OpenAPI at `/v3/api-docs`). Design mocks and the Zinkworks design system live in `../mock`.

```
apps/
  web/       Vite + React 19 + Tailwind v4 + shadcn/ui + react-router 7   (@cl/web)
  mobile/    Expo SDK 57 + expo-router + NativeWind 4 (Tailwind v3)       (@cl/mobile)
packages/
  api/       orval-generated TanStack Query hooks, types and zod schemas + fetch client  (@cl/api)
  schemas/   zod form schemas shared by both apps (cross-field rules, defaults, labels) (@cl/schemas)
  tokens/    Zinkworks design tokens → web theme.css and the NativeWind preset          (@cl/tokens)
```

## Commands (run from the repo root)

- `pnpm install` — install everything (pnpm 12, Node ≥ 22)
- `pnpm dev` / `pnpm dev:web` — Vite dev server for the web app (http://localhost:5173)
- `pnpm dev:mobile` — `expo start` for the mobile app (press `a` / `i` / `w`, or scan with Expo Go)
- `pnpm build` · `pnpm typecheck` · `pnpm lint` — Turborepo across all workspaces
- `pnpm test` — Vitest across the workspaces that have tests
- `pnpm api:fetch-spec` — refresh `packages/api/openapi.json` from a running backend (`API_SPEC_URL` overrides `http://localhost:8080/v3/api-docs`)
- `pnpm api:generate` — regenerate `packages/api/src/generated/` from that snapshot
- `pnpm --filter @cl/tokens generate` — regenerate `packages/tokens/theme.css` after editing tokens
- `pnpm --filter @cl/mobile doctor` — `expo-doctor` (SDK / dependency compatibility)
- Scope any script to one workspace with `pnpm --filter <name> <script>`, e.g. `pnpm --filter @cl/web test:watch`.

**DO NOT RUN THE TESTS until asked.** Keep writing and updating tests alongside the code as normal, but do not run `pnpm test`, `test:watch` or `test:coverage` on your own initiative — wait for an explicit request. (`pnpm build` / `pnpm typecheck` type-check the test files, which is not the same as running them.)

Tests use [Vitest](https://vitest.dev); the web app adds React Testing Library (jsdom, setup in [apps/web/src/test/setup.ts](apps/web/src/test/setup.ts)). Tests are co-located as `*.test.ts(x)`. Prefer testing pure logic in `packages/` directly; for components, assert on behaviour (labels, roles, submitted values) rather than implementation details. The mobile app has no test runner yet.

## Environment

- **Web** ([apps/web/.env](apps/web/.env)): `VITE_API_BASE_URL` is empty by default, so the browser calls its own origin and the Vite dev server **proxies `/psc` to `VITE_DEV_PROXY_TARGET`** (`http://localhost:8080`). The backend sends no CORS headers, so calling `:8080` directly from the browser fails — only set a full URL for a backend that allows the origin. In production, serve the app and the API from the same origin. `VITE_LOGOUT_URL` / `VITE_IDP_LOGOUT_URL` are reserved for IAP / Entra sign-out (not wired up yet; the IAP URL must be fetched with `redirect: 'manual'`). Vite inlines env at start-up — **restart the dev server after editing `.env`**.
- **Mobile** ([apps/mobile/.env](apps/mobile/.env)): `EXPO_PUBLIC_API_BASE_URL` is the backend as seen *from the device* — `localhost` on the iOS simulator, `10.0.2.2` on the Android emulator, the machine's LAN IP on a physical device. Native apps are not subject to CORS. Restart `expo start` after editing.

## Architecture

### Shared packages — the reason this is a monorepo

- **`@cl/api`** — everything under `src/generated/` is produced by **orval** from the committed [openapi.json](packages/api/openapi.json) snapshot: typed request/response models, TanStack Query hooks (`useGetPaymentTerms`, `useSavePaymentTerms`, …) and zod schemas (`@cl/api/zod`). **Never edit generated files** — change the backend, `pnpm api:fetch-spec`, `pnpm api:generate`. All requests go through the mutator [fetcher.ts](packages/api/src/fetcher.ts): each app calls `configureApi({ baseUrl, … })` once at start-up; non-2xx responses throw `ApiError` carrying the backend's `ErrorResponse` (`errorMessage` / `fieldErrors` / `isNotFound` in [errors.ts](packages/api/src/errors.ts)). Hand-written hooks that compose the generated ones for a screen (e.g. [usePaymentTerms](packages/api/src/hooks/usePaymentTerms.ts)) live in `src/hooks/` so both apps share screen logic.
- **`@cl/schemas`** — zod **form** schemas. Field bounds and defaults are imported from the generated zod so they track the backend; cross-field rules the spec cannot express (the backend's `@AssertTrue` checks) are added here — **keep the rules identical to the Java side**, but word the messages for users (Title Case, like the mocks). Also holds the request mappers (`toPaymentTermsRequest`), form defaults and field labels/hints — both apps render the same copy. Forms use react-hook-form + `zodResolver` in both apps.
- **`@cl/tokens`** — the single source for the Zinkworks palette, semantic light/dark colours (shadcn names: `background`, `card`, `muted-foreground`, `border`, …), radius and fonts in [src/index.js](packages/tokens/src/index.js). Web imports the generated [theme.css](packages/tokens/theme.css); mobile uses [tailwind-preset.cjs](packages/tokens/src/tailwind-preset.cjs) plus NativeWind `vars()` in [ThemeRoot](apps/mobile/src/theme/ThemeRoot.tsx). So `bg-card` / `text-muted-foreground` mean the same in both apps. Edit `src/index.js`, then regenerate `theme.css` (a test fails if they drift).
- Shared packages are consumed **as TypeScript source** (no build step); `main`/`exports` point at `src/`.

### One React

`react`, `react-dom`, `@types/react`, `typescript`, `zod`, `@tanstack/react-query` and `vitest` versions come from the **`catalog:`** in [pnpm-workspace.yaml](pnpm-workspace.yaml) — reference them as `"catalog:"`, never a literal range. React must be a single copy repo-wide (the shared hooks run inside both apps) and **Expo dictates the version**, so the web app follows it; bump it only as part of an Expo SDK upgrade. This is why the web app is on react-router 7 (v8 requires a newer React than Expo ships). The web Vite config also `dedupe`s React and React Query.

### Web app ([apps/web](apps/web))

- [src/main.tsx](apps/web/src/main.tsx) — `configureApi`, `QueryClientProvider`, `ThemeProvider`, `BrowserRouter`; [src/App.tsx](apps/web/src/App.tsx) — route table; [AppLayout](apps/web/src/components/AppLayout.tsx) — sidebar shell driven by [utils/navigation.ts](apps/web/src/utils/navigation.ts).
- `src/pages/` route screens · `src/components/` reusable blocks (`ui/` = shadcn primitives, `settings/`, …) · `src/theme/` light/dark · `src/utils/` config and constants · `src/lib/utils.ts` = `cn`.

### Mobile app ([apps/mobile](apps/mobile))

- Expo Router: every file in `src/app/` is a route; `_layout.tsx` files are navigators. [src/app/_layout.tsx](apps/mobile/src/app/_layout.tsx) — `configureApi`, `QueryClientProvider`, `ThemeRoot`; `(tabs)/` — bottom tabs driven by [utils/navigation.ts](apps/mobile/src/utils/navigation.ts). Keep non-route code out of `src/app/`.
- `src/components/ui/` is the small native UI kit (Button, Card, DaysField) styled with NativeWind classes; `src/theme/` maps tokens onto CSS variables and the navigation theme; the app follows the OS appearance.
- **Read [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md) before touching Expo APIs** — Expo changes every SDK; check the versioned docs, and add native packages with `npx expo install <pkg>` (run in `apps/mobile`), not `pnpm add`, so versions match the SDK. `ios/` and `android/` are generated (CNG) and git-ignored — configure native behaviour in `app.json`.
- pnpm isolates dependencies, so anything injected into app code by a build tool must be a **direct** dependency of `@cl/mobile` (that's why `react-native-css-interop` and `babel-preset-expo` are listed explicitly). Metro's monorepo support is automatic — don't add `watchFolders` / `nodeModulesPaths`.

### Backend contract notes

- API paths are versioned under `/psc/cl/v1`. **URL-encode path params** (`encodeURIComponent`) in hand-built paths and route links; orval does this for generated calls.
- Global Settings resources (payment terms, firm details) are singletons: `GET` returns 404 until first saved (treat as "not configured" and show defaults), `POST` creates (201) or replaces wholesale (200) — send every field, and **omit** blank optional strings rather than sending `""` (the backend's `@Pattern` rejects empty strings). Wrap each in a hook built on [singletonSetting](packages/api/src/hooks/singletonSetting.ts).
- On the web Settings screen each section is **its own react-hook-form form** ([SettingsForm](apps/web/src/components/settings/SettingsForm.tsx)) so an unconfigured section never blocks saving another; the header Save validates all changed sections, then saves only those. Add a new section by adding its schema in `@cl/schemas`, a hook in `@cl/api`, a `*Section` component, and wiring it into `SettingsForm`.
- The backend's springdoc output puts an invalid `in` on the HTTP bearer security scheme; [fetch-spec.mjs](packages/api/scripts/fetch-spec.mjs) strips it (with a warning) so orval's validation passes. Remove that block once the backend is fixed.

## Project coding rules

- **Use [Lucide](https://lucide.dev) icons** (`lucide-react` on web, `lucide-react-native` on mobile) — no hand-rolled inline `<svg>` icons. Reuse [Spinner](apps/web/src/components/Spinner.tsx) on web / `ActivityIndicator` on mobile for loading states.
- **Web: use [shadcn/ui](https://ui.shadcn.com) components** (new-york style) where applicable rather than bespoke equivalents. Add primitives with `npx shadcn@latest add <name>` from `apps/web` — then check the generated `cn` import is `@/lib/utils`.
- **Mobile: build on the `src/components/ui/` kit** with NativeWind classes; use the semantic token classes, and `useThemeColors()` only for props that need a raw colour (icon `color`, `placeholderTextColor`, `Switch` tracks).
- **Every screen must work in both themes.** Prefer the semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`, `text-destructive`, `text-success`) — they switch on their own in both apps. Where a palette colour is genuinely needed, pair it with a `dark:` variant (web). On web the theme is a `dark` class on `<html>`, set by [ThemeProvider](apps/web/src/theme/ThemeProvider.tsx) and the no-flash script in [index.html](apps/web/index.html) — the storage key and class name are shared with [theme/constants.ts](apps/web/src/theme/constants.ts), so change them together.
- **Share before you duplicate.** Logic both apps need — API calls, screen data hooks, validation, defaults, labels, constants — belongs in `packages/`, not copied into each app. Only rendering should differ between web and mobile.
- **When repeating something more than 3 times, extract a function or use a map** instead of copy-pasting. Render repeated markup from arrays via `.map` (nav items, tabs, field definitions).
- **Keep route files lean** (`apps/web/src/pages/`, `apps/mobile/src/app/`) — they orchestrate data and composition; move sections, rows, panels and forms into `components/`.
- **Put reused constants in dedicated files** under each app's `src/utils/` (or in a package when both apps use them) rather than redeclaring literals inline.

## Change log rules

- **The change log MUST be updated** in [apps/web/src/utils/changelog.ts](apps/web/src/utils/changelog.ts) whenever user-facing work is delivered in **either** app. Add the entry at the top of `CHANGELOG` (newest first).
- **Keep it high level and simple** — a short statement of what changed for users, not an itemised list of every edit. Group related work into one highlight.
- **Every entry MUST carry a date and time including seconds**, e.g. `date: "19 Aug 2026, 19:10:42"`.
- **DO NOT change the root [version](version) file.** Version bumps happen at release time, outside this workflow — write the entry against the version being prepared and leave `version` alone.
