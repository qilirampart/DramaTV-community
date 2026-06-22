# 社区主线 T6 媒体优化专题

## 当前范围

- 当前专题只覆盖“没有 CDN、没有公网 OSS、前端展示继续走社区后端 `/media/**` 代理”的阶段性优化。
- 当前正式链路固定为：
  - 上传：`前端 -> 社区后端 -> OSS`
  - 展示：`Browser -> 社区后端 /media/** -> 私有 OSS`
- 当前优化目标不是让浏览器绕过后端，而是把社区后端这一层媒体网关做得更轻、更稳、更可观测。

## 当前看板

- 已完成：`T6-1 媒体消费分层固化`
  - 目标：列表优先 `cover/poster`，悬浮预览优先 `preview`，详情/全屏才吃 `source`
  - 现状：已完成
- 已完成：`T6-2 /media/** 协商缓存`
  - 目标：补 `ETag / Last-Modified / 304`
  - 现状：已完成
- 进行中：`T6-3 热点媒体代理缓存`
  - 目标：在云上入口层缓存 `cover/poster/preview`
  - 依赖：需要云上 `Nginx / 网关` 可配
  - 现状：应用层缓存口径已固化，云入口层还未推进
- 已完成：`T6-4 派生资源补齐`
  - 目标：大视频自动补 `cover + preview`，大图补派生 `cover/thumb`
  - 当前进度：
    - 视频侧第一阶段已完成：`> 6MB` 的历史视频已完成一轮真实 preview backfill
    - 图片侧第一阶段已完成：`image_prompt` 已具备“条件触发 image_media_process 并生成派生 cover”的后端真链路
    - 图片侧第二阶段已完成：历史大图 backfill 路径已补齐，且本地库存当前候选已从 `1` 条降到 `0`
    - 图片侧契约已收口：现阶段不新增独立 `thumb` 字段，继续固定走 `cover -> poster`
- 进行中：`T6-5 资源去重`
  - 目标：基于 `checksum` 的上传/导入去重与资源复用策略
  - 当前进度：第一阶段已完成，已落地“同 `asset_kind + asset_role + checksum + size_bytes` 复用物理对象、保留独立 `media_assets` 记录”
  - 当前边界：暂不跨 `asset_role` 复用，不把整表直接收敛成全局唯一资产表
  - 已验证：`UploadValidationIntegrationTest + UploadLoggingIntegrationTest -> 7 passed / 0 failed`；`PublishPipelineIntegrationTest -> 13 passed / 0 failed`
- 进行中：`T6-6 代理层保护与观测`
  - 目标：限并发、慢请求观测、失败降级、热点日志
  - 当前进度：第一阶段已完成，已补 `Semaphore` 限并发、`503 MEDIA_PROXY_BUSY`、慢请求结构化日志、5xx 失败日志；热点聚合统计待后续继续评估

## 执行顺序

1. `T6-1 媒体消费分层固化`
2. `T6-4 派生资源补齐`
3. `T6-2 /media/** 协商缓存`
4. `T6-6 代理层保护与观测`
5. `T6-5 资源去重`
6. `T6-3 热点媒体代理缓存`

## 追加日志

### 2026-05-23 task board created

- 先把“无 CDN / 私有 OSS 阶段还能做哪些优化”正式落成专题任务板，避免继续散落在聊天和临时分析里。
- 本专题与既有 `T2-3 OSS / CDN / Range` 的边界固定为：
  - `T2-3`：当前“后端写 OSS + `/media/**` 代理读私有桶 + Range 可用”的正式方案
  - `T6`：在这套已成立方案之上继续做资源分层、缓存、去重、代理保护和观测增强

### 2026-05-23 T6 status sync + preview sizing analysis started

- 已同步真实现状：
  - `T6-1` 已完成
  - `T6-2` 已完成
  - `T6-3` 进入“应用层已完成、云入口层待做”的进行中状态
  - `T6-4` 正式开始
- 先做了一轮本地媒体库存盘点，而不是凭经验直接定策略。
- 结论：
  - 视频侧不适合“一刀切”全部再压一轮 preview
  - 更合理的策略是按体积和码率做条件派生
  - 图片侧优先补 `cover/thumb`，而不是引入视频语义的 `preview`

### 2026-05-23 T6-4 video derivative backfill phase 1 completed

- 已把视频 preview 条件派生阈值正式收口到 `6MB`：
  - `<= 6MB` 的源视频不再一刀切重压
  - `> 6MB` 且缺真实 `preview` 的视频 / 视频提示词进入 backfill 队列
