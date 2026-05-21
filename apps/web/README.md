# DramaTV Community Web

Formal Next.js App Router frontend for the DramaTV community project.

## Scope

- `apps/web` is the formal frontend mainline for current development.
- Local default port is `3106`.
- The archived root `React + Vite` prototype is reference-only and no longer part of active delivery.
- Current development and acceptance run against real Spring Boot APIs by default.

## Data source

`apps/web` now runs against the Spring Boot backend as the only supported runtime path for daily development.

Set:

```bash
DRAMATV_API_BASE_URL=http://127.0.0.1:18080
```

Behavior:

- The frontend requests the Spring Boot backend directly.
- When the backend is unavailable, pages show an explicit backend-unavailable state.
- The app does not fall back to local mock data.

## Recommended local setup

Copy `apps/web/.env.example` to `.env.local`, then adjust the backend address if needed.

If local port `8080` is occupied by an older prototype or another service, prefer using the backend on `18080`.

The root command `npm run dev:web` is the standard local entry and now binds to `http://127.0.0.1:3106`.
