# DramaTV Community Admin

Independent Next.js admin frontend for DramaTV community operations and moderation.

## Scope

- `apps/admin` is the standalone admin app.
- Local default port is `3206`.
- The formal runtime path is `apps/admin + apps/server`.
- Admin pages read and write real backend data through `apps/server` `/api/admin/**`.
- When an admin API is unavailable, the page should show a clear error or read-only fallback state instead of mock business data.

## Local setup

Copy `.env.example` to `.env.local` if you need to override the backend address.

```bash
DRAMATV_ADMIN_API_BASE_URL=http://127.0.0.1:18080
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
