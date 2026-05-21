# 2026-05-21 Discussion Rich Editor Follow-up

## Scope

- Continue the `/discussions/new` editor upgrade from toolbar-only enhancement into a real rich-content editing path.
- Close the downstream consumers that still assumed plain markdown/plain text after rich HTML started entering `content`.

## Changes

### Frontend

- Added shared plain-text extraction utility:
  - `apps/web/src/lib/discussion-content.ts`
- Reused that utility in:
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
  - `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
  - `apps/web/src/lib/presentation.ts`
  - `apps/web/src/features/discussions/DiscussionThreadQuickFavoriteCard.tsx`
- Updated rich editor storage behavior:
  - `discussionEditorToStorage()` now persists the editor HTML directly
  - rich headings / font size / color / image / video markup remain intact after save and publish
- Removed duplicate Tiptap `link` registration:
  - keep `link` config inside `StarterKit`
  - drop extra standalone `Link.configure(...)`
  - drop redundant custom `http/https` protocol registration

### Backend

- Added shared rich-text excerpt sanitizer:
  - `apps/server/src/main/java/com/dramatv/community/shared/support/RichTextExcerptSupport.java`
- Wired it into:
  - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishedContentPersistenceService.java`
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
- Result:
  - post excerpts no longer leak `<h1>`, `<span style=...>`, figure/video wrappers, or raw markdown syntax
  - personal-center draft summaries and similar downstream summaries share the same cleanup logic

## Verification

- Frontend type check:
  - `apps/web -> npm.cmd run typecheck`
- Backend tests:
  - `DraftApiIntegrationTest`
  - `RichTextExcerptSupportTest`
- Browser recheck on local `http://127.0.0.1:3106/discussions/new`
  - login with `creator-a / dramatv-local-dev`
  - editor mounted as `.ProseMirror`
  - first paragraph successfully toggled to `<h1>`
  - second paragraph successfully persisted `color + font-size`
  - preview dialog rendered the same rich HTML structure
  - duplicate `link` warning no longer appears after reload
- Runtime recheck on local backend `http://127.0.0.1:18080`
  - restarting the Spring Boot dev server was necessary; before restart, new discussion publishes were still writing old HTML excerpts into `discussion_threads.excerpt_text`
  - after restart, a fresh rich post publish stored clean plain-text excerpt output
  - added Flyway Java migration `V23__backfill_discussion_thread_excerpt_text`
  - migration backfilled existing dirty discussion excerpts in the local database, so old list cards no longer leak `<span style=...>` fragments
- API spot check after backfill
  - `GET /api/discussions/home?channel=video-production` now returns plain-text excerpts for both new and previously dirty rich posts
  - `GET /api/discussions/threads/{slug}` still keeps full rich HTML in `content`, while excerpt fields stay plain text

## Notes

- `.codex/progress-community.md` currently contains invalid UTF-8 bytes and could not be safely appended with `apply_patch`.
- This file exists as a safe sidecar record for the current round until the main community progress log encoding is repaired.

## Next Step

- Run one full browser acceptance from publish -> discussion list -> detail page, then decide whether to sync this editor upgrade to cloud after any remaining page-level polish.