- 已新增本地 backfill 脚本并完成一轮真实回填：
  - dry run 候选 `7` 条
  - 实际补齐 `6` 条历史视频提示词 preview
  - 实际补齐 `1` 条历史视频 preview
- 同时补掉两个已验证根因：
  - 历史 prompt 视频源资源使用 `local-public + apps-web-public + apps/web/public/**` 时，处理器原先无法 materialize，现已支持
  - 原逻辑只按 `preview_asset_id` 是否为空判断是否已有 preview，会把 `source` 误当成 preview；现已按 `asset_role=preview` 判断
- 本轮验证：
  - `PublishPipelineIntegrationTest` 定向集成测试通过
  - `node scripts/backfill-media-derivative-tasks.mjs --threshold-mb 6` 最终候选数降到 `0`

### 2026-05-24 T6-4 image derivative phase 1 completed

- 这轮继续推进 `T6-4`，范围严格收窄在图片提示词的首条真实处理链路：
  - `image_prompt` 提交后，如果 `sourceAssetId` 对应的是大图且当前未显式绑定 `coverAssetId`，会创建 `image_media_process`
  - 新增 `ImageMediaProcessingService`，按任务生成派生 `cover`
  - 新增 `ImageMediaTaskScheduler`，把图片处理纳入现有媒体 worker 节奏
- 这轮没有提前扩前端契约：
  - 先只补 `cover`
  - `poster` 继续走现有 `cover` 回退
  - 不在这一轮引入新的 `thumb` 字段，也不做历史图片全量 backfill
- 共享层同步补齐：
  - 草稿 `lifecycle.processingStatus` 现在已能识别 `image_media_process`
  - `/api/media-tasks/{id}`、后台媒体任务列表、后台总览里的媒体任务统计，现都覆盖图片任务
- 这轮额外修掉一个真实阻塞：
  - `PublishDraftLifecycleQueryService` 中把 SQL 常量拼入 Java text block 的写法导致编译失败，现已改成固定 SQL 常量
  - 同文件里受历史编码污染的处理提示文案也已顺手收口
- 本轮验证：
  - `scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml '-Dtest=PublishPipelineIntegrationTest,AdminMediaTaskApiIntegrationTest,AdminDashboardOverviewApiIntegrationTest' test` -> `16 passed / 0 failed`
  - `scripts/run-backend-integration-suite.ps1 -Suite core` -> `42 passed / 0 failed`
- 当前做到哪一步：
  - `T6-4` 视频侧第一阶段已完成
  - `T6-4` 图片侧第一阶段已完成，图片提示词已有“条件派生封面”的后端真链路
- 下次先做什么：
  1. 评估是否需要对历史大图做一次性 backfill
  2. 再决定图片侧是否值得拆出独立 `thumb`，而不是现在就把前端字段做复杂

### 2026-05-24 T6-4 image historical inventory synced

- 已把“是否需要历史大图 backfill”这一步从讨论推进到本地事实盘点，并同步回专题任务板。
- 本地 PostgreSQL 盘点结果：
  - `imagePromptTotal = 44`
  - `imagePromptOver1mb = 1`
  - `imagePromptMissingCover = 14`
  - `largeImageMissingCover = 0`
- 进一步细查发现：
  - 缺 `cover` 的 14 条全是小图，最大仅 `318194 bytes` (`0.3035 MB`)
  - 但唯一一条 `> 1MB` 图片提示词 `067736ea-1c9d-5ffd-a946-40f3f1043442` 的 `coverAssetId` 虽然非空，却仍指向原图 `source`
  - 本地运行态 `GET /api/prompts/067736ea-1c9d-5ffd-a946-40f3f1043442` 也已验证 `coverUrl/posterUrl` 仍返回 `/nano-banana-images/000002-6847/01.png`
- 当前结论：
  - 历史大图 backfill 不能按“`coverAssetId` 是否为空”简单关闭
  - `T6-4` 下一步应改为：补一条“一次性、本地、可验证”的历史图片回填路径，覆盖“cover 指向 source 原图 / 非派生 cover”的历史记录

### 2026-05-24 T6-4 image historical backfill + thumb decision completed

- 已把 `T6-4` 的图片侧第二阶段真正做完，而不是只停在判断结论：
  - `PublishAsyncTaskPersistenceService` 现在不会再因为 `coverAssetId` 非空就盲目跳过图片媒体任务；若 `coverAssetId` 其实等于 source、缺资产、不是图片，或 `asset_role != cover`，仍会正常入队 `image_media_process`
  - `ImageMediaProcessingService` 现在会识别“`cover` 指向 source 原图 / 非派生 cover”的历史脏数据，不再只看 `coverAssetId is null`
  - `PublishModerationPersistenceService` 现在允许把图片提示词的无效历史 cover 替换成真正的派生 `cover`
  - `scripts/backfill-media-derivative-tasks.mjs` 已扩成同时支持视频和图片库存扫描；图片候选会识别 `coverState=missing/source/missing-asset/wrong-kind/role-*`
