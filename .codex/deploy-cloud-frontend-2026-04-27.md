# 2026-04-27 Cloud Frontend Deployment

## Result

- Official `apps/web` Next.js frontend deployed to ECS `8.141.20.130`
- Public HTTP entry: `http://8.141.20.130/`
- Local verification from this machine returned `200`

## Runtime Layout

- Nginx `/` -> `http://127.0.0.1:3106`
- Nginx `/api/` -> `http://127.0.0.1:18080`
- Nginx `/media/` -> `http://127.0.0.1:18080`
- Frontend systemd service: `dramatv-community-web`
- Frontend runtime port: `3106`
- Current release: `/opt/dramatv-community-web/releases/20260427-110817`

## Deployment Script

- Script: `scripts/deploy-test-web.ps1`
- Finalized fixes:
  - remote bash placeholder rendering is stable
  - remote build now loads the frontend env file before `next build`
  - remote install uses `npm ci --include=dev`
  - remote shell script is written with LF line endings to avoid Linux parse errors
  - `apps/web/next.config.ts` now validates `output` type safely

## Validation

- Remote `http://127.0.0.1:3106` returned `HTTP/1.1 200 OK`
- Remote `http://127.0.0.1/` through Nginx returned `HTTP/1.1 200 OK`
- `systemctl status dramatv-community-web` is `active (running)`

## Domain Slot

- The deploy script already reserves a future domain cutover path
- When you want to switch from public IP to a domain, rerun:
  - `.\scripts\deploy-test-web.ps1 -PublicBaseUrl http://example.com -ServerNames "example.com"`
- Current default `server_name` is `_`

## Follow-up

- `progress.md` could not be appended because the file was locked by another local process at write time
- Merge this note back into `.codex/progress.md` after the lock is released
