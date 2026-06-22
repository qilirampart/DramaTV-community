# T6-3 热点媒体代理缓存补充记录（第一阶段）

日期：`2026-05-23`
范围：`无 CDN / 私有 OSS 阶段媒体优化`
状态：`第一阶段已完成`

## 本轮结论

- 这轮先完成了 `T6-3` 的本地可落地部分：`/media/**` 已按 `asset_role` 输出不同的 `Cache-Control`。
- 当前还没有做云上 `Nginx / 网关` 的热点代理缓存放大，所以这条任务整体还不算全部结束；本轮完成的是“应用层先收口缓存口径”。

## 当前策略

- `avatar`：`public, max-age=86400`
- `cover`：`public, max-age=86400`
- `poster`：`public, max-age=86400`
- `preview`：`public, max-age=14400`
- `source`：`public, max-age=3600`
- `attachment`：`public, max-age=3600`
- `default`：`public, max-age=3600`

## 本轮修改

- 新增媒体缓存配置：
  - `apps/server/src/main/java/com/dramatv/community/shared/config/MediaStorageProperties.java`
  - `apps/server/src/main/resources/application.yml`
- `/media/**` 按 `asset_role` 下发缓存头：
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyService.java`
- 回归测试补齐：
  - `apps/server/src/test/java/com/dramatv/community/shared/media/MediaProxyServiceTest.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/MediaProxyApiIntegrationTest.java`

## 运行态验证

- 定向测试通过：
  - `MediaProxyServiceTest`
  - `MediaProxyApiIntegrationTest`
- 本地编译通过：
  - `apps/server -DskipTests compile`
- 真实运行态复验通过：
  - `cover`
    - `HEAD /media/community/local/image/cover/7dcdca35-c9bb-40b7-b0e7-b07f7128c58d/video-cover.jpg`
    - 返回 `Cache-Control: public, max-age=86400`
  - `source`
    - `HEAD /media/community/local/video/source/ef196f3e-b4cf-4c6f-b22b-50f96a108329/video.mp4`
    - 返回 `Cache-Control: public, max-age=3600`

## 当前库存现状

- 本地库当前 `asset_role` 统计：
  - `attachment = 35`
  - `cover = 2`
  - `source = 144`
- 当前没有 `preview` 资产库存。
- 这说明：
  - 角色化缓存策略已经具备
  - 但 `preview` 资源本身仍是库存缺口
  - 所以后续体感优化的关键仍然是 `T6-4 派生资源补齐`

## 下一步

1. 优先推进 `T6-4`：补 `preview/poster/cover` 派生资源，而不是继续让列表和悬浮预览依赖 `source`
2. 云上可操作时，再做 `T6-3` 第二阶段：把同一套角色化缓存口径搬到 `Nginx / 网关`，减少热点媒体稳定穿透到应用层