- 本轮本地真实验证已经完成：
  - 定向回归：`scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml '-Dtest=PublishPipelineIntegrationTest' test` -> `13 passed / 0 failed`
  - 本地专题库存扫描：`node scripts/backfill-media-derivative-tasks.mjs` -> 初始候选 `1`
  - 本地真实回填：`node scripts/backfill-media-derivative-tasks.mjs --apply` -> 入队 `1`
  - 本地后端重启到新代码后再次扫描：候选降到 `0`
  - 运行态接口复核：`GET /api/prompts/067736ea-1c9d-5ffd-a946-40f3f1043442` 现已返回
    - `coverUrl = /media/community/local/image/cover/7a56c39f-9647-4316-bec6-72adda280a1b/01-cover.jpg`
    - `posterUrl = /media/community/local/image/cover/7a56c39f-9647-4316-bec6-72adda280a1b/01-cover.jpg`
  - 数据库复核：
    - `coverAssetRole = cover`
    - `coverObjectKey = community/local/image/cover/7a56c39f-9647-4316-bec6-72adda280a1b/01-cover.jpg`
    - `sourceObjectKey = nano-banana-images/000002-6847/01.png`
- `thumb` 契约本轮同步收口：
  - 后端 `PromptQueryService` 仍固定 `posterUrl -> coverUrl`
  - 前端现有列表/详情消费点都已按 `posterUrl ?? coverUrl` 工作
  - 既然大图现在已经会落成轻量派生 `cover`，现阶段没有必要再额外扩一个独立 `thumb` 字段
- 当前结论：
  - `T6-4` 现已完成
  - 下一阶段应切到 `T6-6 代理层保护与观测`，再回头处理 `T6-5 资源去重`
### 2026-05-24 T6-6 proxy guard phase 1 completed

- 已把 `T6-6` 从待做推进到进行中，并先落最小有效切片，而不是一次把代理层做重：
  - `application.yml` 新增 `dramatv.media.proxy.enabled / max-concurrent-requests / slow-request-threshold-ms`
  - `MediaStorageProperties` 新增 `proxy` 配置绑定
  - `MediaProxyService` 已补进程内 `Semaphore` 并发闸门，过载时返回 `503`
  - `ApiExceptionHandler` 已把该路径映射为稳定错误码 `MEDIA_PROXY_BUSY`
  - 代理层现已补齐两类结构化日志：`media_proxy_slow`、`media_proxy_failure`；过载日志为 `media_proxy_busy`
- 这轮刻意没改 `/media/**` 现有契约：
  - 仍保留既有 `ETag / Last-Modified / 304 / Range 206`
  - 不改变本地文件与 OSS 的对象解析口径
  - 不提前引入更重的指标系统或额外存储
- 本轮验证证据：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=MediaProxyServiceTest,MediaProxyApiIntegrationTest" test` -> `10 passed / 0 failed`
  - 本地后端已重启到新代码：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-server-dev-18080.ps1 -Port 18080 -StartupTimeoutSec 120`
  - `GET http://127.0.0.1:18080/actuator/health` -> `{"status":"UP"}`
  - `HEAD /media/community/local/image/cover/7a56c39f-9647-4316-bec6-72adda280a1b/01-cover.jpg` -> `200`，并返回 `Cache-Control / ETag / Last-Modified / Accept-Ranges`
- 当前做到哪一步：
  - `T6-6` 第一阶段已完成，代理层已经具备最基础的过载保护与慢请求可观测性
- 下次先做什么：
  1. 视需要补热点对象的聚合统计或入口层计数
  2. 再切回 `T6-5 资源去重`
### 2026-05-24 T6-5 asset dedup phase 1 completed locally

- 已把媒体优化专题切到 `T6-5 资源去重`，并先落最小可验证切片，而不是直接把 `media_assets` 改造成全局唯一资产表。
- 后端上传主链路现在已具备真实二进制 `SHA-256` 能力：
  - `uploadBinary(...)` 先 materialize 输入流、计算 `checksum + size_bytes`，再决定复用还是实际写入。
  - 命中同 `asset_kind + asset_role + storage_provider + bucket_name + checksum + size_bytes + ready` 资产时，当前行直接复用已有 `object_key`，不再重复落盘/上传。
  - 未命中时正常写入，并把 `checksum` 持久化到当前 `media_assets` 行。
