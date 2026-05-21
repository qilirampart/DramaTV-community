# 媒体上传与 OSS 预备方案

更新时间：2026-04-24

## 1. 目的

这份文档用于说明 DramaTV 社区当前的本地媒体上传实现、已经具备的 OSS 兼容基础，以及后续切换到对象存储前需要继续完成的收口项。

当前目标不是立刻把本地上传切成 OSS，而是先把代码结构、配置口和资源分类收紧，避免后面切云时再返工发布链路、数据库字段和页面消费方式。

2026-04-24 补充说明：

- 第一阶段“后端写 OSS”已经落地到后端代码。
- 现有前端上传链路仍保持“两段式 policy + binary PUT 到后端”不变。
- 当前还没有切到“前端预签名直传 OSS”，这仍然属于下一阶段优化。

## 2. 当前现状

### 2.1 当前上传链路

当前发布页和资料编辑页的媒体上传链路已经是两段式：

1. 前端先请求后端创建上传策略。
2. 后端登记 `media_assets` 记录，返回 `assetId + uploadUrl`。
3. 前端再把二进制文件 `PUT` 到该地址。
4. 后端把资产状态从 `pending_upload` 改为 `ready`。

这条链路的优点是：

- 前端已经不是“直接把文件表单整包提交给业务接口”。
- 后续切成 OSS 预签名直传时，前端交互形态基本不用重写。
- `assetId` 已经可以作为发布草稿、详情页、异步任务之间的稳定引用。

### 2.2 当前真实存储

当前文件真实写入位置仍然是本机磁盘：

- 默认目录：`tmp/media`
- 默认访问路径：`/media/**`
- 当前 provider：`local_fs`

后端配置已在 `application.yml` 中收口到 `dramatv.media.*`。

### 2.3 当前数据库基础

`media_assets` 表已经具备对象存储迁移所需的核心字段：

- `storage_provider`
- `bucket_name`
- `object_key`
- `mime_type`
- `size_bytes`
- `width / height`
- `duration_ms`
- `checksum`
- `status_code`

这意味着：

- 资源 metadata 不需要因为切 OSS 而整体推倒重建。
- 后续主要改造点会落在“上传实现”和“访问 URL 解析”。

## 3. 当前仍然存在的本地耦合

### 3.1 `object_key` 当前处于“新旧并存”阶段

当前仓库已经开始往“`object_key` 存对象键”收口，但历史数据里仍有一部分记录直接存的是可访问 URL 或根路径。

当前状态是：

- 新的本地上传记录，已经开始存相对对象键，例如 `video/{assetId}/source.mp4`
- 导入到 `apps/web/public` 的本地公共资源，开始存去掉前导 `/` 的相对路径
- 历史数据里，仍然可能存在完整 URL 或 `/xxx/yyy` 这类旧写法

这就是为什么当前后端已经补了一层统一媒体地址解析器，而不是直接假设所有数据都已经干净一致。

从长期看，更合理的语义应该是：

- `object_key`：桶内对象路径，例如 `video/{assetId}/source.mp4`
- `public_url` 或解析后 URL：对外访问地址，例如 CDN 地址

现阶段不直接清洗所有旧数据，原因是当前本地环境里已经有历史导入素材和旧记录，贸然批量改库风险偏高。当前更稳妥的策略是：

- 先让新的写入路径按对象键语义落地
- 让读取路径统一走解析器兼容新旧数据
- 等后续确认好 OSS 方案后，再决定是否批量清洗历史记录

### 3.2 上传实现仍只有本地磁盘版本

虽然配置项已经预留到对象存储方向，但当前后端真正执行二进制上传的实现仍然只有 `local_fs`。

如果有人提前把 `DRAMATV_MEDIA_STORAGE_PROVIDER` 配成 `oss`，当前版本会显式返回错误，而不是继续按本地磁盘偷偷写入一套不一致数据。

这样做的目的不是限制切云，而是避免“配置看起来像上云了，实际行为还是本地临时实现”。

## 4. 当前推荐的资源分类

后续不管资源来自用户上传，还是历史导入的 YouMind 素材，统一按资产职责区分：

| 资产类别 | 用途 | 是否建议走 OSS |
| --- | --- | --- |
| `video/source` | 原始视频文件 | 是 |
| `video/preview` | 列表页或详情页轻量预览 | 是 |
| `video/poster` | 视频 poster / 首帧图 | 是 |
| `image/source` | 图片提示词原图 | 是 |
| `image/cover` | 列表或详情页封面图 | 是 |
| `avatar/source` | 用户头像 | 是 |

数据库里继续保存 metadata，不保存大文件本体。

## 5. 建议的对象键约定

后续切 OSS 时，建议对象键遵循“环境 / 业务 / 资产类型 / 主体 ID / 文件”结构。

示例：

