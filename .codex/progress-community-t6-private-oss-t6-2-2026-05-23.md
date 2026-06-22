# T6-2 `/media/**` 协商缓存补充记录

日期：`2026-05-23`
范围：`无 CDN / 私有 OSS 阶段媒体优化`
状态：`已完成`

## 本轮结论

- `/media/**` 现在统一由 `MediaProxyController + MediaProxyService` 负责本地文件和 OSS 资源输出。
- 已补齐协商缓存响应头：
  - `ETag`
  - `Last-Modified`
  - `Cache-Control`
  - `Accept-Ranges`
- 已补齐条件请求行为：
  - 非 `Range` 请求命中 `If-None-Match` 时返回 `304`
  - 非 `Range` 请求命中 `If-Modified-Since` 时返回 `304`
  - 带 `Range` 的请求不会错误降成 `304`，仍保持 `206 Partial Content`

## 根因

- 之前运行态看不到 `ETag / Last-Modified`，不是 `MediaProxyService` 逻辑没生效，而是本地 `serveLocally=true` 时还额外挂了一条 `/media/**` 的 Spring 静态资源处理器。
- 这条 `ResourceHttpRequestHandler` 抢走了本地媒体请求，导致运行态命中了静态资源链路，而不是新补的代理控制器链路。

## 本轮修改

- 删除本地冲突的静态资源注册：
  - `apps/server/src/main/java/com/dramatv/community/shared/config/MediaResourceConfig.java`
- 保留并启用媒体代理缓存逻辑：
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyController.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyService.java`
- 补充回归测试：
  - `apps/server/src/test/java/com/dramatv/community/shared/media/MediaProxyServiceTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/MediaProxyApiIntegrationTest.java`

## 验证

- 定向后端测试通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=MediaProxyServiceTest,MediaProxyApiIntegrationTest" test`
- 后端编译通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile`
- 本地运行态复验通过：
  - `HEAD /media/.../video.mp4` 返回：
    - `ETag: W/"ec16a1fd"`
    - `Last-Modified: Thu, 7 May 2026 10:26:37 GMT`
  - `GET /media/.../video.mp4` 携带 `If-None-Match` 返回 `304`
  - `GET /media/.../video.mp4` 携带 `If-Modified-Since` 返回 `304`
  - `GET /media/.../video.mp4` 携带 `Range: bytes=0-15` 和 `If-None-Match` 返回：
    - `206 Partial Content`
    - `Content-Range: bytes 0-15/55144`
    - 同时保留 `ETag` 和 `Last-Modified`

## 下一步

- 继续 `T6-3`：梳理 `/media/**` 的公共缓存策略边界，区分封面、poster、preview、source 的缓存时长和后续 CDN 对接口径。
