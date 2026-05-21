# 2026-04-28 Public Upload Fix

## Summary

- Issue: video upload failed on the public site `http://8.141.20.130/publish` with `forbidden`.
- Root cause: public Nginx forwarded `/api/uploads/**` directly to Spring Boot, so browser requests skipped the Next.js upload proxy that injects `Authorization` from the `dramatv_access_token` cookie.
- Fix: updated `scripts/deploy-test-web.ps1` so public Nginx now routes `^~ /api/uploads/` to the Next web service on `3106`, while other `/api/**` requests still go to Spring Boot on `18080`.

## Deploy

- Public web redeployed to `8.141.20.130`
- Release: `/opt/dramatv-community-web/releases/20260428-100643`

## Verification

- Real browser-path verification passed on `http://8.141.20.130/publish`
- `POST /api/uploads/video-policy -> 200`
- `PUT /api/uploads/assets/{assetId}/binary -> 200`
- Real browser-path verification passed on `http://8.141.20.130/discussions/new`
- `POST /api/uploads/image-policy -> 200`
- `PUT /api/uploads/assets/{assetId}/binary -> 200`
- Real browser-path verification passed on `http://8.141.20.130/me` avatar update flow
- `POST /api/uploads/image-policy -> 200`
- `PUT /api/uploads/assets/{assetId}/binary -> 200`

## Scope

- Current browser-side upload entry points all share the same chain and are covered by this fix:
  - publish page media upload
  - discussion composer attachments
  - personal center avatar upload
- `apps/web/src/lib/api/community-service.ts` also contains server-side upload helpers, but they are not currently used by the public browser upload flows and were not the source of this public-site failure.