- 派生资源链路 `storeDerivedAsset(...)` 同步收口：
  - 生成 `cover / preview / poster / avatar / attachment` 时，也按同角色同内容复用已有物理对象。
  - 仍保留独立 `media_assets` 记录，所以后续业务关系、审核、引用计数口径不会被这轮强行改坏。
- 这轮刻意不做的事：
  - 不跨 `asset_role` 复用对象，避免 `/media/**` 仅按 `object_key` 解析时混淆 `cover/source/avatar` 语义。
  - 不直接修改导入脚本或云端去重脚本，先把正式后端上传链路做稳。
- 本轮新增回归保护：
  - `UploadValidationIntegrationTest` 新增“同角色同内容二次上传复用 object_key”与“同角色派生资源复用 object_key”两条集成测试。
  - `UploadLoggingIntegrationTest` 继续覆盖上传成功日志，并新增 `checksum / reusedObjectKey` 字段输出。
- 本轮真实验证证据：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=UploadValidationIntegrationTest,UploadLoggingIntegrationTest" test` -> `7 passed / 0 failed`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=PublishPipelineIntegrationTest" test` -> `13 passed / 0 failed`
- 当前做到哪一步：
  - `T6-5` 第一阶段已完成，本地正式上传链路和派生资源链路都已具备基于真实内容哈希的物理对象复用能力。
- 下次先做什么：
  1. 评估是否需要给导入脚本补同口径 `checksum`，避免后续历史库存与新写入口径继续分叉。
  2. 再决定是否要补“已有重复 `object_key` / `checksum` 的历史库存整理脚本”，而不是现在就动线上或全库数据。

### 2026-05-24 T6-5 importer checksum parity + derivative queue verification completed locally

- 已把“正式上传链路已有 checksum，但历史导入脚本口径还没对齐”这件事真正补齐到本地脚本，而不是继续留在待办里：
  - `scripts/import-youmind-prompts.mjs` 现已支持 `--offset / --limit / --queue-derivatives / --derivative-priority / --video-preview-threshold-bytes / --image-cover-threshold-bytes / --dry-run`
  - 本地可读文件资产现改为持久化真实 `SHA-256`，不再用伪造 checksum
  - 导入资产已补齐正确 `asset_role`：视频/图片源资源固定为 `source`，导入的视频封面资源固定为 `cover`
  - 导入 SQL 现已能按条件生成 `video_media_process` 与 `image_media_process` 入队语句
- 这轮同时修掉了一处会直接阻断派生资源回填的真实回归：
  - `PublishModerationPersistenceService.applyPromptMediaResult(...)` 原先使用“裸布尔参数 + 多分支 case”更新 prompt 封面，在 PostgreSQL 上会触发 `could not determine data type of parameter $1`
  - 现已改成显式 UUID 分支更新，只在 `coverAssetId != null` 时执行封面替换逻辑
- 本轮真实验证证据：
  - `scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=PublishPipelineIntegrationTest" test` -> `13 passed / 0 failed`
  - 本地运行态复核：`GET http://127.0.0.1:18080/actuator/health` -> `{"status":"UP"}`
  - 本地库存扫描：`node scripts/backfill-media-derivative-tasks.mjs` -> `Found media derivative candidates: 0`
  - 导入脚本语法检查：`node --check scripts/import-youmind-prompts.mjs` -> passed
  - 导入脚本 dry-run 产物：`artifacts/import-youmind-prompts-dry-run.sql` 已确认包含 `asset_role`、`checksum`、`async_task_records`、`sourceAssetId`、`desiredOutputs`
  - 强制阈值 dry-run 已确认视频 prompt 也会生成 `video_media_process`，其 `desiredOutputs` 含 `cover + duration + preview`
- 当前结论：
  - 本地“导入 -> 条件入队 -> prompt 媒体回调更新”这条链路已经恢复到可验证状态
  - 真正上云前，下一步不该再补本地逻辑分叉，而应开始准备云端大库存的批量 preview/cover 预处理节奏与执行顺序

### 2026-05-24 T6 cloud derivative backfill remote preview path prepared

