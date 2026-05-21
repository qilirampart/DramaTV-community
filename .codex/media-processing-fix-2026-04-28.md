# Media Processing Fix - 2026-04-28

## Done

- Added backend video media worker for `async_task_records.task_type = video_media_process`.
- Worker now:
  - probes video duration with `ffprobe`
  - extracts first frame as a derived image cover when the user did not upload a cover
  - writes the derived cover back to `videos.cover_asset_id`
  - also fills `videos.poster_asset_id` from the cover path so list cards have a stable static image
  - generates a compressed `preview` video for large sources above `dramatv.media.processing.compression-threshold-bytes`
- Video detail playback now prefers `previewUrl` before `sourceUrl`.
- Local media write path and local media read path now both use `MediaStorageProperties.resolvedLocalDirPath()` to avoid path drift across different startup directories.

## Verified

- `apps/web`: `npx tsc --noEmit -p apps/web/tsconfig.json`
- `apps/server`: `-DskipTests test-compile`
- Targeted integration test passed:
  - `PublishPipelineIntegrationTest#videoMediaProcessorGeneratesCoverPosterAndPreviewForQueuedTask`
- Prompt-path integration test passed:
  - `PublishPipelineIntegrationTest#videoPromptSubmitQueuesMediaTaskAndGeneratesDerivedAssets`
- Local backend restarted successfully on `http://127.0.0.1:18080`

## Cloud

- Installed static `ffmpeg` and `ffprobe` on ECS `8.141.20.130`.
- Deployed the current backend jar to ECS release `/opt/dramatv-community-server/releases/20260428-124604`.
- Public/cloud backend health remained `UP` after deployment.
- Backfilled two published cloud video-prompt entries by inserting `video_media_process` tasks:
  - `机甲大战怪兽` succeeded and now has a generated cover asset.
  - `万镜碎虚` failed because its uploaded source asset is not a valid MP4 for `ffprobe`:
    - `moov atom not found`
    - `Invalid data found when processing input`

## Remaining

- The cloud prompt `万镜碎虚` still needs either:
  - a valid re-upload of the source video, or
  - a manually uploaded cover image as fallback.
- The current prompt media worker can now process future video-prompt submissions automatically, but it cannot derive covers from corrupt source files.

## Public Upload Regression Follow-up

- Public web upload truncation was reproduced against `http://8.141.20.130` with large files.
- Root cause was the old Next.js upload proxy path buffering the request body and cutting large uploads to about `10.48 MB`.
- Frontend fix shipped:
  - `apps/web/next.config.ts`
    - `experimental.proxyClientMaxBodySize = 120 * 1024 * 1024`
  - `apps/web/src/proxy.ts`
    - excluded `/api` from the auth proxy matcher
  - `apps/web/src/app/api/uploads/_shared.ts`
    - binary upload proxy now streams `request.body`
    - forwards `Content-Length`
- Added reusable verification script:
  - `scripts/smoke-public-video-upload.mjs`
  - supports both new uploads and broken-asset reuploads with `--asset-id`

## Repaired Cloud Prompt Records

- Prompt `a7fbf84b-f555-46ce-ad46-1d5c5b6ef89e` (`万镜碎虚-测试`)
  - source asset `43a675b8-290f-45af-a0fc-5da4f9070c08`
  - re-uploaded original file `E:\视频\3月19日(15).mp4`
  - source size corrected from `10484846` to `51580892`
  - worker generated:
    - cover `/media/community/test/image/cover/30a90d51-8538-4bbc-baf2-da9c48a323eb/3-19--15--cover.jpg`
    - preview `/media/community/test/video/preview/c78f0f97-611f-4f13-84d3-eed775fd5275/3-19--15--preview.mp4`
- Prompt `bdf46a83-7da3-4f17-b25c-6fbcce82b195` (`万镜碎虚`)
  - source asset `ef335ad1-2115-455e-b01a-03a36769f6b8`
  - re-uploaded original file `E:\视频\3月19日(10).mp4`
  - source size corrected from `10484846` to `53420563`
  - worker generated:
    - cover `/media/community/test/image/cover/2f4f392d-eb1d-4f8d-994e-e7eb94fc8452/3-19--10--cover.jpg`
    - preview `/media/community/test/video/preview/67992bd2-717c-4def-9bca-3b4857831832/3-19--10--preview.mp4`

## Repair Order

- Requeue must happen after the re-upload finishes.
- If `video_media_process` is requeued while the asset is still `pending_upload`, worker will fail again with:
  - `prompt source asset is invalid or unavailable`
