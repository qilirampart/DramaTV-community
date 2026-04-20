# DramaTV Community Server

Spring Boot modular monolith scaffold for the DramaTV community.

## Current scope

- `identity`: local development session and current-user query
- `feed`: real home aggregate query
- `video`: real detail and related query
- `workflow`: real detail and related query
- `creator`: real creator aggregate query
- `publish`: real draft persistence and submit flow
- `interaction`: real comments / likes / favorites / follows
- `canvas`: runtime / copy entry under active integration

## Environment baseline

- Spring Boot line: `3.5.13`
- Java: `17+`
- Maven: `3.6.3+`

## Notes

- Media processing, AI tasks, and workflow runtime jobs stay outside this app in `Python Worker / FastAPI`.
- Daily development is expected to run against local PostgreSQL + Redis.
- The backend now defaults to `local-db`; `mock` is no longer a supported daily development profile.

## Local database note

- Your current XAMPP MySQL is fine for generic PHP/MySQL projects, but it is not the mainline database for this repo.
- This project is already aligned to PostgreSQL in:
  - `apps/server/pom.xml`
  - `apps/server/src/main/resources/application.yml`
  - `docs/04_实施设计/数据库初版表设计.md`
- The schema design uses PostgreSQL features such as `jsonb`, `text[]`, `gin` indexes, `timestamptz`, and `pgcrypto`.
- For this repo, the recommended local path is:
  1. Install PostgreSQL locally, or
  2. Run PostgreSQL with Docker Compose
- Keeping XAMPP MySQL running is fine, but it should not be used as the primary database for the DramaTV backend.

## Local bootstrap

- Recommended local stack: `PostgreSQL + Redis`
- Recommended startup path on this machine: Docker Compose
- Compose file: `infra/local/docker-compose.yml`
- Compose env example: `infra/local/.env.example`
- Server env example: `apps/server/.env.example`
- Setup guide: `docs/04_实施设计/本地开发环境准备.md`