- 已把 `scripts/backfill-media-derivative-tasks.mjs` 从“只能扫本地 PostgreSQL”扩成“`--target local|remote` 双模式”，可直接复用 `.codex/测试环境资源清单.md`、SSH tunnel 与本地 Docker `psql` 去预览或入队云测试库的大库存候选。
- 这轮刻意只改脚本层，不碰业务主链代码，也没有直接上云写库：先把“云端大库存到底还有多少待补 preview/cover”这件事做成可验证事实，而不是继续凭感觉推进。
- 本轮脚本能力补齐：
  - 支持 `--target remote`
  - 默认远端 summary 输出到 `artifacts/media-derivative-backfill/cloud/latest/summary.json`
  - 支持自动发现 `.codex/测试环境资源清单.md`
  - 自动发现逻辑已补强，会优先命中 `测试环境资源清单.md`，避免误选其他 `.codex/*.md`
  - summary 现会记录 `target / resourceFile / localPort / containerName / serverHost / dbHost / dbName`
- 本轮真实验证证据：
  - `node --check scripts/backfill-media-derivative-tasks.mjs` -> passed
  - `node scripts/backfill-media-derivative-tasks.mjs --target local --limit 5` -> `Found media derivative candidates: 0`
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote --limit 5` -> `Found media derivative candidates: 5`
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote` -> `Found media derivative candidates: 261`
- 当前云测试库 preview/cover 候选盘点结论：
  - 总候选 `261`
  - `video_media_process = 257`
  - `image_media_process = 4`
  - 当前样本看，主问题仍是“已有 source，但缺真实 preview”；另有极少量图片 prompt 缺派生 cover
- 当前做到哪一步：
  - 云端大库存的“只读盘点脚本 + 事实统计”已具备
  - 还没有执行 `--apply`，也还没有把最新媒体处理代码确认同步到云后端
- 下次先做什么：
  1. 先确认云后端是否已包含本地最新的 `image_media_process / preview backfill / prompt 媒体回调` 修复
  2. 再按小批次执行 `node scripts/backfill-media-derivative-tasks.mjs --target remote --apply --limit <n>`
  3. 每批次都复扫 summary，确认候选数下降、没有堆积错误，再逐步放量

### 2026-05-24 T6 cloud derivative backfill first cloud apply validated

- 已把云端 preview/cover 预处理从“只读盘点”推进到“真实小批次 apply + 结果复核”。
- 先做了云后端版本核对：`npm run release:list:test` 确认云后端原先仍停在 `20260522-201207`，不包含这两天的 T6 媒体处理修复，因此先同步了两轮 backend release：
  - `20260524-130626`：媒体优化与 remote backfill 准备同步
  - `20260524-131800`：重打包后正式带上 `legacy web public root fallback` 修复
- 本轮中间确认出的关键事实：
  - 云测试库首次全量只读盘点：`261` 个候选
  - 首批 `--apply --limit 10` 后，真实任务状态不是“没入队”，而是 `2 succeeded / 8 failed`
  - 失败根因被拆清为三类：
    - 大多数历史 prompt 视频源是 `storage_provider=local-public` + `bucket_name=apps-web-public`，云后端原先找不到 web release 的 `public` 目录
    - 有 1 条历史视频作品源仍是 `local_fs`，但云端共享 media 目录里不存在对应文件
    - 有 1 条 OSS 视频源能读到，但 ffmpeg preview 转码报 `Could not open encoder before EOF / Nothing was written into output file`
- 已落的代码修复：
  - `VideoMediaProcessingService.resolveWorkspaceWebPublicRoot()`
  - `ImageMediaProcessingService.resolveWorkspaceWebPublicRoot()`
  - 新逻辑现会优先尝试：
    - `DRAMATV_WEB_PUBLIC_ROOT`
    - `/opt/dramatv-community-web/current/public`
    - `/opt/dramatv-community-web/shared/public`
    - 最后才回退到本地工作区 `apps/web/public`
- 本轮本地验证证据：
  - `scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=PublishPipelineIntegrationTest" test` -> `13 passed / 0 failed`
