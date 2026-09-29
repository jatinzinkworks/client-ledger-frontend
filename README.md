# Client Ledger — frontend

Web and mobile apps for the PSC Client Ledger, in one pnpm + Turborepo monorepo.

| Workspace | What |
| --- | --- |
| `apps/web` | Vite + React + Tailwind v4 + shadcn/ui |
| `apps/mobile` | Expo (iOS / Android) + expo-router + NativeWind |
| `packages/api` | API client generated from the backend's OpenAPI spec (orval → TanStack Query + zod) |
| `packages/schemas` | Shared zod form validation |
| `packages/tokens` | Zinkworks design tokens for both apps |

## Getting started

Requires Node 22+ and pnpm (`npm i -g pnpm`).

```sh
pnpm install
pnpm dev          # web  → http://localhost:5173 (proxies /psc to the backend on :8080)
pnpm dev:mobile   # Expo → press a / i / w, or scan the QR code with Expo Go
```

The backend (`../client-ledger-backend`) should be running on `http://localhost:8080`. For the Android emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080` in `apps/mobile/.env`.

## When the backend API changes

```sh
pnpm api:fetch-spec   # snapshot http://localhost:8080/v3/api-docs → packages/api/openapi.json
pnpm api:generate     # regenerate hooks, types and zod schemas
```

Commit both the snapshot and the generated code. See [CLAUDE.md](CLAUDE.md) for architecture and conventions.
