# T6-1 媒体消费分层固化补充记录

日期：`2026-05-23`
范围：`无 CDN / 私有 OSS 阶段媒体优化`
状态：`已完成`

## 本轮完成

- 前端首页资源卡片不再把 `sourceUrl` 当作悬浮预览兜底。
- 详情页相关推荐卡片不再把 `sourceUrl` 当作悬浮预览兜底。
- 后端提示词读链路已收口：
  - `/api/feed/home`
  - `/api/prompts`
  - `/api/prompts/{id}`
  - `/api/prompts/{id}/related`
  以上接口在“没有 preview 资产”的情况下，不再把 source 视频冒充成 `previewUrl`。
- 前端提示词详情映射已收口，`previewUrl` 与 `sourceUrl` 语义分离。

## 涉及文件

- `apps/web/src/features/home/CommunityHomePage.tsx`
- `apps/web/src/features/video-detail/VideoDetailPage.tsx`
- `apps/web/src/lib/mappers/community.ts`
- `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
- `apps/server/src/main/java/com/dramatv/community/prompt/application/PromptQueryService.java`
- `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java`
- `apps/server/src/test/java/com/dramatv/community/integration/PromptReadApiIntegrationTest.java`

## 验证

- `npm.cmd run typecheck:web` 通过
- `npm.cmd run build:web` 通过
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=FeedReadApiIntegrationTest,PromptReadApiIntegrationTest" test` 通过
- 本地运行时接口复核：
  - `GET /api/prompts/341f0a54-0ff4-49e3-9e49-2046ad1ace53`
    - `previewUrl = null`
    - `sourceUrl` 保留
  - `GET /api/feed/home`
    - 同一提示词条目 `previewUrl = null`
    - `sourceUrl` 保留
- 浏览器复核：
  - `http://127.0.0.1:3106/home`
  - 首个“为你推荐”视频提示词卡片悬浮后，不再产生 `/media/.../source/...` 请求

## 下一步

- 继续 `T6-2 /media/**` 协商缓存
- 目标是补 `ETag / Last-Modified / 304`