- 本轮云端真实验证证据：
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote --apply --limit 10` 已实际入队多轮
  - 以 `2026-05-24 13:18:54+08` 之后的新任务为准复核：`8 succeeded / 2 failed`
  - 最新两类剩余失败：
    - `targetType=video targetId=22968e91-49c1-4ae4-8b61-05f4a74a5aad` -> `local source asset file does not exist`
    - `targetType=prompt targetId=23d40bdd-e65e-407b-8209-f45ae58cf636` -> ffmpeg preview 转码失败
  - 全量候选数已从 `261` 降到 `249`
- 当前做到哪一步：
  - 云端大库存 preview/cover 预处理链路已真实跑通，不再只是本地准备态
  - `local-public -> 云上 web release public` 这条历史源路径已被打通
  - 当前剩下的是个别历史源缺文件与个别视频源转码异常，不是整条链路不可用
- 下次先做什么：
  1. 给 `backfill-media-derivative-tasks.mjs` 增加“跳过近期已失败目标”或“失败黑名单输出”，避免同一坏样本反复入队
  2. 单独处理那 1 条 `local_fs` 丢源视频：确认是否能从旧备份或前端静态目录补回
  3. 单独分析那 1 条 ffmpeg 失败视频：必要时补降级转码策略或把它列入人工异常清单
  4. 在排除上述坏样本后，再继续放量云端批处理

### 2026-05-24 T6 cloud derivative retry after even-dimension fix validated

- 已把上一轮 ffmpeg 失败的 3 个定向目标单独重试，而不是继续混跑全量 backfill：
  - `23d40bdd-e65e-407b-8209-f45ae58cf636`
  - `38cf128e-24c4-46cf-bfde-5b30be3075ee`
  - `a1a2baab-4cdf-4ced-b72b-859080e93c3f`
- 本轮先补了脚本能力，再做根因闭环：
  - `scripts/backfill-media-derivative-tasks.mjs` 已新增 `--skip-failed-hours`
  - 已新增 failed-target summary 输出
  - 已新增 `--only-target-ids`
  - 已新增 `--exclude-target-ids`
- 上一轮云端 ffmpeg 失败根因已确认并修复：
  - 纵向视频如 `2160x3840` 在 `scale=-2:720` 后会得到奇数宽 `405x720`
  - `libx264` 会直接拒绝 `width not divisible by 2`
  - 后端 `VideoMediaProcessingService` 现已把 preview filter 收口为 `scale ... ,pad=ceil(iw/2)*2:ceil(ih/2)*2`
- 本地已做真实 ffmpeg 复现与修复后验证：
  - 产物：`artifacts/media-derivative-backfill/ffmpeg-repro/preview-from-url-fixed.mp4`
  - `ffprobe` 结果已确认是可用的 `406x720` H.264 preview
  - `PublishPipelineIntegrationTest -> 13 passed / 0 failed`
- 修复已同步到云后端：
  - release label=`media-preview-even-dimension-fix-2026-05-24`
  - backend release dir=`/opt/dramatv-community-server/releases/20260524-140356`
  - readiness=`11/11 passed`
- 本轮云端定向复核证据：
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote --skip-failed-hours 0 --only-target-ids ... --apply`
    - 结果：`Queued media derivative candidates: 3 (inventory=3, skippedRecentFailures=0)`
    - 产物：`artifacts/media-derivative-backfill/cloud/retry-target-apply.json`
  - 等待约 `25s` 后执行
    - `node scripts/backfill-media-derivative-tasks.mjs --target remote --skip-failed-hours 24 --only-target-ids ...`
    - 结果：`Found media derivative candidates: 0 (inventory=0, skippedRecentFailures=0)`
    - 产物：`artifacts/media-derivative-backfill/cloud/retry-target-post-wait.json`
- 当前结论：
  - “纵向视频 preview 偶数尺寸修复”已经在云端实测闭环，不再停留在本地理论修复
  - 当前剩余明确阻塞样本仍只剩 `1` 条历史 `local_fs` 丢源视频：
    - `videoId=22968e91-49c1-4ae4-8b61-05f4a74a5aad`
    - title=`悬浮列车穿城`
    - error=`local source asset file does not exist`
- 下次先做什么：
  1. 用 `--skip-failed-hours 24 + --exclude-target-ids 22968e91-49c1-4ae4-8b61-05f4a74a5aad` 继续放量云端 backfill
  2. 每批次都先 apply、再 wait、再 rescan，防止把新失败类问题埋进大批量任务里

### 2026-05-24 T6 cloud derivative bulk backfill drained to single blocker

- 在“偶数尺寸修复”定向验证通过后，已恢复云端大库存 backfill，但固定带上：
  - `--skip-failed-hours 24`
  - `--exclude-target-ids 22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- 本轮没有直接全量乱推，而是按 `20 -> 20 -> 20 -> 40 -> 40 -> 40 -> 37` 的节奏逐批 apply，并且每一批都执行了 wait + rescan：
  - `218/217` -> `198/197`
  - `198/197` -> `178/177`
  - `178/177` -> `158/157`
  - `158/157` -> `118/117`
  - `118/117` -> `78/77`
  - `78/77` -> `38/37`
  - `38/37` -> `1/0`
  - 记法说明：`inventory/candidates`
- 这说明当前云测试库里“可自动修复”的历史 preview/cover 候选已经被真实清空，不再只是脚本 preview 结果好看。
- 本轮关键产物：
  - `artifacts/media-derivative-backfill/cloud/resume-preview-after-retry.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch20-after-retry.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch20-after-retry.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch20-round2.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch20-round2.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch20-round3.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch20-round3.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch40-round4.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch40-round4.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch40-round5.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch40-round5.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch40-round6.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch40-round6.json`
  - `artifacts/media-derivative-backfill/cloud/resume-apply-batch37-round7.json`
  - `artifacts/media-derivative-backfill/cloud/resume-post-batch37-round7.json`
- 尾部定向复核也已做完：
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote --skip-failed-hours 0 --only-target-ids 22968e91-49c1-4ae4-8b61-05f4a74a5aad`
  - 结果：`Found media derivative candidates: 1 (inventory=1, skippedRecentFailures=0)`
  - 产物：`artifacts/media-derivative-backfill/cloud/known-missing-file-preview.json`