```text
community/test/video/source/{assetId}/source.mp4
community/test/video/preview/{assetId}/preview.mp4
community/test/video/poster/{assetId}/poster.jpg
community/test/prompt/image/{assetId}/source.webp
community/test/avatar/{userId}/{assetId}.png
```

这样做的好处：

- 环境隔离清楚，测试资源不会污染生产。
- 便于生命周期策略和回收策略按目录配置。
- 后续导入历史素材时也容易按业务分桶或分前缀。

## 6. 当前代码已完成的 OSS 预备改造

本轮已完成以下收口：

- 把媒体存储配置集中到 `dramatv.media.*`。
- 去掉上传服务里写死的 `provider / bucket / public path` 常量。
- 新上传资产开始把 `object_key` 存成相对对象键，而不是直接存公开 URL。
- 查询层补了一层统一媒体地址解析器，优先兼容旧 URL、旧相对路径和新的对象键写法。
- 把本地静态资源暴露开关也配置化，后续切 CDN 后可以直接关闭本地 `/media/**` 映射。
- 为未来 OSS 补齐环境变量占位：
  - `DRAMATV_MEDIA_STORAGE_PROVIDER`
  - `DRAMATV_MEDIA_BUCKET_NAME`
  - `DRAMATV_MEDIA_PUBLIC_BASE_URL`
  - `DRAMATV_MEDIA_PUBLIC_BASE_PATH`
  - `DRAMATV_MEDIA_OSS_ENDPOINT`
  - `DRAMATV_MEDIA_OSS_REGION`
  - `DRAMATV_MEDIA_OSS_ACCESS_KEY`
  - `DRAMATV_MEDIA_OSS_SECRET_KEY`

这些改造不会改变当前本地页面的上传和展示行为。

## 7. 后续真正切 OSS 时还要做什么

### 7.1 上传实现

需要把当前“后端接收二进制并写入本地磁盘”的实现切成下面两种之一：

- 推荐：后端生成预签名上传策略，前端直传 OSS。
- 过渡：前端先传后端，再由后端写 OSS。

当前项目更适合第一种，因为前端已经具备“先拿 policy、再单独上传文件”的调用形态。

### 7.2 URL 解析层

需要把查询层逐步从“直接返回 `object_key`”切到“返回解析后的可访问 URL”。

建议新增一层统一解析规则：

- 本地模式：`object_key` 可暂时仍返回本地 URL。
- OSS 模式：由 `bucket + object_key + CDN base URL` 解析为访问地址。

这一步完成后，`object_key` 才能真正回归“对象键”语义。

### 7.2.1 当前测试环境的真实落地方式

结合当前测试资源，社区媒体链路现在应该按下面这条路径理解：

- 上传写入：`Spring Boot -> OSS`
- 前端展示：`Browser -> 社区后端 /media/** -> OSS 内网端点`
- 视频播放：继续依赖 `/media/**` 的 `Range` 支持

原因很直接：

- 当前拿到的是私有桶
- 当前拿到的是 `oss-cn-beijing-internal` 内网域名
- 当前还没有 CDN 公网域名

这意味着：

- ECS 上的后端可以通过内网访问 OSS
- 浏览器不能直接把这个 internal 域名当作公开媒体地址使用
- 所以前端当前不能假设“拿到 OSS URL 就能直接播”

因此，测试环境下的正式口径应该是：

1. 文件写入 OSS。
2. 数据库继续记录 `storage_provider / bucket_name / object_key`。
3. 对外展示仍优先返回社区自己的 `/media/**` 路径。
4. 社区后端作为私有桶读取代理，对浏览器继续暴露正常的 `GET / HEAD / Range` 行为。

这不是过渡期的“临时凑合”，而是当前没有 CDN 时最合理、也最符合私有桶约束的正式链路。

### 7.3 媒体后处理

切 OSS 后还需要把这些动作从同步发布链路中剥离：

- 视频转码
- poster 抽帧
- preview 生成
- 图片压缩或缩略图生成
- 文件校验和去重

这部分建议由后续 `Python Worker / FastAPI + Queue` 承接。

## 8. 现在就可以提前准备的内容

在还没拿到运维资源之前，可以先继续做下面几件事：

1. 统一本地导入素材的命名和目录规范，避免后续批量迁移时重新清洗。
2. 给历史素材补齐 `mime_type / size_bytes / duration_ms / width / height`。
3. 把上传成功后的资源引用全部收口到 `media_assets.id`，不要再让业务表直接绑裸 URL。
4. 梳理哪些页面需要封面、哪些需要预览、哪些必须原视频，避免以后所有资源都走大文件。

## 9. 对接运维时最关键的确认项

真正开始接 OSS 时，优先确认这几项：

- 使用哪一种对象存储。
- 是否支持预签名直传。
- Bucket 是否按环境隔离。
- CDN 域名是否已准备好。
- 是否支持视频 Range 请求。
- 是否有跨域配置入口。
- 上传密钥如何通过 Secret 管理，不直接写仓库。
- 生命周期策略如何区分原视频、预览、封面和临时文件。

