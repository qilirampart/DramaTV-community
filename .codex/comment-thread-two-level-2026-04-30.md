# Comment Thread Two-Level Rollout

Date: `2026-04-30`

## Goal

- Limit comment threads to two visible levels only.
- Match short-video community behavior:
  - root comment
  - one nested reply layer
  - second-layer replies show who they are replying to
- Avoid infinite recursive floor nesting in UI.

## Backend changes

- Added migration:
  - `apps/server/src/main/resources/db/migration/V18__flatten_comment_threads_to_two_levels.sql`
- Added `reply_to_comment_id` to `comments`.
- Changed create-comment semantics:
  - reply to root comment:
    - `parent_id = root.id`
    - `root_id = root.id`
    - `reply_to_comment_id = root.id`
  - reply to second-level comment:
    - flatten back under root
    - `parent_id = root.id`
    - `root_id = root.id`
    - `reply_to_comment_id = clicked second-level comment.id`
- Changed comment list mapping:
  - historical deeper rows are flattened to two visible levels during read
  - API now returns `replyTarget`
- Changed delete cascade:
  - recursive delete now follows both `parent_id` and `reply_to_comment_id`

## Frontend changes

- Extended contracts:
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/contracts/view-models.ts`
- Extended API and mapper layers:
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/mappers/community.ts`
- Reworked shared thread component:
  - `apps/web/src/components/comments/CommentThread.tsx`
- UI behavior now is:
  - root comments render normally
  - replies render only one nested layer
  - second-layer replies show `回复 xxx`
  - no recursive third-layer rendering

## Tests and verification

- Frontend type check passed:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
- Backend compile passed:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`
- Backend integration test passed:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=CommentApiIntegrationTest test`

## Notes

- `memory/MEMORY.md` has been updated with the stable shared rule for two-level comment threads.
- Intended progress target was `.codex/progress-community.md`, but file append/write was blocked during this turn, so this sidecar record was created to avoid losing context.