- 当前结论：
  - 云端历史派生资源回补已经收敛到单一人工阻塞样本
  - 当前仅剩 `videoId=22968e91-49c1-4ae4-8b61-05f4a74a5aad` 这条 `local_fs` 源文件缺失问题；只要不补回这个历史源文件，自动 backfill 无法为它生成 preview/cover
- 下次先做什么：
  1. 如果能拿到这条历史视频的源文件，就单独回补它
  2. 如果短期拿不到，就把它正式列入人工异常清单，并把 `T6` 主线切回下一项优化

### 2026-05-24 T6 cloud derivative backfill fully cleared

- 前一条“单一阻塞样本”也已被真正清掉，不再停留在待人工状态：
  - 通过远端数据库复核，`videoId=22968e91-49c1-4ae4-8b61-05f4a74a5aad` 绑定的历史源资产实际是
    - `storage_provider=local_fs`
    - `object_key=video/8dadbeba-c666-4959-96c5-b625f50233be/014-dance-test.mp4`
  - 本地仓库已确认存在同源文件：
    - `apps/web/public/prefill-videos/014-dance-test.mp4`
    - `tmp/media/video/8dadbeba-c666-4959-96c5-b625f50233be/014-dance-test.mp4`
  - 已把它补到云机共享 media 目录：
    - `/opt/dramatv-community-server/shared/media/video/8dadbeba-c666-4959-96c5-b625f50233be/014-dance-test.mp4`
  - 补档后定向 apply + wait 复核：
    - `artifacts/media-derivative-backfill/cloud/known-missing-file-apply-after-restore.json`
    - `artifacts/media-derivative-backfill/cloud/known-missing-file-post-wait.json`
    - 结果：`inventory=0, skippedRecentFailures=0`
- 同轮还顺手清掉了最后 1 条“修复前失败残留”样本：
  - `promptId=5f99cf79-273f-4886-893c-8796349d62df`
  - 该源视频经 `ffprobe` 复核为标准 `2160x3840 / h264 / yuv420p / aac`，失败时间发生在偶数尺寸修复上线前，属于旧失败记录被 `skipFailedHours` 暂时跳过
  - 修复后定向重试已成功：
    - `artifacts/media-derivative-backfill/cloud/new-failed-target-apply-after-fix.json`
    - `artifacts/media-derivative-backfill/cloud/new-failed-target-post-wait.json`
- 最终总览复核：
  - `node scripts/backfill-media-derivative-tasks.mjs --target remote --skip-failed-hours 24`
  - 产物：`artifacts/media-derivative-backfill/cloud/final-remote-preview-after-all-retries.json`
  - 结果：`Found media derivative candidates: 0 (inventory=0, skippedRecentFailures=0)`
- 当前结论：
  - 云测试库历史 preview/cover backfill 已真实清空
  - `T6` 这一轮云端派生资源补齐不再有已知残留库存
- 工具侧注意事项：
  - `backfill-media-derivative-tasks.mjs --target remote` 当前固定占用本地 tunnel 端口 `15432`
  - 同一时刻并行跑两条 remote scan/apply 会互相打断，表现为 `server closed the connection unexpectedly`
  - 后续 remote backfill / remote preview 统一串行执行，不要并发

### 2026-05-24 T6-5 and T6-6 cloud verification completed