## 10. 当前结论

DramaTV 当前已经从“只有 OSS 预备骨架”进入到“支持第一阶段后端写 OSS”的状态。

最重要的判断是：

- 前端上传交互形态已经基本合适。
- 数据库资产表字段已经够用。
- 后端 OSS 上传实现和基础 URL 解析已经补上。
- 现在缺的是运维侧真实鉴权信息、公开访问域名或 CDN、异步媒体处理和第二阶段预签名直传。
- 在当前只有 OSS 内网端点、没有 CDN 的前提下，测试环境的正确方案不是“浏览器直连 OSS”，而是“后端写 OSS + 后端 `/media` 代理读 OSS + 保持 Range 可用”。

所以当前最合理的策略仍然是：

- 本地继续稳定业务闭环。
- 同时把媒体配置、资源分类、对象键规范和运维对接信息继续收口。
- 当前测试环境已按 `RAM Role` 口径完成真实 smoke，后端写 OSS 已经实测通过，不再停留在“只能等资源确认后再验证”的状态。
- 等公网域名或 CDN 准备好，再推进第二阶段“前端预签名直传 OSS”。

## 11. 2026-04-30 测试环境真实 smoke 结果

本轮已对公网测试环境 `http://8.141.20.130` 做真实验证，结论如下：

### 11.1 OSS 上传 smoke

- 使用测试账号 `creator-b / 123456`
- 通过公网入口申请上传策略、上传一个 1x1 PNG 小文件
- 返回结果：
  - `statusCode = ready`
  - `mediaPath = /media/community/test/image/attachment/{assetId}/...png`
  - `publicUrl = /media/community/test/image/attachment/{assetId}/...png`
- 随后对返回的 `/media/**` 地址做 `HEAD` 探测，结果 `200`

这说明当前测试环境已经满足：

- 社区后端可写 OSS
- 公网前端/浏览器可通过社区自己的 `/media/**` 代理读到该资源

### 11.2 Range smoke

- 使用同一测试环境上传一个 1024 字节的小视频对象
- 对返回的 `/media/**` 地址验证：
  - `HEAD` 返回 `200`
  - `GET Range: bytes=0-63` 返回 `206`
  - `Content-Range = bytes 0-63/1024`

这说明当前测试环境已经满足：

- `/media/**` 的视频代理可用
- 视频分段读取可用
- 当前私有桶 + 后端代理模式下，视频播放所依赖的 `Range` 行为是通的

### 11.3 本轮额外确认

- 公网环境的 `/api/uploads/**` 不是直接进 Spring Boot，而是先经过 Next 上传代理
- 该代理当前依赖 `dramatv_access_token` Cookie 透传登录态，不是单纯只认 Bearer Header
- 因此后续所有“公网上传 smoke 脚本”都应兼容这条代理链路，否则会误判为 `403`

### 11.4 本轮代码与部署侧收口

- 后端已补一处真实代理优化：
  - `MediaProxyService` 在 OSS 模式下处理 `HEAD /media/**` 时，现已改为只读取 object metadata，不再触发对象流下载
  - 这可以减少播放器探测和 smoke 脚本对私有桶代理的无效开销
- 已新增单测覆盖该行为：
  - `apps/server/src/test/java/com/dramatv/community/shared/media/MediaProxyServiceTest.java`
- 公网上传 smoke 与 Range smoke 脚本已同步兼容当前登录态透传方式：
  - `scripts/smoke-oss-upload.mjs`
  - `scripts/smoke-media-range.mjs`
  - 当前都按 `Authorization + dramatv_access_token Cookie` 双携带方式跑公网验收
- 前端测试环境部署模板已去掉重复的 `Accept-Ranges` 响应头注入：
  - `scripts/deploy-test-web.ps1`
  - 原因是社区后端 `/media/**` 已经返回该头，Nginx 再加会出现 `accept-ranges: bytes, bytes`
## 2026-04-24 auth update

- Current test-env decision: OSS access on ECS should use `RAM Role`, not long-lived `AK/SK`.
- Backend implementation status:
  - `dramatv.media.oss.auth-mode=auto` by default
  - if `access-key + secret-key` are both provided, backend still uses static credentials for local/dev fallback
  - if static credentials are absent, backend now falls back to `ECS RAM Role`
  - `dramatv.media.oss.role-name` can be configured explicitly
  - if `role-name` is empty, backend tries metadata auto-discovery from `http://100.100.100.200/latest/meta-data/ram/security-credentials/`
- Current bucket/domain facts from ops:
  - bucket: `dz-ailab-community`
  - internal endpoint/domain is for cloud internal access only
  - bucket permission is private read/write
  - CDN is not configured yet
- Product impact:
  - backend upload/write can proceed now on ECS with RAM Role
  - frontend browser display must not assume direct public OSS URLs
  - before CDN/public-domain is ready, private-bucket read paths should use backend proxy or signed access strategy