- 已补上这一轮媒体优化里最后缺失的“云端专项复检”，不再只停留在“代码已上云 + 本地测试通过”。
- `T6-5 资源去重` 云端实证：
  - 使用 `creator-a / dramatv-local-dev` 在公网环境对同一张小图做了两次真实附件上传，文件名分别为 `t6-dedup-a.jpg` 与 `t6-dedup-b.jpg`
  - 两次接口返回的 `assetId` 不同，但第二次直接复用了第一次的 `mediaPath`
  - 远端数据库复核：
    - `assetId=a1c8a2e8-5cf7-4b4e-a5c1-557fafc2f388`
    - `assetId=bcd4b74f-2ce1-47bb-82cc-c06ef0ee825a`
    - 两行 `storage_provider=oss`
    - 两行 `bucket_name=dz-ailab-community`
    - 两行 `asset_role=attachment`
    - 两行 `checksum=33d582016f86b2da05bb4c17e6a2ce72b30a910cd32f8a873418a8f64b032fe5`
    - 两行共享同一 `object_key=community/test/image/attachment/a1c8a2e8-5cf7-4b4e-a5c1-557fafc2f388/t6-dedup-a.jpg`
  - 结论：云端正式上传链路已真实命中 checksum 去重复用，而不是只在本地测试库成立
- `T6-6 代理层保护与观测` 云端实证：
  - 对真实 `cover` 资源做 `HEAD`：`Cache-Control=public, max-age=86400`，带 `ETag / Last-Modified / Accept-Ranges=bytes`
  - 对真实 `source` 视频做 `HEAD`：`Cache-Control=public, max-age=3600`，带 `ETag / Last-Modified / Accept-Ranges=bytes`
  - 条件请求复核：两者都返回 `304`
  - `Range: bytes=0-1023` 复核：视频源返回 `206`，并带 `Content-Range`
  - 并发保护复核：对同一大视频源并发发起 `40` 个挂起 `GET`，结果为 `24 x 200 + 16 x 503`
    - `503` 返回体为 `{"code":"MEDIA_PROXY_BUSY","message":"media proxy busy",...}`
  - 结论：云端当前运行态已真实具备角色化缓存头、条件缓存、Range 与 `MEDIA_PROXY_BUSY` 限并发保护
- 验收产物：
  - `artifacts/runtime-readiness/test/t6-cloud-upload-media-verification-20260524.json`
  - `artifacts/media-derivative-backfill/cloud/final-remote-preview-after-all-retries.json`
- 台账同步：
  - 已把本轮后端发布与验证结果追加到 `ops/releases/test-env-release-ledger.md`
  - 当前对应发布口径：`web=20260523-122542 (unchanged)`，`backend=20260524-140356`

### 2026-05-24 cloud hover-play source fallback synced to web release

- 这轮新增的云端问题不是后端 `preview` 回填失败，而是云前端 release 还停留在旧逻辑。
- 现场排查结论已经闭环：
  - 云接口 `GET http://8.141.20.130/api/prompts?modality=video&limit=20` 已真实返回多条 `previewUrl=null + sourceUrl=/media/.../video.mp4` 的视频提示词。
  - 本地前端当前代码已经具备回退逻辑：`apps/web/src/lib/media-playback.ts` 会在 `previewUrl` 缺失时，对 `video prompt` 回退到 `sourceUrl`。
  - 但云前端之前的当前 release 仍是 `20260523-122542 / commit=9f78d8c`，而这次回退逻辑只存在于本地工作区变更中，尚未进入云端 web release，所以表现为“有 preview 的能悬浮播，没 preview 的不能播”。
- 已完成云前端同步：
  - 执行 `scripts/deploy-test-web.ps1`
  - 新 release：`/opt/dramatv-community-web/releases/20260524-154158`
  - release label：`hover-play-source-fallback-sync-2026-05-24`
- 云端真实验收已通过：
  - `apps/web` 本地 `typecheck` 通过
  - `apps/web` 本地 `next build` 通过
  - 云端 readiness：`artifacts/runtime-readiness/test/web-deploy-20260524-154158-summary.json` -> `11 passed / 0 failed`
  - Playwright 登录公网 `creator-b / 123456` 后，在 `/featured?filter=video_prompt` 复核：
    - 有 preview 的卡片会插入 `<video src="/media/.../preview/...mp4">`
    - 无 preview 的卡片 `promptId=bf961639-430d-4c13-a924-7a39b73abd0d` 悬浮后会插入 `<video src="http://8.141.20.130/media/community/test/video/source/224ea701-0f2b-44b9-8c0e-f73829b3053b/video.mp4">`
    - 网络层已看到真实 `206 Partial Content` 的 source 请求，说明云端“source 兜底悬浮播放”已生效
- 当前结论：
  - 云端“没经过 preview 处理的资源不能悬浮播放”这一问题根因已确认并修复。
  - 后续若再次出现同类现象，先查三层：
    1. API 是否返回 `sourceUrl`
    2. `resolveCardVideoPlaybackUrl(...)` 是否在目标前端 release 中
    3. 云前端当前 release 是否晚于本地修复批次
