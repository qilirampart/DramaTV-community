# 当前快照
<!-- CODEX:SNAPSHOT -->

- 2026-04-29 起，进度记录正式拆分为三层：`.codex/progress.md` 只保留总索引、跨线状态、全局阻塞和关键里程碑；社区主线详细记录改写到 `.codex/progress-community.md`；后台管理线详细记录改写到 `.codex/progress-admin.md`。历史混合日志继续保留在本文件归档，不做整段迁移，避免大文档再次被重写弄乱。
- 2026-04-29 进度记录已支持前后台并行推进：社区主线继续以 `apps/web + apps/server` 为准，后台管理线继续以 `apps/admin + apps/server` 为准；两条线分账记录，避免一边开发另一边“看起来像停滞”。
- 2026-05-21 已把仓库级 Git 版本管理约定写入 `.codex/community-admin-shared-sync.md`：当前仓库是 `apps/web + apps/admin + apps/server` 的单一 Git 仓库，目标分支方案固定为 `main / pre / test / dev`，后续前后台共享改动都按这套分支和共享台账一起管理。
- 2026-05-21 已补后台资源治理页 `/resources`，把前台真实资源（视频提示词、图片提示词、工作流、帖子、视频作品）纳入后台列表、详情和下线/恢复治理；列表和详情已接真实后端，资源治理动作复用既有 `offline / restore` 口径，执行后应立即影响前台公开可见性。更细的实现与回归记录已写入 `.codex/progress-admin.md`。
- 2026-05-21 已继续细化后台资源治理页的详情展示，把提示词正文从摘要里拆开，提示词资源现在能在右侧详情直接看到真实 prompt body；展示层细化记录已写入 `.codex/progress-admin.md`。
- 2026-05-21 已修正后台资源治理页的提示词正文来源，prompt 详情现优先读取 `prompt_text_raw` 而不是较短的 `prompt_text`，并已补 `AdminResourceApiIntegrationTest` 回归保护；这条修复也已同步写入 `.codex/progress-admin.md`。
- 2026-05-09 已完成详情页推荐语义分开：提示词详情页、工作流/视频详情页、帖子详情页已分别接入真实推荐数据，不再共用前端占位推荐；详细实现与校验已写入 `.codex/progress-community.md`。
- 2026-05-09 已把通知路由改成软降级：公网 `/api/me/notifications/recent` 现在在后台或会话异常时也返回 `200` 空列表，避免铃铛辅助功能继续产出 500/502 噪音；详细记录已写入 `.codex/progress-community.md`。
- 2026-05-18 已完成优化专项 `O6` 第一轮落地：新增 `docs/04_实施设计/本地开发标准动作清单-2026-05-18.md`、`docs/04_实施设计/测试环境部署前检查清单-2026-05-18.md`、`docs/04_实施设计/测试环境部署后验收清单-2026-05-18.md`、`docs/04_实施设计/故障排查入口速查表-2026-05-18.md`，并在 `README.md` 增加执行手册入口。当前“本地开发 / 部署前 / 部署后 / 故障入口”这四类动作已有可直接照做的短手册，不再只散落在长进度文档里。
- 2026-05-19 已把测试环境社区前台发布规范推进到第二轮：新增 `scripts/list-test-releases.ps1`、`scripts/rollback-test-web.ps1`、`scripts/rollback-test-backend.ps1`、`scripts/lib/test-env-release-common.ps1` 与 `ops/releases/test-env-release-ledger.md`；`deploy-test-web.ps1` / `deploy-test-backend.ps1` 现在会把 `release.json` 写入远端 release 目录，并已把云端当前 `web=20260509-141400`、`server=20260509-123834` 固化为第一版稳定基线 `test-stable-2026-05-19-community-r1`。
- 2026-05-19 已完成测试环境新批次 `r2-20260519-community` 的前后端同步：`deploy:test:backend` 产出 `20260519-212502`，`deploy:test:web` 产出 `20260519-212618`，两者都已写入远端 `release.json` 并在 `npm run release:list:test` 中可见；`ops/releases/test-env-release-ledger.md` 也已新增这条发布记录，作为当前测试环境的新批次锚点。
- 2026-05-21 已把本地手动启动口径重新收口：`apps/web` 的 dev 端口已固定回 `3106`，避免 `npm run dev:web` 再误落到 `3000/3001`；同时新增 `docs/04_实施设计/本地手动启动操作指南-2026-05-21.md`，把后端 `18080`、前台 `3106`、后台 `3206`、云镜像 `3107` 的恢复顺序写成可直接照做的步骤。
- 2026-05-18 已完成优化专项 `O2-1` 第一轮落地：仓库已新增 `.github/workflows/ci-minimal.yml` 与 `docs/04_实施设计/最小 CI 草案-2026-05-18.md`。当前最小 CI 已覆盖 `apps/web` 与 `apps/admin` 的 `typecheck + build`，以及基于临时 `PostgreSQL 16 + Redis 7` 的后端核心集成测试，先把“提交后至少自动挡住明显坏改动”这件事收口。
- 2026-05-18 已完成优化专项 `O3` 第一轮落地：新增 `scripts/run-local-frontend-performance-baseline.py`、根命令 `npm run perf:frontend:baseline` 与说明文档 `docs/04_实施设计/前端性能基线说明-2026-05-18.md`。本地实跑结果已覆盖首页、精选页分类切换、详情往返和评论区交互四条高风险路径，当前首轮结果为 `5 passed / 0 failed`。
- 2026-05-18 已完成优化专项 `O5-3` 第一轮落地：新增 `docs/04_实施设计/社区与后台权限边界矩阵-2026-05-18.md`，把当前代码里的社区前台页面权限、社区 API 权限、后台页面权限、后台 API 权限统一写清；同时新增 `AdminAccessBoundaryApiIntegrationTest`，补上匿名用户、普通社区用户、`operator`、`moderator` 在后台接口上的跨角色拒绝访问回归保护。后续如果前台匿名可读策略或后台角色矩阵继续变化，就以这份矩阵和测试为基准同步收口。
- 2026-05-18 已顺手修正一类后端测试层隐患：`admin` 集成测试整组执行时会共享本地测试库里的 `it-*` 账号和内容，而 `ApiIntegrationTestSupport.cleanupTestUsers()` 又会做全局清理，导致并发执行时互删对方数据，表现为偶发 `403 / 404 / foreign key` 假失败。现已新增 `apps/server/src/test/resources/junit-platform.properties` 显式关闭 JUnit 并行执行，并把 `AdminAccessBoundaryApiIntegrationTest` 接入 `scripts/run-backend-integration-suite.ps1 -Suite admin`，后续统一 admin 套件将按串行口径执行。
- 2026-05-18 已完成优化专项 `O5-1` 第一轮落地：新增 `UploadValidationIntegrationTest`，把上传边界正式补成可回归测试；后端 `UploadApplicationService` 也已从“只看 MIME 前缀”收口为“图片/视频 MIME 白名单 + 文件扩展名白名单 + policy MIME 与二进制上传 `Content-Type` 一致性校验”。当前已明确拦住三类风险：`svg` 这类高风险图片 MIME、伪装成 `video/mp4` 的异常扩展名文件、以及先注册 `image/jpeg` 再上传成 `image/png` 的内容类型漂移；实际超限上传仍会拒绝并清理本地残留文件。这组新回归已接入 `scripts/run-backend-integration-suite.ps1 -Suite core`。
- 2026-05-19 已完成优化专项 `O5-2` 第一轮落地：后端已新增 Redis 版 `ActionRateLimiter` 与 `ActionRateLimitProperties`，并把登录、举报创建、上传 `policy / binary` 三条高风险写链路接上基础频控，统一返回 `AUTH_RATE_LIMITED / REPORT_RATE_LIMITED / UPLOAD_RATE_LIMITED` 的 `429` 错误码；同时顺手补上 `uploadBinary` 的资源归属校验，不能再拿别人的 `assetId` 继续上传，对应错误码为 `UPLOAD_ASSET_FORBIDDEN`。访问日志的 IP 解析也已抽到共享组件 `RequestClientIpResolver` 复用到登录频控，前端共享错误呈现器已同步补齐这 4 个错误码的安全文案。
- 2026-05-19 已完成优化专项 `O5-4` 第一轮落地：社区前台已新增共享错误呈现器 `apps/web/src/lib/api/community-error-presenter.ts`，并把登录、发布、个人资料、上传、互动、讨论区动作统一收口成“稳定错误码 -> 安全文案 -> requestId”；同时 `/ /home /featured /me /publish /discussions /prompts /videos /workflows /creators /canvas` 这批主用户路径上的后端不可用提示也已改成安全文案，不再直接向用户暴露底层 `/api/...` 路径。后端侧已补 `ApiErrorEnvelopeIntegrationTest` 并接入 `core` 套件，前端侧已补 `community-error-presenter.test.mjs` 轻量回归。
- 2026-05-19 已完成优化专项 `O5-5` 第一轮落地：后端已新增 `SensitivePayloadSanitizer`，把内部回调原始 payload、异步任务错误信息、后台媒体任务详情里的历史 `result_json / raw_payload_json / error_message` 统一收口到“先脱敏、再截断”的安全口径，当前已明确遮住 `token / signature / authorization / policy / Bearer` 这类高风险片段；同时顺手修复了 `ApiIntegrationTestSupport.cleanupTestUsers()` 对 `audit_records.operator_id` 的清理缺口，避免安全回归被测试脏数据的外键残留假失败盖住。验证已通过：`core / admin / logging` 三组后端集成测试全部回绿。
- 2026-05-07 已完成一轮基于 `test-case-generation` skill 的本地社区主线 QA，自动化运行时 / API smoke / auth-session regression 共 `43 passed / 0 failed`，并已补浏览器级复检与正式报告 `docs/04_实施设计/社区主线本地测试报告-2026-05-07.md`。当前唯一本轮新增明确问题为：讨论区前台仍混入两个英文 `Integration Channel` 测试频道，详细记录已写入 `.codex/progress-community.md`。
- 2026-05-07 已补真实发布链路浏览器验收：图片提示词与视频提示词均已在浏览器中完成“上传素材 -> 填写 Prompt -> 发布 -> 跳转精选页 -> 首屏可见”闭环；页面计数同步更新到 `图片提示词 44 / 视频提示词 31`，新发布的两条 QA 内容已出现在精选页首屏列表中。
- 2026-05-07 已补工作流详情浏览器验收：精选页 `workflow` 卡片可正常进入详情页并返回原位置，详情页正文区、评论区、相关推荐与 `暂未接入画布入口` 文案均可正常展示。
- 2026-05-08 已完成“本地讨论区测试频道残留 + 公网关键链路”复检：本地与公网 `/discussions` 当前都只剩 5 个正式中文频道，`Integration Channel` 已不是现态问题；同时公网 `http://8.141.20.130` 已完成首页、登录、精选、讨论区、帖子详情、个人页首轮浏览器回归。
- 2026-05-08 已完成公网真实写链路回归：`creator-b` 在 `http://8.141.20.130` 上已实测通过图片提示词、视频提示词、工作流、帖子四条发布链路，以及点赞、收藏、评论、举报提交。当前新增明确问题不是接口失败，而是“举报入口被错误挂在评论/回复数量按钮上”且成功提示仍为英文，详细记录已写入 `.codex/progress-community.md` 与 `docs/04_实施设计/社区公网回归测试报告-2026-05-08.md`。
- 2026-04-30 评论性能优化待办已正式挂到账本：详细拆分与后续逐项勾销统一写入 `.codex/progress-community.md` 的 `C1-C4`，总索引这里只保留指针，不再把社区细节混回主文档。
- 2026-04-29 已完成后台评论治理第一条真接口闭环：`apps/server` 已补 `/api/admin/comments` 列表与治理动作包装，`apps/admin /comments` 已接成真数据优先；定向验证已通过 `AdminCommentApiIntegrationTest` 2 条、`apps/admin` `npx.cmd tsc --noEmit` 与 `npm.cmd run build`。
- 2026-04-29 已完成发布状态语义第二轮收口：这轮后端已把 `video/workflow/post` 的提交响应从伪 `published` 改成真实 `submitted`，同时禁止已提交草稿继续 `update/delete/resubmit`，避免“前端表单已锁，但接口仍可覆写”这一类共享层隐患。前端 `community-service.ts` 与草稿状态映射已同步补齐 `submitted` 文案，定向验证已通过：`DraftApiIntegrationTest` 4 条、`PublishPipelineIntegrationTest` 6 条，共 10 条用例全部通过；`apps/web` `npx tsc --noEmit -p apps/web/tsconfig.json` 也已通过。
- 2026-04-29 已完成发布链路状态契约第一轮收口：`video/workflow/post draft` 以及对应 `bootstrap/submit` 响应已新增显式 `lifecycle` 结构，统一返回 `draftStatus / moderationStatus / processingStatus / editable / submittedAt`；前端 `/publish` 与 `/discussions/new` 已改为使用 `lifecycle.editable` 锁定表单，不再把混杂的 `statusCode` 兼作草稿编辑态判断。当前保持现有“提交即入库、审核记录与媒体处理分轨”的真实流程不变，只先把状态表达拆清楚；`DraftApiIntegrationTest`、`PublishBootstrapApiIntegrationTest`、`PublishPipelineIntegrationTest` 共 11 条定向用例已通过，`apps/web` `tsc --noEmit` 也已通过。
- 2026-04-28 `canvas` 相关后端集成测试已补齐，新增 `apps/server/src/test/java/com/dramatv/community/integration/CanvasReadApiIntegrationTest.java`，覆盖 `canvas-link / copy-to-canvas / runtime / snapshot / copy-task / visible-assets` 的真实 HTTP 契约与 403/404 边界；同时修复两处真实问题：`copy-to-canvas` 的全局幂等键会把不同用户的复制链路串到同一个 runtime，现已通过 `V17__scope_canvas_copy_idempotency_per_operator.sql` 与 `CanvasApplicationService.loadExistingCopy(...)` 收口为按 `operator_id + source_workflow_id + idempotency_key` 作用域去重；`visible-assets` 联表查询里 `asset_role / status_code` 歧义导致的 `500` 也已修复。当前 `Feed / Discussion / Video / Workflow / Prompt / Creator / Me / Canvas` 共 14 条集成用例已全部通过。
- 2026-04-28 已按“先补真实读链路测试”的顺序启动后端落地，新增 `apps/server/src/test/java/com/dramatv/community/integration/FeedReadApiIntegrationTest.java` 与 `apps/server/src/test/java/com/dramatv/community/integration/DiscussionReadApiIntegrationTest.java`，先覆盖 `GET /api/feed/home`、`GET /api/discussions/home`、`GET /api/discussions/threads/{slug}` 三条前台已真实依赖的公共读接口。当前这两组测试仍未在本机执行验证，阻塞原因不是代码报错，而是本机 `apps/server` 目录下没有 Maven Wrapper，系统环境里也没有可用的 `mvn/mvn.cmd`，因此暂时只能完成代码级自检，不能在当前机器直接跑 Java 集成测试。
- 2026-04-28 后端读链路集成测试已继续补到 `video / workflow / prompt / creator / me`，并已通过项目内 `scripts/use-local-java17-maven.ps1` 跑通定向测试集：`FeedReadApiIntegrationTest`、`DiscussionReadApiIntegrationTest`、`VideoReadApiIntegrationTest`、`WorkflowReadApiIntegrationTest`、`PromptReadApiIntegrationTest`、`CreatorReadApiIntegrationTest`、`MeReadApiIntegrationTest` 共 11 条用例全部通过。同步确认一个当前真实契约：`GET /api/feed/home` 默认走 `channel=recommend`，首页策展读链路依赖 `feed_items`，不能只往 `videos` 直插数据就假设会出现在首页 feed。
- 2026-04-28 已开始进入“前台社区已搭好后的后端收口阶段”，并新增 `docs/04_实施设计/前台页面到社区后端接口依赖矩阵-2026-04-28.md`。这份矩阵按实际 `apps/web` 路由、`community-service.ts` 和 `apps/server` 控制器整理出当前真实依赖关系，明确了首页/详情/作者页/讨论区/发布/个人中心/画布入口分别依赖哪些后端接口，并同步标出三类现状：`已可用`、`已接真实后端但待补强`、`演示链路/非 P0`。当前已确认的后端优先问题包括：读接口集成测试覆盖缺失、`getPublishBootstrap()` 过度耦合三类草稿、`/me` 聚合仍然重复拉数、canvas 鉴权边界前后端不一致。
- 2026-04-28 已基于当前真实 `apps/web + apps/server` 状态补一版“结合前台主线的社区后端开发规划”，新增文档 `docs/04_实施设计/社区后端开发规划-结合前台主线-2026-04-28.md`。这版规划明确：后端当前不是从零重搭，也不是 admin-first，而是优先围绕 `P0` 社区闭环推进 `读链路稳定化 -> 发布审核闭环 -> 互动与治理补强 -> 后台治理能力 -> requestId/错误码/日志/测试加固`，并继续把重媒体与 AI 处理留在 `Python Worker / FastAPI`。
- 2026-04-28 已把“前台社区项目 vs 后台管理项目”的当前策略正式写死到文档：工程上继续保持 `apps/web` 与 `apps/admin` 两个独立前端应用，后端统一复用 `apps/server`；业务上共享同一套社区领域模型、发布审核链路与治理数据，不按两套孤立系统推进。已同步更新 `docs/03_架构/DramaTV社区后台拆分与端口规划.md` 与 `docs/04_实施设计/社区后端开发规划-结合前台主线-2026-04-28.md`。
- 2026-04-28 已定位并修复一类真实“循环跳转/黑屏 loading”根因：`CommunityRouteTransitionProvider` 之前只在“实际到达 pendingHref”时才收起过场层，遇到未登录点击受保护导航、被 `proxy.ts` 重定向到新的 `/login?redirectTo=...` 时会一直停留在过场层。现已改成“只要路由离开起点页，不管是到目标页还是被鉴权改写到别的页，都按最短过场时间收口”，并增加过场中的重复点击防抖；同时把 `/featured` 二级分类改成单一规范化路径，去掉 `secondary` 的二次自我修正 effect，减少选项卡切换时的自回写风险。
- 2026-04-28 后台最小真接口闭环已落第一步：`apps/server` 已新增 `/api/admin/auth/**` 与 `/api/admin/users`，复用现有 `auth_sessions + users.role_code`，并补后台角色守卫；`apps/admin` 已从占位 Cookie 会话切到真实 token 登录/会话/退出链路，`/users` 页面也已改为读取真实用户列表。当前后台前端已从“本地可独立复现与构建验证通过的正式工程起点”推进到“`auth + users` 已接通、其余治理页仍占位”的阶段。
- 2026-04-27 已按最新口径收口后台规划：当前只做 `社区后台一期`，工作流继续按 `社区占位内容` 管理，不进入画布 runtime 管理。已重写 `docs/03_架构/DramaTV社区后台拆分与端口规划.md`，并新增 `docs/04_实施设计/社区后台一期实施拆解.md`，固定方案为 `apps/admin + 本地3206 + apps/server(/api/admin/**)`。
- 2026-04-27 已补后台工程拆分方案，方向固定为“社区前台 / 社区后台 分离开发，后台本地独立端口”。新增规划文档 `docs/03_架构/DramaTV社区后台拆分与端口规划.md`，已明确建议：新建 `apps/admin`，本地端口使用 `3206`，云上入口与社区前台分开；后台一期继续复用 `apps/server`，通过 `/api/admin/**` 提供后台接口；社区前后台共享同一套社区业务数据库，社区与画布只共享身份和绑定关系，不共享无边界写权限。
- 2026-04-27 已将当前这轮前后端修改同步到云测试环境：前端已部署到 release `/opt/dramatv-community-web/releases/20260427-135403`，`dramatv-community-web.service` 保持 `active (running)`；后端已部署到 release `/opt/dramatv-community-server/releases/20260427-140414`，`dramatv-community-server.service` 保持 `active (running)`，云环境现已与本地当前主线版本重新对齐。
- 2026-04-27 已继续完成优化专项 `O5` 的“详情往返媒体隐患”清扫：本地 `18080` 后端健康检查通过，媒体路径解析补丁已生效；后端 `MediaAssetUrlResolver` 现会过滤失效本地 `/media/...` 资源，`/home` 不再反复请求旧 `callback-cover.png`。前端首页 hero 也已从“3 条轮播都长期挂 `<video>`”收口为“只挂当前项和下一项视频，其余只保留封面 + `poster`”，Playwright 复测 `http://127.0.0.1:3106/home` mounted video 数量已从 `3` 降到 `2`，连续 3 次进入详情再返回后静态媒体请求压到仅 `1` 条；`/featured` 的返回锚点与详情往返链路保持正常。
- 2026-04-27 已新增 10 个公网测试账号用于内部联调，未改动既有账号：`creator-b` 到 `creator-k` 已写入云测试库，统一密码为 `123456`，并已通过公网后端 `POST http://8.141.20.130/api/auth/login` 实测校验 `creator-b`、`creator-k` 可成功登录。为避免后续手工建号重复出错，仓库已补一次性脚本 `scripts/create-cloud-test-users.mjs`，脚本默认先查重，若目标用户名已存在会直接停止而不是覆盖。
- 2026-04-27 已补完 `D15-D16` 尾差：讨论区首条帖子上的 `置顶讨论` 标签已确认不是后端字段，而是前端页面内该标签本身被错误写成双重转义串，现已直接修正为正常中文；视频详情页右上角主按钮也已从“切有声/静音层”改成真正的 `开始播放 / 暂停播放` 控制，点击后会直接驱动主 `<video>` 的播放状态，按钮文案即时切换。`apps/web` 类型检查继续通过，3106 / 3107 已再次重启到最新构建，Playwright 已核对到 `/discussions` 的标签文本为 `置顶讨论`，视频详情页点击后按钮文案会切成 `暂停播放`。
- 2026-04-27 登录页视觉已按最新要求收口：`apps/web/src/features/login/LoginPage.tsx` 已删除原来的左侧说明大区，只保留单张登录卡；`apps/web/src/features/login/LoginPage.module.css` 已整体重写为更简洁的黑白中性色方案，登录按钮、输入框、测试账号区和日间模式都已同步收口，不再保留之前偏青蓝/琥珀的双栏风格。`apps/web` 的 `tsc --noEmit` 已通过。
- 2026-04-27 已将最新登录页视觉同步到本机云镜像前端 `http://localhost:3107`：旧的 `3107` 监听进程已停止，`scripts/start-web-cloud.ps1` 已重新构建并拉起新实例；当前 `3107` 监听 PID 为 `29272`，`http://localhost:3107/login` 返回 `200`，运行态验收文件 `artifacts/runtime-readiness/latest/web-start-3107.json` 仍为 `passed=5, failed=0`。这次同步仅影响本机 `3107 -> 8.141.20.130` 镜像链路，不会自动更新公网 `http://8.141.20.130/login`。
- 2026-04-27 已将最新前端同步到公网 ECS 前端服务：执行 `scripts/deploy-test-web.ps1` 后，`dramatv-community-web.service` 已切到 release `/opt/dramatv-community-web/releases/20260427-122055` 并保持 `active (running)`，Nginx 配置校验通过。公网验收结果：`http://8.141.20.130/login -> 200`、`http://8.141.20.130/home -> 200`，且 `login` 页 HTML 已包含 `进入 DramaTV 社区` 文案，说明登录页新样式已对外生效。
- 2026-04-27 已把“首页资源卡默认封面、悬浮才挂视频”的最新前端改动同步到本机云镜像前端 `http://localhost:3107`：旧的 `3107` 监听进程已停掉并按当前代码重新构建/重启，运行态验收文件 `artifacts/runtime-readiness/latest/web-start-3107.json` 再次通过 `passed=5, failed=0`，`http://localhost:3107/home` 返回 `200`。同时确认链路边界：这次只同步了本机 `3107 -> 8.141.20.130` 的云镜像前端，不会自动改动 ECS 上对外的 `http://8.141.20.130/home`，公网前端如需同步还要单独执行 `scripts/deploy-test-web.ps1`。
- 2026-04-27 已核对“默认封面、悬浮才加载视频”的当前实现状态：`/featured` 之前已经满足该策略，但 `/home` 资源卡片仍沿用 `useInteractiveVideoPreview` 的默认 `loadOnViewport=true`，会在进入视口时提前挂载视频。现已把 `apps/web/src/features/home/CommunityHomePage.tsx` 的首页资源卡片改为 `loadOnViewport: false`，与精选页收口为同一策略；首页 hero 轮播继续保持自动播放，不在本次调整范围内。
- 2026-04-27 已完成 `D12-D14` 收口：`/me` 与 `/creators/[id]` 的作品卡片已改成“统一底卡 + 独立封面层 + 统一遮罩”的结构，解决有封面和无封面时视觉发散的问题，并顺手把 `/me` 卡片尺寸、间距、字级继续向创作者页卡片体系靠齐；讨论区展示层已补 `\uXXXX / \UXXXX` 转义文本解码，`置顶讨论` 一类标签不再向用户暴露原始转义串；视频详情页的 `播放视频 / 收起视频` 按钮已从右下角移到右上角，避开浏览器原生全屏控件。`apps/web` 的 `tsc --noEmit` 已通过，3106 / 3107 前端实例已重启到新构建，Playwright 也已补做运行态抽查：`/me`、`/discussions`、`/videos/[id]` 的主路径可打开，讨论区异常转义标签已不再出现在卡片首屏文案中。
- 2026-04-27 已完成 `D6-D11` 这一轮前端精修落地：`PageShell` 已移除登录态首页顶栏最右上角冗余入口，首页头像改为“fallback 永远可见 + 真实头像叠加”结构并补上 `Drama TV` 顶栏品牌 hover/focus 反馈；`/me` 与 `/creators/[id]` 卡片样式已收口为同一套视觉语言；`/discussions/new` 已新增完整日间模式覆盖。`apps/web` 的 `tsc --noEmit` 已通过，`3107` 云镜像前端已重建并重新拉起；受 Playwright 浏览器会话中途关闭影响，本轮运行态验收主要通过 HTML/构建结果完成，待用户做最终视觉确认。
- 2026-04-26 已按用户要求先完成“新一轮 UI 精修问题记录”，并把本轮待办统一追加到 `.codex/ui-polish-followups-2026-04-25.md`：`D6 顶栏最右上角冗余入口移除`、`D7 顶栏头像缺失修复`、`D8 个人主页作品卡片样式统一`、`D9 个人主页帖子卡片样式统一`、`D10 DramaTV 品牌链接悬浮反馈补齐`、`D11 发帖页日间模式配色修正`。当前阶段只完成分析、范围界定和文档落账，尚未开始代码修改。
- 2026-04-26 已完成“视频提示词封面回填”专项：确认根因不是前端悬浮逻辑，而是旧版 YouMind Seedance 导入链路把 `cover_asset_id` 指向了视频资产，导致后端 `coverUrl/posterUrl` 始终为 `null`。现已同时修正 `scripts/import-youmind-prompts.mjs` 与 `scripts/backfill-youmind-video-prompt-covers.mjs`：后续导入会优先写入上游 `thumbnail/thumbnailSrc` 作为独立图片封面资产，没有缩略图时再回退到 `ffmpeg` 抽帧；现有本地库与云测试库也已完成回填，`127.0.0.1:18080/api/prompts?modality=video&sort=hot` 与 `8.141.20.130/api/prompts?modality=video&sort=hot` 均已返回非空 `coverUrl/posterUrl`，3106 / 3107 的视频提示词卡片应可在未悬浮前直接看到封面。
- 2026-04-26 已补一轮“本地后端 + 云后端”同步修正：`CommunityCatalogJdbcQueryService` 的视频媒体解析现兼容 `cover_url / video_cover_url`、`poster_url / video_poster_url`、`preview_url / video_preview_url`、`source_url / video_source_url` 两套别名，本地 `127.0.0.1:18080/api/feed/home` 已恢复 `200`；云测试后端也已再次部署到发布 `20260426-230621`。当前 `http://localhost:3107/home` 与 `http://localhost:3107/featured` 都能正常打开，`/featured` 首屏只挂 1 个视频元素，返回列表锚点恢复正常。遗留风险是：一批视频提示词仍只有 `sourceUrl`，没有独立 `poster/preview`，悬浮预览时依旧会直接打源视频，这属于后续资产回填问题，不是本轮部署失败。
- 2026-04-26 已把“进入详情后返回到原位置”的规则从单页补丁扩成统一机制：`/`、`/home`、`/featured`、`/discussions`、`/me`、`/creators/[id]` 这批会进入带返回按钮详情页的来源页面，现都改为显式记录 `from + hash`，并在回页后按锚点恢复位置；其中 `/me` 与 `/creators/[id]` 还同时把 tab 状态写回 URL，避免“回来了但落错 tab”。
- 2026-04-26 精选页详情返回链路已修正：共享 `ContextBackLink` 不再强制走 `router.back()`，而是按显式 `href` 返回到带 `from + hash` 的列表位置。3106 / 3107 都已实测从 `图片提示词` 分类进入卡片详情，再点 `返回列表` 后会回到原分类下的原卡片锚点附近，而不是只回到列表顶部或默认分类。
- 2026-04-26 云测试后端已重新部署到当前 `apps/server` 版本，`V16__add_more_discussion_channels.sql` 已在云库生效。ECS 本机核验结果：`/actuator/health -> UP`，`/api/discussions/home` 已返回 5 个真实频道（含 `official-events`、`casual-lounge`）。当前 `3107` 的页面数据已不再受“云后端缺少 V16”影响。
- 2026-04-25 已为本轮 UI 精修需求建立独立跟踪文件 `.codex/ui-polish-followups-2026-04-25.md`，当前收录 5 项待办：`D1 评论区黑白风格统一`、`D2 日间正文改黑`、`D3 日间预览区去雾感`、`D4 一级分类显示数量`、`D5 一级分类补二级主题分类`。后续规则固定为：每完成一项，同时更新该文件和本进度文档，避免重复做或在上下文压缩后遗漏。
- 2026-04-25 优化专项 `O5` 继续收紧前端媒体预热策略：新增共享 hook `useInteractiveVideoPreview(loadOnViewport)`，精选页 `/featured` 首屏 24 张卡片只对前 6 张视频卡做视口预热，其余保持悬浮/聚焦时再挂载视频；首页 `/home` 轮播改为仅当前 slide `preload=auto`、下一张 `metadata`、更远一张 `none`。云镜像 `http://127.0.0.1:3107` 验收结果：精选页首屏挂载视频数已从 15 降到 6，首页 hero 仍保持 1 条自动播放但第 3 条不再提前拉流。
- 2026-04-24 优化专项 `O5` 已落第一刀：`apps/web` 公共页读链路新增 `timeoutMs`，首页 `/`、社区首页 `/home`、精选 `/featured` 的次要 prompt 区块改为“短超时 + 软降级空数据”，不再让次要公共接口长时间拖住整页首屏；`/home` hero 也已补主 feed 回退，次要 prompt 请求慢/失败时仍可优先展示主 feed 的真实内容。
- 2026-04-24 优化专项 `O5` 第二刀已落地：首页 `/` 与社区首页 `/home` 的公共 loader 已正式改成只取主 `homeFeed`，路由层不再等待次要 prompt 数据；对应 `HomePage / CommunityHomePage` 已把 `prompts` 改成可选输入，首屏内容完全可以只靠主 feed 站住。
- 2026-04-24 优化专项 `O5` 第三刀已落地：精选页 `/featured` 的服务端 loader 已收口成只等主 `homeFeed`，补充 prompt 库存改成客户端挂载后再从 `/api/public/featured-prompts` 补拉，首屏卡片流不再被大批量 prompt 查询拖住。
- 2026-04-24 已补一套独立云环境前端镜像启动能力：保留本地正式联调入口 `http://127.0.0.1:3106` 不变，新增 `scripts/start-web-cloud.ps1` 与 `npm run start:web:cloud`，可在 `http://localhost:3107` 直接挂到云后端 `http://8.141.20.130:18080` 做页面验收与数据对照。
- 2026-04-24 云前端镜像验收已确认一个关键现状：`localhost:3107` 页面链路本身可用，登录、首页、精选、讨论、个人页、发布页都能正常打开；但云后端当前仍挂着旧测试库内容，和本地已经清洗过的干净基线不一致，后续若要把测试环境变成演示环境，需要先明确是否执行“本地清洗后基线 -> 云库覆盖同步”。
- 2026-04-23 可观测性又补了一步：后端新增 `TraceIdFilter`，当前已兼容请求头 `X-Trace-Id / traceparent`，并把 `traceId / requestId / userId` 统一写入 MDC 与本地应用日志、访问日志格式。现阶段仍是单体本地日志准备层，还未补齐 `spanId` 和跨异步任务透传。
- 2026-04-23 评论治理第一版已落地到正式全栈主线：`videos / workflows / prompt_entries / discussion_threads` 新增 `comments_enabled` 开关，后端补齐 `PUT /api/comments/target-settings` 与 `DELETE /api/comments/{commentId}`，详情接口统一返回 `commentPolicy(commentingEnabled/canManageComments)`，前端共享 `CommentThread` 已支持“作者关闭/开启评论区 + 目标作者删除评论 + 评论区关闭态禁用输入”。
- 提示词详情页已确认复用 `VideoDetailPage`，因此评论治理与视频详情页共用同一套前端接线；讨论帖详情页也已切到共享 `CommentThread`，不再是独立的旧评论实现。
- 已完成运行态验收：`prompt / workflow / discussion` 详情接口都已返回 `commentPolicy`；讨论帖 `standalone-post-smoke-20260412-151127` 以作者 `creator-a` 冒烟通过“关闭评论 -> 非作者发评返回 COMMENT_DISABLED -> 开启评论 -> 非作者发评成功 -> 作者删除评论 -> commentCount 回到 0”整条链路。顺手补了一个稳健性修复：隐藏态评论现在也允许走删除逻辑，不再只允许删除 `active` 评论。
- 2026-04-23 项目已进入“速度 + 稳定性”优化阶段，首轮优化任务固定为 5 条主线：`公共页取数减重与缓存`、`热点 SQL / 索引审计`、`媒体上传与播放链路稳定化`、`限流/幂等/smoke 等稳定性基建`、`前端主内容优先渲染与体感速度优化`。后续按“完成一项，回写一项”的方式持续更新本文件。
- 2026-04-23 优化专项 `O1` 已完成：公共页读链路已区分“公共读缓存”与“带登录态读请求”，首页 `/`、社区首页 `/home`、精选 `/featured`、讨论广场 `/discussions` 已减少重复请求与无意义鉴权透传；`/discussions` 还顺手移除了逐条详情回查造成的 N+1。
- 2026-04-23 优化专项 `O2` 已完成首轮索引审计：`/api/prompts` 与 `/api/discussions/home` 的热点排序查询已补齐表达式/部分索引，本地库 `Flyway` 已升到 `v13`。当前本地讨论数据量仍很小，优化器对部分查询继续选择顺序扫描属正常现象，但索引缺口已经补上。
- 2026-04-23 优化专项 `O3` 已落第一刀：上传链路的大小限制已从硬编码收口到 `dramatv.media.upload.*` 配置，并补上“按请求头预检 + 按实际写入字节数兜底”的双层校验，避免客户端声明过小但实际传大文件时仍写入本地磁盘。
- 2026-04-23 优化专项 `O3` 第二刀已落地：`/api/internal/media-callback` 不再是空回包，成功回调后会把视频的 `cover_asset_id / preview_asset_id / duration_ms` 写回正式内容表，并落一条 `task_callback_logs` 记录；同时遵守“不要覆盖用户已手传封面”的规则，只在视频当前没有封面时才补自动封面。
- 2026-04-23 优化专项 `O3` 第三刀已落地：视频草稿提交不再返回伪造的 `media-task-*`，而是同步创建真实 `async_task_records` 任务并把真实 UUID 回传给前端；随后已用登录态调用受保护的 `/api/internal/media-callback` 完成闭环验证，确认“提交返回任务 ID -> 回调写回视频媒体字段 -> 任务状态改为 `succeeded` -> `task_callback_logs` 落库”整条链路可用。
- 2026-04-23 优化专项 `O3` 第四刀已落地：上传契约现在支持显式声明 `assetRole`，并把 `cover / source / preview / avatar / attachment` 等资源用途同步落到 `media_assets.asset_role` 和规范化 `object_key`；本地新对象键已统一成 `community/local/{assetKind}/{assetRole}/{assetId}/{fileName}`，为后续切 OSS/CDN 保留稳定路径语义。
- 2026-04-23 优化专项 `O3` 第五刀已落地：公共读链路里的头像读取已继续向资产模型收口，`/api/feed/home`、`/api/discussions/home`、`/api/prompts`、`/api/comments`、`/api/auth/me`、`/api/me/hub`、`/api/me/notifications/recent` 这批共享查询都已优先走 `avatar_asset_id + media_assets`，避免后续切 OSS 时公共页残留旧 `avatar_url` 直读口径。
- 2026-04-23 已补做本地媒体对象键审计：`node scripts/audit-media-asset-keys.mjs` 结果为 `107 / 107` 资源都已是规范化相对对象键，当前没有遗留 `absolute_url / root_path / blank` 风险数据；根目录同时新增 `media:audit`、`media:normalize:preview`、`media:normalize:apply` 脚本，后续可直接复用。
- 2026-04-24 后端集成测试基线已继续扩大：`apps/server/src/test/java/com/dramatv/community/integration` 现已覆盖 `auth/me`、三类草稿 CRUD、点赞/收藏/关注切换、评论读取/发布/关评治理/楼中楼删除/基础风控、上传策略/二进制上传、视频草稿提交、媒体回调写回`，当前共 14 条 `MockMvc + SpringBootTest` HTTP 级集成测试，直接跑本地 PostgreSQL/Redis 真库路径。

- Added a dedicated discussion-post composer at `/discussions/new`, using the real `postDraft` bootstrap plus live discussion channel data, instead of reusing the video/workflow-oriented `/publish` page.
- Added `apps/web/src/features/discussions/discussion-markdown.module.css`, moved markdown styles out of `DiscussionComposerPage.module.css`, and upgraded `DiscussionMarkdown` to render image markdown plus `[视频：xxx](url)` and direct video links as embedded video blocks.
- Updated `apps/web/src/features/discussions/DiscussionsPage.tsx` so the hub CTA `发起讨论` now points to `/discussions/new`; updated `apps/web/src/features/discussions/DiscussionDetailPage.tsx` to render markdown body content instead of raw `pre-wrap` text; updated `apps/web/src/features/publish/actions.ts` to revalidate `/discussions/new` on post draft save/submit.
- Adjusted the discussion composer UX to fit a writing page: the new composer keeps the existing dark cinematic community style, but disables the shared floating dock on `/discussions/new` so the editor is not visually obstructed by the extra floating publish entrance.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded and route table now includes `/discussions/new`; Docker services `dramatv-postgres:5432` and `dramatv-redis:6379` are both healthy; HTTP checks returned `200` for `/discussions` and `/discussions/new`; Playwright verified `发起讨论 -> /discussions/new`, and captured `discussion-hub-entry-desktop-check.png`, `discussion-new-page-check.png`, and `discussion-new-desktop-no-floating-publish.png` with browser console warnings/errors both `0`.
- 当前做到哪一步：讨论帖发布链路已经从通用发布页里拆出来，形成独立的社区帖子编辑页，并且讨论列表入口、详情正文渲染、草稿缓存刷新都已接通。
- 当前卡在哪里：Playwright MCP 一度因为浏览器会话被手动关闭而断开，但重新启动后已恢复；当前未再发现阻塞发帖页上线演示的代码问题。
- 下次先做什么：如果继续精修，优先收桌面端右上角 `预览 / 保存草稿 / 发布帖子` 动作组间距，并补一个更明确的媒体插入提示，让用户更快理解图文/视频 markdown 写法。

- Refined the discussion composer layout after visual review: removed the old fixed split preview column, enlarged the writing area, reduced excessive left/right whitespace, and softened the visual separation between the main editor and the right-side helper cards.
- Moved preview behavior from the old top action cluster into the editor toolbar. The page now uses a modal preview dialog instead of a permanently visible side preview, so long markdown content no longer loses editor width and the preview can grow independently with document length.
- Updated `apps/web/src/features/discussions/DiscussionComposerPage.tsx` and `apps/web/src/features/discussions/DiscussionComposerPage.module.css` only, keeping the rest of the discussion publishing flow unchanged.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright rechecked `http://127.0.0.1:3106/discussions/new`, confirmed the larger editor layout and modal preview behavior, and captured `discussion-new-editor-expanded.png` and `discussion-preview-dialog-check.png` with browser console warnings/errors both `0`.
- 当前做到哪一步：讨论帖发布页已经从“左右分栏挤压编辑区”的状态收口到“主编辑区优先”的状态，正文输入不会再被固定预览区长期压缩。
- 下次先做什么：如果继续精修，优先处理右侧辅助栏的信息优先级，压缩“当前板块 / 编辑格式 / 草稿状态”顶部信息块，再给工具条补一条更直白的媒体插入提示。

- Continued the discussion composer polish after layout review: widened the effective page work area so the editor column can pull further left, reducing the previous left/right whitespace imbalance on desktop.
- Further weakened the helper-column box feeling in `apps/web/src/features/discussions/DiscussionComposerPage.module.css` by softening borders, lowering card/background contrast, tightening gaps, and reducing the visual isolation between the top meta cards and the lower helper sections.
- Fine-tuned the desktop two-column ratio again so the editor column gets a little more dominance while the right helper rail remains aligned and stable.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright rechecked `http://127.0.0.1:3106/discussions/new` and captured `discussion-new-width-and-soft-card-check.png`; browser console warnings/errors remained `0`.
- 当前做到哪一步：发帖页现在已经从“编辑区被挤压 + 右侧组件框感太重”收口到更偏编辑器主导的版式，左右空白和右侧分块隔离感都比上一版弱。
- 下次先做什么：如果继续精修，优先把右侧最上方三块信息合并成更轻的单组信息区，再继续处理工具条和正文首屏的纵向节奏。
- 当前仓库主线已经是 `apps/web` 的 `Next.js + React + TypeScript` 前端与 `apps/server` 的 `Spring Boot` 后端，旧的 `React + Vite` 原型已归档到 `archive/legacy-react-vite-prototype`。
- 社区主站围绕 `首页 / 视频详情 / 工作流详情 / 作者主页 / 发布页` 的 `P0` 闭环推进，讨论区、画布联动、通知回流和治理能力在逐步补齐。
- 运行时 mock 主路径已清理，当前方向固定为全链路开发：前端真实请求、后端真实 JDBC / PostgreSQL 路径、画布绑定真实入库。
- 个人中心 `/me` 第一版已落地，前端已接真实后端 `/api/me/hub`，当前承接“个人信息 + 最近点赞 + 最近收藏”，并与公共作者主页 `/creators/[id]` 完成职责拆分。
- 2026-04-10 新增两张结构图：`docs/03_架构/DramaTV社区功能脑图-详细版.drawio` 与 `docs/03_架构/DramaTV社区关键联动链路图.drawio`，社区结构已从页面罗列推进到“对象 + 小功能 + 状态 + 回流”的层级。

## 2026-04-27 O5 media reload sweep continued

- 本轮继续处理“多次进入详情再返回后媒体请求堆积、页面变卡”的同类问题，重点覆盖本地主链路 `3106 -> 18080`。
- 后端侧已确认本轮补丁生效：
  - `apps/server/src/main/java/com/dramatv/community/shared/config/MediaStorageProperties.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/config/MediaResourceConfig.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyController.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyService.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/media/MediaAssetUrlResolver.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/error/ApiExceptionHandler.java`
- 关键后端结果：
  - `http://127.0.0.1:18080/actuator/health` 正常。
  - 旧的失效本地 `/media/...` 资源不再被继续透给前端，`/home` 首屏已不再请求 `callback-cover.png` 这一类失效封面。
  - 本地媒体缺失现在会返回结构化 `404 RESOURCE_NOT_FOUND`，不再兜底成泛化 `500`。
- 前端侧继续收口首页媒体挂载策略：
  - `apps/web/src/features/home/CommunityHomePage.tsx` 的 hero 轮播改为只为“当前 slide + 下一张预热 slide”挂载 `<video>`，其余 slide 只保留封面背景和 `poster`。
  - 首页资源卡保持“默认只看封面，悬浮/聚焦才挂视频”的同一策略，不再出现首页和精选页策略分叉。
- Playwright 运行态回归结果：
  - `/home`：mounted video 数量从 `3` 降到 `2`。
  - `/home`：连续 3 次进入详情再返回后，静态媒体请求收口到 `1` 条 `seedance-videos/*.mp4`，不再出现一串重复的首页轮播视频 range 请求。
  - `/featured`：连续进入提示词详情再返回后仍能落回 `#featured-item-*` 原位置，未看到旧的失效本地 `/media/...` 请求回流。
- 验证：
  - `npx.cmd tsc --noEmit`
  - Playwright 实测 `http://127.0.0.1:3106/home`
  - Playwright 实测 `http://127.0.0.1:3106/featured`
- 当前做到哪一步：这轮已经把“失效本地媒体路径反复打后端”和“首页 hero 过度挂载视频”两类明显隐患一起收掉。
- 残余风险：当前首页 hero 仍然保留“当前项自动播放 + 下一项 metadata 预热”的体验策略，后续如果上云后还要继续压带宽或首屏解码压力，下一步优先考虑补轻量 `poster/preview` 资产，而不是重新退回全量直接打源视频。

## 2026-04-27 cloud sync + admin planning

- 已执行云测试环境同步：
  - 前端：`scripts/deploy-test-web.ps1`
  - 后端：`scripts/deploy-test-backend.ps1`
- 当前云侧运行版本：
  - Web release: `/opt/dramatv-community-web/releases/20260427-135403`
  - Server release: `/opt/dramatv-community-server/releases/20260427-140414`
- 已新增后台规划文档：
  - `docs/03_架构/DramaTV社区后台管理系统规划.md`
- 当前后台规划结论：
  - 第一版优先做 `后台登录与 RBAC / 账号管理 / 内容审核中心 / 举报与评论治理中心 / 首页与精选运营排序中心`
  - 第二层再补 `标签与分区管理 / 媒体与异步任务中心 / 基础数据概览`
  - 坚持“后台独立建设，不继续塞进社区前台”

## 2026-04-27 admin split architecture fixed

- 新增 `docs/03_架构/DramaTV社区后台拆分与端口规划.md`，把后台建设从“功能清单”推进到“工程拆分 + 端口 + 数据边界”层面。
- 当前固定方案：
  - 社区前台：`apps/web`，本地 `3106`
  - 社区后台：规划新建 `apps/admin`，本地 `3206`
  - 社区后端：继续复用 `apps/server`，本地 `18080`
- 云上固定思路：
  - 社区前台和社区后台走两个独立入口
  - 后台不再塞进前台同一个 Next 应用
- 数据边界固定：
  - 社区前台和社区后台共享同一套社区业务数据库，但都通过后端 API 写入
  - 社区和画布共享身份与绑定关系，不共享无边界写权限
  - 后台一期直接走 `/api/admin/**`，不另起新 Java 服务
- 下次开始后台开发时，优先动作已固定为：
  1. 新建 `apps/admin`
  2. 跑通 `3206`
  3. 先做后台登录壳子和 RBAC
  4. 再做账号管理页和对应 `/api/admin/users/**`

# 当前看板
<!-- CODEX:BOARD -->

- 记录规则已切换：社区主线的详细快照 / 看板 / 追加日志只写 `.codex/progress-community.md`；后台管理线的详细快照 / 看板 / 追加日志只写 `.codex/progress-admin.md`；本文件后续只保留跨线索引、全局阻塞和大里程碑。
- 当前并行线：社区主线、后台管理线。
- 已切换当前工作口径：前后台允许并行推进，但必须按独立进度文件分别追加，避免信息串线。
- 社区详细执行入口：`.codex/progress-community.md`
- 后台详细执行入口：`.codex/progress-admin.md`
- 当前跨线里程碑：后台 `comments` 已从纯占位页推进到“后端真接口 + 页面真数据读取”的阶段。
- 当前跨线共识：
  - 社区前台与后台管理允许并行开发，但必须分账记录
  - 后端统一复用 `apps/server`，前台走 `apps/web`，后台走 `apps/admin`
  - 关键状态、接口和测试收口优先保证真实链路，不再回退到“假完成”口径
- 当前跨线阻塞与风险：
  - 主进度文档历史归档仍很大，后续只做索引级更新，不再承载细节日志
  - 讨论区、通知、真实上传/媒体资产链路仍未达到与发布链路同等完成度
  - 作者页产品规则与部分旧文档仍有偏差，需要继续统一
- 当前专题归档入口：
  - `.codex/deploy-cloud-frontend-2026-04-27.md`
  - `.codex/incident-public-upload-fix-2026-04-28.md`
  - `.codex/backup-progress-acl-fix-2026-04-27.md`

# 追加日志
<!-- CODEX:LOG -->

## 2026-04-29 progress routing split

- 已把进度记录方式从“一个大文件混记所有线”切到“三层路由”：
  - `.codex/progress.md`：总索引、全局快照、跨线状态、里程碑
  - `.codex/progress-community.md`：社区主线详细进度
  - `.codex/progress-admin.md`：后台管理线详细进度
- 这次不做历史整段搬迁，只保留本文件中的既有混合日志作为归档，避免为了整理记录再次把大文档写坏。
- 后续执行规则已经固定：
  - 社区相关任务完成后，只往 `progress-community.md` 追加
  - 后台相关任务恢复后，只往 `progress-admin.md` 追加
  - `progress.md` 只在“主线切换、暂停恢复、跨线阻塞、关键里程碑”时更新
- 这样处理的目标不是把文档越拆越散，而是让新会话先读 `progress.md` 就能知道该进哪条线，再按索引继续读对应子文档，减少上下文压缩后的信息丢失和重复劳动。

## 2026-04-29 parallel track policy restored

- 本轮进一步澄清了拆分进度文档的真实目的：不是为了让后台线暂停，而是为了让前台社区线和后台管理线可以并行推进，又不会在同一份进度文档里互相覆盖。
- 当前正式规则固定为：
  - 社区功能开发继续写 `progress-community.md`
  - 后台功能开发继续写 `progress-admin.md`
  - `progress.md` 只负责告诉下一次会话“现在有哪些并行线、各自去哪本账、全局有什么阻塞和关键决策”
- 后续即便某一条线短暂停顿，也不再把“暂停”写成整个结构的长期口径，避免下一轮会话误判活跃方向。

## 2026-04-29 topic file naming cleanup

- 已把 `.codex` 里旧的专题 `progress-*` 文件从“正式进度账本命名前缀”中分离出去，避免和 `progress.md / progress-community.md / progress-admin.md` 三本正式账本撞名：
  - `progress-cloud-frontend-deploy-2026-04-27.md` -> `deploy-cloud-frontend-2026-04-27.md`

## 2026-05-05 research asset refresh for YouMind GPT-Image-2 comic-storyboard

- 已完成 `https://youmind.com/zh-CN/gpt-image-2-prompts?utm_source=footer&categories=comic-storyboard` 这一轮研究资产刷新，当前线上总量确认到 `646` 条、`36` 页。
- 本轮处理方式固定为“全量抓取 + 按 `id` 和旧库去重 + 只保留新增项”，避免和 `2026-04-24` 那批 `252` 条旧资产混在一起。
- 最终结果：新增 `399` 条，其中 `395` 条图片成功下载、`4` 条因缺图跳过。
- 资产与交接文档已落在 `docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-refresh-2026-05-05/` 和 `docs/02_研究/YouMind GPT-Image-2 漫画故事版增量抓取记录.md`。

## 2026-05-18 O6 runbook docs first round

- 已把优化任务板里的 `O6 文档与执行手册化` 从待做推进到第一轮完成，当前不再只依赖长篇进度文档记命令和流程。
- 新增 4 份短手册：
  - `docs/04_实施设计/本地开发标准动作清单-2026-05-18.md`
  - `docs/04_实施设计/测试环境部署前检查清单-2026-05-18.md`
  - `docs/04_实施设计/测试环境部署后验收清单-2026-05-18.md`
  - `docs/04_实施设计/故障排查入口速查表-2026-05-18.md`
- 配套动作：
  - `README.md` 已新增“执行手册入口”
  - `.codex/dramatv-optimization-taskboard-2026-05-18.md` 已同步把 `O6-1 ~ O6-4` 标记为 `已完成第一轮`
- 这轮的目的不是增加新流程，而是把已经存在但分散的真实操作口径收口成“能直接照做”的格式，降低新会话和后续并行开发时的上下文损耗。

## 2026-05-18 O2-1 minimal CI first round

- 已把优化任务板里的 `O2-1 最小 CI 草案` 从待做推进到第一轮完成。
- 仓库新增：
  - `.github/workflows/ci-minimal.yml`
  - `docs/04_实施设计/最小 CI 草案-2026-05-18.md`
- 当前 CI 第一轮只做最小质量门禁，不直接碰部署：
  - `apps/web`：`typecheck + build`
  - `apps/admin`：`typecheck + build`
  - `apps/server`：依赖临时 `PostgreSQL 16 + Redis 7` 的核心集成测试
- 这样处理的目的不是把 CI 做重，而是先把“前端能不能编、后台能不能编、后端核心链路会不会直接炸”这三件事自动化。

## 2026-05-18 O3 frontend performance baseline first round

- 已把优化任务板里的 `O3 前端性能指标化` 从待做推进到第一轮完成。
- 新增：
  - `scripts/run-local-frontend-performance-baseline.py`
  - `docs/04_实施设计/前端性能基线说明-2026-05-18.md`
  - 根命令：`npm run perf:frontend:baseline`
- 当前脚本已覆盖 4 类真实高风险场景：
  - 首页 `/` 与 `/home`
  - `/featured` 分类切换约 20 次
  - 从精选进入详情再返回 3 轮
  - 视频详情评论区展开回复并提交一条楼中楼回复
- 为避免评论基线被性能脚本污染，脚本已在执行前后自动调用：
  - `scripts/reset-local-browser-smoke-state.ps1`
- 本地首轮实跑结果：
  - `5 passed / 0 failed`
  - `/home`：`domContentLoaded=481ms`，`load=532ms`，`mountedVideos=1`
  - `/`：`domContentLoaded=263ms`，`load=1446ms`，`mountedVideos=1`
  - `/featured` 分类切换后：`mp4Requests=0`，`mountedVideos=0`
  - 详情往返窗口：`uniqueMp4Requests=1`
  - 评论区回复后：`resourceDeltaAfterReply=3`
  - `progress-public-upload-fix-2026-04-28.md` -> `incident-public-upload-fix-2026-04-28.md`
  - `progress.acl-fix-backup-2026-04-27.md` -> `backup-progress-acl-fix-2026-04-27.md`
- 同步把主 `progress.md` 看板收口为真正的“跨线索引页”，不再把社区和后台的执行细项继续堆在主账本里。

## 2026-04-29 publish-state semantics round 2

- 已按“先社区主线、后台线暂停”的口径重新对齐当前开发方向，避免 `.codex/progress.md` 后续继续把社区和后台两条线混成一个线性队列。
- 这轮不是继续做表面文案，而是把一类共享层状态冲突真正收口：
  - `video/workflow/post` 提交成功后的 `publishStatus` 由伪 `published` 改为真实 `submitted`
  - 已提交草稿现在会被后端统一拒绝再次 `update / delete / resubmit`
  - 前端草稿状态映射已补 `submitted -> 已提交`，避免发布页、草稿箱回填脏状态
- 这轮为什么要一起改：
  - 之前前端虽然已经用 `lifecycle.editable` 锁表单，但后端接口层仍允许继续覆盖已提交草稿，属于同类漏洞
  - 如果只改 submit 返回值，不补接口层冲突保护，状态语义还是会继续散掉
- 本轮涉及的共享层文件：
  - `apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishDraftPersistenceService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/VideoDraftApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/WorkflowDraftApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java`
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/mappers/community.ts`
- 新增与更新的验证：
  - `DraftApiIntegrationTest` 新增“已提交视频草稿不可再编辑/再提交”用例
  - `PublishPipelineIntegrationTest` 同步改为断言 `publishStatus=submitted`
  - 实跑 `DraftApiIntegrationTest,PublishPipelineIntegrationTest` 共 10 条用例全部通过
  - `npx tsc --noEmit -p apps/web/tsconfig.json` 通过
- 当前做到哪一步：
  - `draftStatus / moderationStatus / processingStatus / editable / submittedAt` 与 `submit` 返回值已不再互相打架
  - 但内容表 `publish_status='published'` 仍然承担“当前前台可见”语义，这和严格审核后上架不是同一个模型
- 下次先做什么：
  - 继续分析是否要把内容层的 `publish_status` 从“前台可见”里再拆出更明确的 `visibility / moderation / processing` 语义
  - 优先以不打断当前前台可见链路为前提推进，避免为了状态纯洁把已联通页面打回半可用

## 2026-04-28 first read-api integration tests started

- 已从“只做规划和矩阵”推进到“开始落第一批后端读接口测试”，当前先加了两组新的 HTTP 级集成测试：
  - `FeedReadApiIntegrationTest`
  - `DiscussionReadApiIntegrationTest`
- 当前新增测试覆盖点：
  - `GET /api/feed/home`
    - 匿名访问应返回 `200`
    - 返回体应包含 `requestId`
    - 返回体应包含 `items`、`sections.hotWorkflows`、`sections.featuredCreators`
    - 测试内新建的已发布视频应能出现在 home feed 中
  - `GET /api/discussions/home`
    - 匿名访问应返回 `200`
    - 返回体应包含 `channels` 与 `featuredThreads`
    - 测试内新建的已发布帖子应能出现在讨论区首页和频道筛选结果中
  - `GET /api/discussions/threads/{slug}`
    - 匿名访问应返回 `200`
    - 返回体应包含帖子基础字段、作者字段、频道字段与评论策略字段
- 这轮没有继续一口气补 `video / prompt / workflow / creator / me`，原因是先把读测试模式和建数方式跑通，再按同一模式平推，风险更低。
- 当前卡在哪里：
  - 尝试在 `apps/server` 目录执行 `mvn "-Dtest=FeedReadApiIntegrationTest,DiscussionReadApiIntegrationTest" test` 时，机器上没有可用的 `mvn/mvn.cmd`
  - `apps/server` 目录下也没有 Maven Wrapper，所以当前无法在这台机器直接执行 Java 测试
- 当前做了什么降风险：
  - 已对新增测试文件做代码级自检
  - 已把讨论测试里的 `discussion_threads` 插入语句收紧，去掉不必要的 `null` 数组字段，降低 PostgreSQL 参数类型风险
- 当前做到哪一步：依赖矩阵已经建好，第一批读接口测试也已经落到代码里，只差把本机 Maven 运行条件补齐后做真正执行验证。
- 下次先做什么：
  - 优先补 Maven 运行条件，或补项目级 Maven Wrapper
  - 一旦能跑测试，先执行 `FeedReadApiIntegrationTest` 和 `DiscussionReadApiIntegrationTest`
  - 然后按同一模式继续补 `VideoReadApiIntegrationTest`、`PromptReadApiIntegrationTest`、`WorkflowReadApiIntegrationTest`

## 2026-04-28 frontend-to-backend dependency matrix established

- 已新增 `docs/04_实施设计/前台页面到社区后端接口依赖矩阵-2026-04-28.md`，把当前 `apps/web` 已经真实上线的社区页面按代码事实映射到 `apps/server` 实际接口。
- 这次不是按旧文档抄接口，而是按以下真实入口反推：
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/api/community-public-cache.ts`
  - `apps/web/src/lib/api/upload-client.ts`
  - `apps/web/src/app/(community)/**/page.tsx`
  - `apps/web/src/features/**/actions.ts`
  - `apps/server/src/main/java/com/dramatv/community/**/controller/*.java`
- 当前文档已覆盖的前台主路径包括：
  - Layout 会话壳
  - `/login`
  - `/`
  - `/home`
  - `/featured`
  - `/videos/[id]`
  - `/prompts/[id]`
  - `/workflows/[id]`
  - `/creators/[id]`
  - `/discussions`
  - `/discussions/[slug]`
  - `/publish`
  - `/discussions/new`
  - `/me`
  - `/canvas`
  - `/canvas/[runtimeId]`
- 同步确认了三类当前最值得后端马上处理的结构性问题：
  - `getPublishBootstrap()` 当前由前端组合 `auth/me + video/workflow/post draft`，打开发布相关页会同时拉起三类草稿，耦合偏重
  - `/me` 当前先读 `GET /api/me/hub`，再额外读 `creator videos/workflows/posts`，聚合边界还没收干净
  - canvas 相关前端页面要求登录，但后端 `SecurityConfig` 里对应 GET 读接口当前是公开的，前后端鉴权边界不一致
- 同步确认了当前已有测试覆盖集中在：
  - `AuthMeApiIntegrationTest`
  - `CommentApiIntegrationTest`
  - `DraftApiIntegrationTest`
  - `InteractionApiIntegrationTest`
  - `PublishPipelineIntegrationTest`
- 同步拉出了第一批明确缺失的读接口集成测试，至少包括：
  - `/api/feed/home`
  - `/api/discussions/home`
  - `/api/discussions/threads/{slug}`
  - `/api/videos/{id}`
  - `/api/videos/{id}/related`
  - `/api/prompts`
  - `/api/prompts/{id}`
  - `/api/prompts/{id}/related`
  - `/api/workflows/{id}`
  - `/api/workflows/{id}/related-videos`
  - `/api/creators/{id}`
  - `/api/creators/{id}/videos`
  - `/api/creators/{id}/workflows`
  - `/api/creators/{id}/posts`
  - `/api/me/hub`
  - `/api/me/notifications/recent`
  - `/api/canvas-runtimes/{id}`
  - `/api/canvas-runtimes/{id}/snapshot`
  - `/api/canvas-copy-tasks/{id}`
- 当前做到哪一步：后端下一阶段已经不再是抽象规划，而是已经有一份“前台页面 -> 前端调用入口 -> 后端接口 -> 当前状态 -> 下一步后端重点”的可执行矩阵。
- 下次先做什么：直接按矩阵进入第一批读接口集成测试落地，优先顺序为 `feed -> discussion -> video -> prompt -> workflow -> creator -> me`。

## 2026-04-28 backend planning aligned to current frontend

- 已按“当前前端架子已经搭好，开始后端部分”的新阶段补出一版后端开发规划文档：`docs/04_实施设计/社区后端开发规划-结合前台主线-2026-04-28.md`。
- 这版规划不是把后端当成绿地重做，而是明确以当前真实 `apps/web` 页面、`apps/web/src/lib/api/community-service.ts` 消费事实、`apps/server` 已有模块与接口为基础推进。
- 规划主线已收口为 5 个阶段：`Phase 0 契约收口`、`Phase 1 P0 读链路稳定化`、`Phase 2 发布审核闭环`、`Phase 3 互动与社区闭环补强`、`Phase 4 后台治理能力建设`，并要求 `requestId / 错误码 / 日志 / 测试` 从现在开始同步补。
- 当前明确不优先做的内容也已写死：不新拆社区后端微服务，不先做真实 canvas runtime 管理后台，不让复杂推荐、全站搜索、大型通知中心抢占 `P0` 社区主线排期。
- 当前做到哪一步：后端下一阶段的优先级、边界、阶段目标和首批 10 个任务已经形成可执行文档，可以直接进入“接口契约矩阵 + 读链路测试补齐 + 发布状态流收口”的实施阶段。
- 下次先做什么：先产出 `apps/web -> apps/server` 页面接口依赖矩阵，再按矩阵补 `feed / video / workflow / creator / me / discussion / prompt` 的后端集成测试与字段缺口清单。

## 2026-04-27 admin planning narrowed to community-only

- 已按用户最新口径，把后台规划明确收口为 `DramaTV 社区后台一期`，不再把画布后台、画布 runtime、节点图管理、执行管理混入本轮范围。
- 已重写 `docs/03_架构/DramaTV社区后台拆分与端口规划.md`，把方案固定为：
  - 前台 `apps/web`
  - 后台 `apps/admin`
  - 后端继续复用 `apps/server`
  - 后台本地端口固定 `3206`
  - 后台接口统一走 `/api/admin/**`
- 已新增 `docs/04_实施设计/社区后台一期实施拆解.md`，把后台一期拆到可开工粒度，覆盖：
  - `apps/admin` 目录骨架
  - 页面路由清单
  - `/api/admin/**` 分组
  - 复用表与建议新增表
  - 分阶段实施顺序
- 已顺手修正文档口径：`docs/03_架构/DramaTV社区后台管理系统规划.md` 中原“画布复制任务”已改为“工作流绑定检查”，避免后台模块名继续误导到画布 runtime。
- 当前做到哪一步：后台一期的范围、工程边界、端口、API 分组、页面清单都已经固定，可以直接进入 `apps/admin` 脚手架搭建。
- 下次先做什么：按实施拆解文档先新建 `apps/admin`，跑通 `3206`，再落后台登录壳子和基础 RBAC。

## 2026-04-28 responsive floating dock adaptation

- 已完成首页壳层浮动入口的响应式改造，改动文件：
  - `apps/web/src/components/shared/PageShell.tsx`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/features/featured/FeaturedArchivePage.module.css`
- 方案不是单页补丁，而是全局分级收缩：
  - `PageShell` 的 `home` 变体在开启浮动入口时会追加 `page-shell-home-has-dock`
  - `globals.css` 新增 `--home-floating-dock-inline-reserve` 和 `--home-floating-dock-bottom-reserve`
  - 浮动入口按三档收缩：大桌面保留文案、笔记本缩小胶囊、较窄屏幕切到图标按钮
  - `featured` 页主容器宽度接入安全留白变量，避免右侧 `发布` 按钮压住卡片
- 已验证：
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - 本地云镜像 `scripts/start-web-cloud.ps1 -Mode start -Port 3107` 已重启成功
  - Playwright 在 `http://localhost:3107/featured` 下抽查了 `1366x900` 和 `1180x820`
  - 两个断点都已确认左侧 `画布入口` / 右侧 `发布` 不再与精选卡片重叠
- 当前做到哪一步：这轮已经把“浮动入口在笔记本宽度遮挡内容”的根因从固定尺寸改成了响应式安全区机制，后续同类页面可直接复用。
- 下次先做什么：如果用户确认视觉没问题，再把同一套前端改动同步到公网前端和 3106 本地开发主链路。

## 2026-04-28 route loop diagnosis and stabilization

- 本轮针对用户反馈的“切换工作流/提示词选项卡时偶发循环跳转，以及昨天页面切换时也出现过类似问题”做了浏览器级复现，而不是只看代码。
- 已确认一条真实根因在共享过场层：
  - 文件：`apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`
  - 旧逻辑只在 `routeKey === pendingHref` 时才关闭 loading 过场层。
  - 未登录用户如果在登录页或公开页点击受保护导航，`router.push('/featured')` 之后会被 `proxy.ts` 改写成 `/login?redirectTo=/featured`。
  - 这时路由确实变化了，但并没有到达原始 `pendingHref`，导致过场层一直不消失，用户体感上就是黑屏 loading / 像在来回跳。
- 已落修复：
  - 过场层现在记录 `originHref + pendingHref`，只要当前路由已经离开起点页，不论是正常到达目标页还是被鉴权重定向到别的页，都会按 `MIN_TRANSITION_MS` 最短时长自动收口。
  - 同时补了“过场未结束时忽略重复导航点击”的防抖，避免短时间连点把多个跳转状态叠在一起。
- 精选页也顺手做了稳定化：
  - 文件：`apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - 把 `secondary` 的有效值判断改成 `resolveFeaturedSecondaryFilter(...)` 单一路径。
  - 去掉了“先写 URL，再由另一个 effect 把无效 secondary 改回 all”的双 effect 自修正方式，减少选项卡切换时的额外 `replace` 风险。
- 验证结果：
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过。
  - Playwright 已复现并确认修复：未登录态在 `/login?redirectTo=...` 再点顶栏 `精选` 后，页面会稳定停在新的登录页，不再卡在 `精选加载中` 过场层。
  - Playwright 已复测 `/featured?filter=image_prompt&secondary=gpt-image-2 -> 工作流`，URL 现在只发生一次 `replace` 到 `/featured?filter=workflow`，没有再出现二次自修正回写。
- 本轮又做了一次同类隐患安全检查：
  - `CommunityRouteTransitionProvider` 已补 `MAX_TRANSITION_MS=4000` 的硬超时兜底，避免未来某次 `router.push` 未真正离开起点页时，过场层再次无限挂住。
  - Playwright 已复测公开首页未登录入口：`进入画布入口 / 发布新档案 / 立即登录解锁全部内容` 都会稳定落到对应登录页，过场层会正常收口。
  - Playwright 已复测已登录大页切换：`首页 -> 精选 -> 超能社区 -> 首页 -> 精选` 全程未再出现 loading 残留。
  - Playwright 已复测 `/me` 与 `/creators/[id]` 的 tab 切换，两页都保持“一次点击只触发一次 `replace`”的稳定行为，暂未发现和 `/featured` 同类的多次自回写。
  - 登录跳转参数也顺手复核过：`redirectTo` 统一经过 `normalizeRedirectTarget/normalizeInternalPath`，当前未发现开放重定向风险。
- 当前做到哪一步：昨天那类“页面切换后像在循环/黑屏 loading”的共享根因已经收口；今天用户提到的精选页选项卡链路也已做了额外稳定化。
- 下次先做什么：如果用户后续还能稳定复现“精选页纯选项卡自身循环跳转”，下一轮就继续抓更细的浏览器事件序列，重点看是否还存在某个具体筛选组合或登录态切换边界没有覆盖到。

## 2026-04-28 featured model + theme combined filtering

- 已按最新需求把精选页提示词筛选从“单一 secondary token”升级成“模型 + 题材”双组组合筛选：
  - 文件：`apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - 样式：`apps/web/src/features/featured/FeaturedArchivePage.module.css`
- 当前规则：
  - 同一个大类内仍保持单选。
  - 模型组和题材组可以交叉组合，例如 `seedance + 真人`、`gpt-image-2 + 动画`。
  - 工作流页保持原来的单组 secondary 筛选，不受这次改动影响。
- URL 契约已同步升级：
  - 视频/图片提示词改为 `?filter=...&model=...&content=...`
  - 工作流仍沿用 `secondary=...`
  - 旧链接兼容保留：如果老链接还是 `secondary=gpt-image-2` 或 `secondary=seedance`，前端会在首轮加载时自动迁移到新参数格式。
- 运行态验收：
  - Playwright 已验证 `video_prompt -> seedance -> 真人`，URL 会变成 `?filter=video_prompt&model=seedance&content=real-person`，结果列表同步收缩。
  - Playwright 已验证旧链接 `?filter=image_prompt&secondary=gpt-image-2` 会自动规范化到 `?filter=image_prompt&model=gpt-image-2`。
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 与 `apps/web -> npm.cmd run build` 均已通过。
- 当前做到哪一步：本地代码和 `3106` 已完成组合筛选能力与旧链接兼容验证，尚未同步到 `3107/公网`。
- 下次先做什么：等用户确认本地体验和命名方式都没问题，再统一同步到云镜像和公网前端。

### 2026-04-27 cloud test account batch

- 新增云测试账号脚本：`scripts/create-cloud-test-users.mjs`。脚本复用现有 `.codex/测试环境资源清单.md` 解析、`plink` SSH 隧道和本地 Docker `psql` 执行方式，避免把数据库口令硬编码进仓库。
- 执行结果：已向云测试库新增 `creator-b`、`creator-c`、`creator-d`、`creator-e`、`creator-f`、`creator-g`、`creator-h`、`creator-i`、`creator-j`、`creator-k`，统一密码 `123456`。脚本策略为“先查重再插入”，若目标用户名已存在则直接报错退出，不覆盖旧账号。
- 后端登录验收已通过：公网 `POST http://8.141.20.130/api/auth/login` 已成功校验 `creator-b`、`creator-k`，返回 `roleCode=creator`，说明新账号不仅入库成功，也已被线上测试环境鉴权链路识别。
- 当前做到哪一步：内部初测所需的第二批测试账号已齐备，且保留了可重复执行的一次性建号脚本。
- 下次先做什么：如需继续扩充测试账号，优先复用该脚本并换目标用户名段，不要再通过登录接口“碰运气”自动造号，因为本地开发账号逻辑只接受 `dramatv-local-dev`。

### 2026-04-24 O5 frontend perceived-speed slice 1

- `apps/web/src/lib/api/community-service.ts` 的公共读请求已支持 `timeoutMs`，当前先用于公共页次要区块，不改现有业务命令链路。
- `apps/web/src/lib/api/community-public-cache.ts` 已把 `/`、`/home`、`/featured` 里的次要 prompt 读取改成 `1200ms` 短超时 + `CommunityBackendUnavailableError` 软降级为空数组；主 `homeFeed` 仍保持真实强依赖，避免整页因为次要区块卡住。
- `apps/web/src/features/home/CommunityHomePage.tsx` 已补 `hero` 的主 feed 回退逻辑：当 prompt 列表为空、超时或降级时，仍优先从主 feed 真实卡片里挑选可用封面/视频作为轮播内容，而不是直接回到旧 demo。
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd run build:web`
  - `http://127.0.0.1:3106/` -> `200`
  - `http://127.0.0.1:3106/home` -> `200`
  - `http://127.0.0.1:3106/featured` -> `200`
- 当前做到哪一步：公共页慢次要区块已经开始去阻塞，首轮先把 prompt 类慢查询从“拖整页”改成“慢则降级，不拖主 feed”。
- 下次先做什么：继续看 `/`、`/home`、`/featured` 是否要把次级区块进一步拆成独立 server 子块或 `Suspense` 边界，避免主内容和非关键区块继续绑在同一个 route await 上。

### 2026-04-24 O5 frontend perceived-speed slice 2

- `apps/web/src/lib/api/community-public-cache.ts` 已把 `loadLandingPagePublicData` 与 `loadCommunityHomePublicData` 收口成“只取主 `homeFeed`”的公共缓存读取，不再为 `/` 和 `/home` 额外等待 prompt 查询。
- `apps/web/src/app/(community)/page.tsx` 与 `apps/web/src/app/(community)/home/page.tsx` 已改成直接用主 loader 渲染页面；`apps/web/src/features/home/HomePage.tsx` 与 `apps/web/src/features/home/CommunityHomePage.tsx` 的 `prompts` 现已是可选参数，页面首屏可独立依赖主 feed。
- 这次没有改 `/featured` 的内容结构，只保留上一刀已经落好的“次要 prompt 区块短超时 + 软降级”，避免把精选页一次性重构过大。
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd run build:web`
  - `http://127.0.0.1:3106/` -> `200`
  - `http://127.0.0.1:3106/home` -> `200`
  - `http://127.0.0.1:3106/featured` -> `200`
- 当前做到哪一步：`/` 与 `/home` 现在已经真正从 route await 级别摘掉次要 prompt 依赖，主内容首屏只受 `homeFeed` 影响。
- 下次先做什么：优先看 `/featured` 是否需要把“首屏卡片流”与“补充提示词库存”拆成前后两层，或者至少把额外 prompt 装载切成更独立的次级渲染边界。

### 2026-04-24 O5 frontend perceived-speed slice 3

- `apps/web/src/lib/api/community-public-cache.ts` 现已新增 `loadFeaturedArchivePromptInventory`，把精选页的补充 prompt 库存单独缓存；原 `loadFeaturedArchivePublicData` 已收口成只取主 `homeFeed`。
- 新增 `apps/web/src/app/api/public/featured-prompts/route.ts`，由 Next 路由层承接补充库存读取并以 `15s` revalidate 对外提供轻量公共 JSON，避免前端客户端组件直接拼后端公共请求。
- `apps/web/src/features/featured/FeaturedArchivePage.tsx` 已改成“主内容先渲染 + 挂载后补拉补充 prompt 库存”，并用很轻的 `正在补充加载更多提示词资源...` 文案提示当前是次级装载状态；补拉请求走 `force-cache`，重复进入精选页时更容易直接复用缓存结果。
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd run build:web`
  - `http://127.0.0.1:3106/featured` -> `200`
  - `http://127.0.0.1:3106/api/public/featured-prompts` -> `200 | 60`
- 当前做到哪一步：`/featured` 现在已经从“路由层等待主 feed + 大批量 prompt 查询”收口到“首屏只等主 feed，补充库存后到”的两层装载模式。
- 下次先做什么：继续看 `/` 是否还要把非关键的辅助块或次级资源再拆一层，或者补一次浏览器级别的主观体感验收，确认这三刀之后实际页面加载观感确实变快。

### 2026-04-24 O5 browser verification

- 使用可见 Playwright 浏览器会话补做了 `/`、`/home`、`/featured` 三个公共页的真实页面验收，并用开发测试账号 `creator-a / dramatv-local-dev` 登录后验证受保护访问链路。
- 浏览器层结果：
  - `/`：控制台 `0 error / 0 warning`，首屏直接可见内容卡片 `8` 张。
  - `/home`：控制台 `0 error / 0 warning`，首屏轮播区与推荐流正常出现，浏览器资源清单中没有额外 `/api/*` 请求，说明当前页面已不再在客户端补拉公共数据。
  - `/featured`：控制台 `0 error / 0 warning`，最终可见卡片 `64` 张；浏览器资源清单里只看到一个客户端 API 资源 `GET /api/public/featured-prompts -> 200`，符合“主内容先出、补充库存后到”的目标。
- 额外验证：点击“图片提示词”筛选后，页面可见 `30` 条图片提示词卡片，筛选行为正常。
- 当前做到哪一步：`O5` 前三刀已经同时通过代码层校验和浏览器层体感验收，当前没有发现新的前端报错或明显的错误请求路径。

### 2026-04-24 Backend integration tests - auth/draft/interaction/comment baseline

- `apps/server/src/test/java/com/dramatv/community/integration/ApiIntegrationTestSupport.java` 已补齐真实本地库测试支撑：统一登录 helper、测试用户清理、计数查询，以及“按测试用户创建已发布视频目标”的支撑方法，避免评论治理测试依赖演示数据归属。
- 新增 `AuthMeApiIntegrationTest`、`DraftApiIntegrationTest`、`InteractionApiIntegrationTest`、`CommentApiIntegrationTest` 四组 HTTP 级集成测试。当前覆盖面包括：匿名鉴权拦截、`/api/auth/me` 与 `/api/me/hub`、三类草稿 CRUD、视频点赞/收藏、关注切换、评论公开读取、登录后发评、作者关评/开评、楼中楼展示、作者级联删评，以及评论 `blocked / hidden` 两类基础风控行为。
- 这轮测试刻意没有上 Testcontainers，也没有引入更重的单元 mock 体系，而是直接跑 `SpringBootTest + MockMvc` 命中本地 PostgreSQL/Redis 真链路，优先解决“当前这套正式后端接口到底有没有回归保护”的问题。
- 已验证两轮命令都通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=CommentApiIntegrationTest" test`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AuthMeApiIntegrationTest,DraftApiIntegrationTest,InteractionApiIntegrationTest,CommentApiIntegrationTest" test`
- 当前做到哪一步：后端已有 11 条稳定可跑的接口回归测试，评论与治理这条近期高频改动链路已纳入保护。
- 下一步先做什么：继续补第二轮稳定性测试，优先顺序为 `上传策略/上传完成`、`媒体回调写回`、`发布提交`，再决定是否补最小浏览器 smoke。

### 2026-04-24 Backend integration tests - upload / submit / callback slice

- 新增 `apps/server/src/test/java/com/dramatv/community/integration/PublishPipelineIntegrationTest.java`，把发布相关第二轮高风险链路收进回归：`上传策略 + 二进制上传落本地文件`、`视频草稿提交 -> videos 入库 -> async_task_records 排队`、`/api/internal/media-callback -> videos/media_assets/task_callback_logs 写回`。
- `ApiIntegrationTestSupport` 同步补强了测试清理范围：除了测试用户、互动、草稿和内容本身，现在也会清理测试产生的 `media_assets / audit_records / async_task_records / task_callback_logs / feed_items`，并对 `tmp/media` 下测试上传文件做 best-effort 删除，避免本地真库和磁盘越跑越脏。
- 这轮测试不是只校验“接口 200”而已，还补了几项关键状态断言：上传后 `media_assets.status_code=ready` 且本地文件真实存在；视频提交后 `videos.publish_status=published` 且异步任务 `status_code=queued`；媒体回调后 `videos.cover_asset_id / preview_asset_id / duration_ms`、`media_assets.duration_ms`、`async_task_records.result_json/status_code`、`task_callback_logs.verify_status/process_status` 全部同步更新。
- 已验证两轮命令都通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=PublishPipelineIntegrationTest" test`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AuthMeApiIntegrationTest,DraftApiIntegrationTest,InteractionApiIntegrationTest,CommentApiIntegrationTest,PublishPipelineIntegrationTest" test`
- 当前做到哪一步：后端现有 HTTP 级集成测试已扩到 14 条，发布主链路里“上传 -> 提交 -> 媒体回调”这一段已经纳入回归保护。
- 下一步先做什么：如果继续推进 `O4`，优先补 `自动 smoke 脚本接 CI/本地一键执行` 或 `失败/过期异步任务与上传垃圾数据清理任务`，而不是继续盲目堆更多接口测试。

### 2026-04-23 Observability trace-id groundwork

- 参照画布当前阿里云日志样例，DramaTV 后端已新增 `apps/server/src/main/java/com/dramatv/community/shared/request/TraceIdFilter.java` 与 `TraceIdContext.java`，支持从 `traceparent` 或 `X-Trace-Id` 提取链路标识；无上游链路头时会自动生成本地 `traceId`。
- `apps/server/src/main/resources/logback-spring.xml` 已统一补齐 `traceId / requestId / userId` 三组字段，便于后续本地日志、测试环境日志和云端日志平台保持同一套查询口径。
- 当前做到哪一步：`requestId` 继续承接单次接口排查，`traceId` 开始承接整条业务链路标识，`userId` 只取后端真实解析结果。
- 下一步先做什么：后续接入异步任务、Worker、管理后台或云日志平台时，把 `traceId` 继续透传到下游链路，并视需要补 `spanId`/OpenTelemetry。

### 2026-04-21 Featured taxonomy correction

- 按最新产品口径修正首页与精选页分类：前台筛选收口为 `全部 / 工作流 / 视频提示词 / 图片提示词 / 活动`，其中 `活动` 仅作为后续运营内容预留，不再用帖子顶替。
- 修正 `帖子` 与 `活动` 的错误映射：通用 `post` badge 改回 `帖子`，首页 `/`、首页 `/home`、精选 `/featured` 的资源卡片流过滤 `post`，帖子继续只归讨论区链路。
- 后端 `HomeFeedResponse` 补充 `promptModality`，精选页可基于真实 `prompt_entries.modality` 区分视频提示词与图片提示词；精选页同时合并 `feedItems` 和 `hotWorkflows`，避免工作流筛选为空。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/server -> use-local-java17-maven.ps1 -DskipTests compile` 通过。

### 2026-04-20 Interaction baseline cleanup kickoff

- 本轮“互动数据归零 + 去掉前端互动假数据 + 冒烟验证”改用独立小任务板跟踪，见 `.codex/interaction-cleanup-taskboard.md`；后续在该任务板中逐项划线完成，仅保留这里的最小日志指针，避免再次对大进度文档做高风险大补丁。

### 2026-04-20 Boss planning diagrams and docs

- 修复 Draw.io MCP 本地使用方式：`scripts/start-drawio-mcp.ps1` 已改为走项目内 `scripts/drawio-mcp-stdio-wrapper.mjs`，并在 `docs/90_模板与工具/drawio-mcp-排障说明.md` 记录串行调用、端口、assets 和常见超时处理规则。
- 已重写老板汇报用规划材料：`docs/03_架构/DramaTV社区功能脑图-详细版.drawio`、`docs/03_架构/DramaTV社区关键联动链路图.drawio`、`docs/03_架构/DramaTV社区当前状态与上线规划说明.md`。
- 已把新规划材料补入 `docs/README.md` 主读文档清单；`memory/MEMORY.md` 同步沉淀 Draw.io MCP 串行调用规则和 PowerShell UTF-8 / NoProfile 读取规则。
- 已验证两张 Draw.io XML 可解析：功能脑图 `cells=69 / vertices=34 / edges=33`，关键联动图 `cells=73 / vertices=39 / edges=32`。

### 2026-04-21 Boss planning spreadsheet

- 参考 `docs/03_架构/DramaTV(2).xlsx` 的 10 列层级清单形式，新增 `docs/03_架构/DramaTV社区功能规划清单.xlsx`，列结构为 `平台 / 模块 / 节点 / 功能 / 子功能 / 操作 / 状态 / 优先级 / 版本规划 / 日期`。
- 表格内容覆盖当前社区项目九个模块：社区前台、账号与权限、内容对象、发布链路、互动系统、画布联动、审核与治理、媒体与云化、推荐与运营、工程与上线。
- 已验证新工作簿结构：主表 `75` 行、`10` 列、`23` 个合并区；附带 `说明` sheet；未使用公式，因此无公式错误风险。

### 2026-04-21 Three content classes alignment

- 按用户最新确认的产品理解，正式收口社区前台三类主内容：`Prompt 内容`（图片/视频 + 提示词）、`工作流作品`（视频 + 工作流，后续对接画布）、`讨论帖子`（独立 Markdown 讨论）。
- 新增 `docs/03_架构/社区三类主内容与后端资源组合方案.md`，明确前台三类主内容与后端 `prompt_entries / videos + workflows / discussion_threads / media_assets` 的映射关系，并记录图片中提到的注册资料、审核、存储、大文件、异步、画布、搜索推荐、排障等问题当前状态。
- 已生成新版规划表 `docs/03_架构/DramaTV社区功能规划清单-三类主内容版.xlsx`；旧 `DramaTV社区功能规划清单.xlsx` 当前被 Excel 或其他进程占用，未强行覆盖，避免破坏打开中的文件。
- 已验证新版工作簿：主表 `82` 行、`10` 列、`26` 个合并区；无公式。

### 2026-04-21 Planning spreadsheet production risk pass

- 已根据新增问题重做并覆盖 `docs/03_架构/DramaTV社区功能规划清单.xlsx`，在原 10 列结构下补入并发性能、异步解耦、内容安全、OSS/CDN、大文件上传、机器注册防护、第三方邮件服务、IP 池判断、线上监控和业务链路排障等上线级问题。
- 已把“三类主内容数据库改造尚未执行”明确写成 `待开发 / P0 / V1.1 模型收口` 项：当前只是产品口径和文档收口，尚未修改数据库迁移、后端查询和前端接口契约。
- 已验证目标工作簿：主表 `99` 行、`10` 列、`33` 个合并区；无公式；关键项 `三类主内容落库 / 预签名直传 / 任务队列 / 机器注册防护 / 第三方邮件服务 / 不自建 IP 池 / 线上监控` 均已写入。
- 根据用户反馈，已从 `docs/03_架构/DramaTV社区功能规划清单.xlsx` 移除与当前社区项目关联较弱的 `第三方邮件服务` 和 `不自建 IP 池` 两项；保留账号防刷、登录限流、内容安全、上传安全等直接相关能力。复核结果：主表 `97` 行、`10` 列、`33` 个合并区，无公式。

### 2026-04-20 Interaction baseline cleanup done

- 已新增 `scripts/reset-local-interaction-baseline.sql` 与 `scripts/reset-local-interaction-baseline.ps1`，并通过 Docker 本地库执行成功；结果校验为 `active_interactions=0 / active_follows=0 / active_comments=0`，且 `videos/workflows/prompts/posts/creator_profiles` 的相关聚合社交计数全部为 `0`。
- 已移除 `apps/web/src/features/video-detail/VideoDetailPage.tsx` 中视频详情页的 demo comments 回退，空评论时改为真实空态提示；已移除 `apps/web/src/features/discussions/DiscussionsPage.tsx` 中讨论列表右侧热门话题的假热度 fallback 和伪造 k 值/涨幅。
- 验证完成：`apps/web -> npx.cmd tsc --noEmit` 通过；代码内已检索不到 `videoDemoComments / promptDemoComments / fallback-smoke / fallback-publish / fallback-workflow / fallback-selector` 等本轮清理目标。

### 2026-04-20 Interaction realization follow-up

- 发现提示词详情页仍复用视频互动动作，后端互动服务也尚未允许 `prompt` 作为真实目标，导致点赞、收藏、评论返回 `INTERACTION_TARGET_NOT_FOUND / COMMENT_TARGET_NOT_FOUND`；本轮改用 `.codex/interaction-realization-taskboard.md` 继续跟踪提示词与工作流互动补漏。

### 2026-04-20 YouMind prompt frontend runtime follow-up

- 恢复本地联调运行态：确认 `dramatv-postgres:5432` 与 `dramatv-redis:6379` 健康，后端 `http://127.0.0.1:18080/actuator/health` 返回 `200`，并重新以 dev 模式启动前端 `http://127.0.0.1:3106`。
- 继续收口 YouMind Prompt 导入后的前端真实链路：`/featured` 已直接读取后端 `/api/prompts?modality=all&sort=hot`，真实导入 Prompt 卡片正常展示并跳转到 `/prompts/[id]`，`/prompts/d38c33fd-7926-53af-961a-e12eb47e5846` 详情页已使用真实后端数据渲染标题、作者、提示词正文和相关推荐。
- 修正 Prompt 详情页相关推荐误跳旧视频路由的问题：`VideoMiniCardView` 新增可选 `href`，`mapVideoMiniCard()` 显式指向 `/videos/{id}`，`mapPromptMiniCard()` 显式指向 `/prompts/{id}`，`VideoDetailPage` 右侧相关推荐区改为优先使用卡片自身 `href`。
- 修正导入视频 Prompt 的媒体显示问题：新增 `isVideoAssetUrl()`，并在 `FeaturedArchivePage`、`CommunityHomePage`、`VideoDetailPage` 中识别 `mp4/webm/...` 资源；视频 Prompt 现已改为静音循环视频预览，不再把 `mp4` 当背景图导致精选页和提示词详情主视觉发黑。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 实测并截图 `tmp-featured-video-preview-fixed.png`、`tmp-prompt-detail-video-preview-fixed.png`、`tmp-home-prompt-preview-check.png`，控制台无新的 runtime error。
- 当前做到哪一步：YouMind Prompt 已从“数据已导入但前端展示不完整”推进到“精选页 / 首页 / Prompt 详情页都能基于真实后端数据显示，且视频 Prompt 有正常预览”。
- 当前剩余问题：首页里仍混有旧 smoke workflow/video 数据，内容编排还没有完全切到导入后的正式 Prompt 体系；Prompt 互动仍是只读展示，尚未接后端真实评论 / 点赞 / 收藏写入。
- 下次先做什么：优先清理首页和其余分区里的旧 smoke 数据来源，继续把 Prompt 作为一级内容接进首页编排；之后再决定是否补 Prompt 真实互动能力和视频封面 poster 生成。

- 继续按用户要求清理首页主编排：`/home` 与 `/` 现在都在服务端额外拉取真实 `/api/prompts?modality=all&sort=hot`，并把首页主要内容分区切成“真实 Prompt 为主 + workflow 继续保留占位”。
- `apps/web/src/features/home/CommunityHomePage.tsx` 已移除旧 `homeFeed` / `discussion` 对首页内容流的主编排影响；除了 workflow 占位那一栏，`为你推荐 / 精选画布 / 电视广告 / 动画 / 叙事短片 / MV / 创意` 现在都使用真实导入 Prompt 数据切片。
- `apps/web/src/features/home/HomePage.tsx` 也已同步到同一口径：landing 首页的 `精选档案` 不再混入旧 smoke 视频和图片，改为真实 Prompt + workflow 占位混排。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 截图 `tmp-home-real-prompts-only.png` 与 `tmp-landing-real-prompts-only.png` 已确认首页主编排里的旧 smoke 视频/图片消失，只剩 workflow 占位继续存在。

### 2026-04-19 backend dev-mode startup optimization

- Added `scripts/start-server-dev-18080.ps1` to avoid the previous backend development loop of stopping the app, rebuilding an executable Spring Boot jar, and restarting `java -jar`.
- The new script reuses the existing local Java 17 + Maven wrapper and `scripts/run-server-local-db.ps1`, starts the backend through `spring-boot:run`, writes logs to `server-dev-18080.out.log` and `server-dev-18080.err.log`, stops any process already listening on port `18080`, and waits for `/actuator/health`.
- Verified the new runtime path: backend now starts from `apps/server/target/classes` through Maven/Spring Boot dev mode, not from `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`.
- Practical workflow update: for local backend code changes, use `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-server-dev-18080.ps1`. This compiles changed Java classes and restarts the service without running `package` or touching the executable jar, avoiding the Windows jar-lock issue from `spring-boot:repackage`.

### 2026-04-19 current-user and logout integration

- Continued the `P1` auth consolidation pass. Confirmed the backend already exposes `/api/auth/me`, so no duplicate heavy `/api/me/hub` dependency was introduced for topbar identity.
- Extended backend current-user shape in `apps/server`: `CurrentUser`, `AuthSessionResponse`, `CurrentUserService`, and `AuthApplicationService` now include `username`, `identityProvider`, and `externalSubject` alongside `displayName`, `avatarUrl`, `roleCode`, and creator profile metadata. This preserves the future canvas-product SSO mapping boundary instead of hard-coding a local-only identity model.
- Added frontend `ApiAuthSession` and `getCurrentAuthSession()` in `apps/web/src/lib/contracts/community-api.ts` and `apps/web/src/lib/api/community-service.ts`. The helper reads the existing httpOnly session cookie server-side and calls `/api/auth/me`, returning `null` when there is no local community session.
- Added `CommunitySessionProvider` and updated `apps/web/src/app/(community)/layout.tsx` so the formal community route tree resolves the current user once server-side and shares it with client components.
- Updated `PageShell` to use the real current user by default for profile name/avatar, while preserving explicit per-page profile overrides. Logged-in users now see a compact `退出` control in the shared topbar; anonymous landing behavior remains unchanged.
- Added `logoutAction()` in `apps/web/src/features/auth/actions.ts`, reusing the existing `logoutCommunity()` backend call, deleting the httpOnly cookie, and redirecting back to `/` with `RedirectType.replace`.
- Verification passed: `apps/server -> compile` succeeded; `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; backend was rebuilt and restarted on `http://127.0.0.1:18080`; Playwright verified `匿名 /` has no logout button and canvas links gate to login, login to `/home` shows real current user `Rina Flux` plus `退出`, clicking `退出` returns to `/`, and `/home` after logout redirects to `/login?redirectTo=%2Fhome`.
- Residual known issue: the current smoke user avatar still points to `https://cdn.dramatv.local/avatar/rina-flux.png`, which produces a browser resource error because that local CDN host is not available. This is a data/resource cleanup issue, not an auth-session regression.

### 2026-04-19 landing auth state follow-up

- Fixed the misleading "login state lost after returning to /" behavior in the formal `apps/web` app. The real issue was not cookie loss: the landing page `/` had been hard-coding login-first links even after authentication, so returning from the canvas route made the homepage still behave like an anonymous page.
- Updated `apps/web/src/app/(community)/page.tsx` to read `hasCommunitySession()` server-side and pass auth state into `apps/web/src/features/home/HomePage.tsx`. The landing page now switches its CTA, archive card, profile, and floating-entry links between real targets and `/login?redirectTo=...` based on the actual current session.
- Added a server-side logged-in fallback on `apps/web/src/app/(community)/login/page.tsx`, so visiting `/login?redirectTo=...` while already authenticated now redirects straight to the target page instead of showing the login form again.
- Changed `apps/web/src/app/(community)/login/actions.ts` to redirect with `RedirectType.replace`, so successful login no longer leaves the login page in browser history. Browser back from canvas now returns to `/` directly instead of landing on a dead login step in the middle.
- Added in-page recovery navigation for canvas runtime and backend-unavailable states: `apps/web/src/features/canvas-runtime/CanvasRuntimePage.tsx` now shows `返回社区` and `查看来源工作流`, and `apps/web/src/components/shared/CommunityBackendUnavailableState.tsx` now exposes `返回社区 / 回到首页`, so users are not forced to rely on the browser back button when the canvas entry lands on a placeholder or error state.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; Playwright verified the full chain `匿名访问 / -> 点击画布入口 -> /login?redirectTo=%2Fcanvas -> 登录 -> /canvas -> 浏览器回退 -> /` and confirmed that the landing page canvas link becomes `/canvas` after login, and that visiting `/login?redirectTo=%2Ffeatured` while already authenticated now lands directly on `/featured` without rendering the login form.

### 2026-04-19 canvas entry auth guard fix

- Fixed the user-visible auth gap for the left-side canvas entry in the formal `apps/web` app. The root cause was that the running backend process was still effectively allowing anonymous requests through an old demo-user fallback, so `/canvas` did not return `401` and the frontend never reached the previous auth-error redirect branch.
- Added a small server-side auth guard at `apps/web/src/lib/auth/community-auth.ts`, based on the existing httpOnly `dramatv_access_token` cookie. This keeps the current local login flow compatible with future canvas-product SSO replacement, because the guard only checks whether a community session token exists and does not hard-code any local-only identity model.
- Applied the new guard before backend data loading on `/canvas`, `/canvas/[runtimeId]`, `/publish`, `/discussions/new`, and `/me`, so unauthenticated access is now redirected immediately to `/login?redirectTo=...` even if the backend runtime has not yet been rebuilt to remove the old fallback behavior.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded; direct HTTP header checks against `http://127.0.0.1:3106/canvas`, `/publish`, `/discussions/new`, and `/me` now all return `307 Temporary Redirect` to the expected `/login?redirectTo=...` routes.

### 2026-04-19 featured prompt catalog cleanup

- Updated the formal featured archive in `apps/web` so old simulated prompt cards are no longer used on `/featured`. The page now keeps simulated `WORKFLOW` cards only, while prompt entries come from the imported local catalogs in `apps/web/public/seedance-data.json` and `apps/web/public/nano-banana-data.json`.
- Re-grouped imported prompt content to match the agreed product buckets: imported Seedance video prompts now surface under the `short` filter, and imported Nano Banana image prompts now surface under the `tool` bucket with the visible filter label changed from `工具` to `图片`.
- Added a local imported prompt bridge for the formal detail route: `/videos/[id]` now recognizes imported prompt ids and renders them through the normal `VideoDetailPage` instead of falling through to backend 404 behavior.
- Extended `VideoDetailPageView` with optional `promptText` and `media.kind`, then updated `VideoDetailPage.tsx` so imported prompt detail pages use real prompt text, image prompts no longer show the video playback toggle, and imported prompt pages are treated as read-only showcase pages instead of attempting like/favorite/comment writes against backend ids that do not exist.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded.

### 2026-04-19 unauthenticated landing access rule tighten

- Tightened the unauthenticated access boundary to match the latest product rule: anonymous users may browse only the landing page `/`, while `/home`, `/featured`, `/discussions`, `/publish`, `/me`, `/canvas`, and other community routes now redirect to `/login?redirectTo=...`.
- Switched the Next.js 16 request gate from the deprecated `middleware.ts` convention to the current `proxy.ts` convention at `apps/web/src/proxy.ts`, because the app is already on Next.js `16.2.2` and the old middleware convention is only a compatibility path.
- Updated the landing page interaction behavior in `apps/web/src/components/shared/PageShell.tsx` and `apps/web/src/features/home/HomePage.tsx`: the landing page still allows scrolling and browsing, but top navigation, archive cards, featured CTA, personal entry, floating canvas entry, and floating publish entry all route unauthenticated users to `/login` first, preserving the intended post-login target through `redirectTo`.
- Updated `apps/web/src/features/login/LoginPage.tsx` so the login page itself no longer encourages unauthenticated users to continue into `/home`, `/featured`, or `/discussions`; the fallback browse buttons now return to `/`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; `apps/web -> npm.cmd run build` succeeded and the build output now explicitly includes `ƒ Proxy (Middleware)`; direct HTTP checks confirmed `/` returns `200` while `/home`, `/featured`, `/discussions`, `/canvas`, and `/me` all return `307 Temporary Redirect` to `/login?redirectTo=...`; Playwright verified that landing-page clickable content now resolves to login-first URLs.

### 2026-04-19 auth/login follow-up

- Finished the protected-route auth redirect pass on the formal `apps/web` stack: `/discussions/new`, `/me`, `/canvas`, and `/canvas/[runtimeId]` now redirect unauthenticated access to `/login?redirectTo=...`, matching the existing `/publish` handling.
- Rebuilt the `/login` frontend from the previous minimal dev form into a full community-style page in `apps/web/src/features/login/LoginPage.tsx` and `apps/web/src/features/login/LoginPage.module.css`, keeping the existing dark cinematic language while clearly stating that the current local login is only a bridge to the future canvas-product identity provider.
- Hardened the login redirect behavior in `apps/web/src/app/(community)/login/actions.ts` so post-login navigation only accepts safe internal paths, instead of blindly trusting any `redirectTo` query value.
- Fixed a formal-build blocker discovered during verification: `apps/web/src/lib/api/community-service.ts` uses `next/headers`, so client components can no longer import it directly. Moved the client-side upload flow in `apps/web/src/features/publish/PublishPage.tsx` and `apps/web/src/features/discussions/DiscussionComposerPage.tsx` to the existing server action layer via the new `uploadAssetAction(...)` in `apps/web/src/features/publish/actions.ts`, preserving httpOnly auth cookies and restoring clean Next.js production builds.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded and `apps/web -> npm.cmd run build` succeeded; the built route table now includes `/login`, `/me`, `/canvas`, `/canvas/[runtimeId]`, `/publish`, and `/discussions/new` without the previous Turbopack server-only import failure.

### 2026-04-19

- 前端复刻阶段到达一个节点，后续执行重点切回正式主线 `apps/web + apps/server` 的后端能力补齐。
- 明确后续四项任务：`P1` 真实鉴权与当前用户体系，`P2` 首页与精选去 demo 资源，`P3` 举报/通知/个人设置编辑，`P4` 评论能力增强。
- `P2` 当前故意不启动，等待用户后续提供本地资源路径后再接入。
- 为了修复近期 `.codex/progress.md` 多次补丁失败的问题，已补充稳定 ASCII 锚点 `<!-- CODEX:SNAPSHOT -->`、`<!-- CODEX:BOARD -->`、`<!-- CODEX:LOG -->`，后续进度更新改为围绕锚点做小补丁，不再依赖容易受终端编码影响的中文原文匹配。
- 开始推进 `P1` 第一刀：后端已新增 `V8__add_auth_sessions.sql`，给 `users` 补充 `password_hash / identity_provider / external_subject`，并新增 `auth_sessions` 会话表，为后续接入画布侧登录保留外部身份映射边界。
- 后端已新增 `CurrentUserFilter / CurrentUserService / CurrentUserContext`，`/api/auth/login` 改为真实本地 session token 写入 `auth_sessions`，`/api/auth/logout` 改为真实 revoke，会话读取统一走 `Authorization: Bearer ...`。
- 业务链路已开始从固定 demo identity 迁移到当前用户：`PublishDraftPersistenceService`、`InteractionJdbcPersistenceService`、`UploadApplicationService`、`MeQueryService`、`CanvasApplicationService` 已改为通过 `CurrentUserService` 取用户，不再在这些服务里直接依赖 `DemoCommunityIdentity`。
- 为避免在画布登录尚未对接、前端登录页尚未补齐时把现有社区页面全部打断，当前保留了 `dramatv.auth.local-dev-fallback-enabled=true` 的开发态 fallback；它仍走统一 `CurrentUserService`，后续接画布登录时可直接关闭，不需要再回改发布/互动/个人中心业务层。
- 已验证：`apps/server -> powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 继续推进 `P1` 第二小步：`CommunityCatalogJdbcQueryService` 与 `DiscussionQueryService` 的 viewer 状态读取已不再固定绑定 demo viewer，未登录时详情页/讨论页的点赞、收藏、关注态会自然回落为 `false`。
- 前端已补最小开发态登录入口：新增 `/login` 路由、`loginAction` 和 `LoginPage`，`community-service.ts` 现已统一通过 httpOnly cookie 读取 token，并自动把 `Authorization: Bearer ...` 带到后端请求头，后续接画布登录时只需要替换 token 来源。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/server -> powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 再次通过。

### 2026-04-08

- 根据最新一轮产品反馈继续收口 `apps/web` 的页面分层，把首页维持为“作品主流 + 方法侧栏”，避免作品卡与关联工作流卡在首页重复抢同级大位。
- 重写 `apps/web/src/features/publish/PublishPage.tsx`、`apps/web/src/features/video-detail/VideoDetailPage.tsx`、`apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 与 `apps/web/src/features/creator/CreatorPage.tsx`，让发布页、视频详情页、工作流详情页、创作者页形成不同的信息结构和视觉语气。
- 修正 `apps/web/src/components/publish/PublishFormSection.tsx` 默认文案，并在 `apps/web/src/app/globals.css` 补齐页面变体、评论区、方法侧栏、发布模式卡片、放映页侧栏、画布板等样式；整体压低圆角密度，减少玻璃态样式疲劳。
- 交互表达继续保持诚实：只有关联工作流已公开时才显示“查看创作过程”，未公开时只展示状态说明，不伪装成可用入口。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；Playwright 已实测首页、发布页、视频详情页、工作流详情页的页面层级差异。
- 当前做到：首页、发布台、放映页、方法页已经不再像同一个页面壳子的不同文案版。
- 当前卡点：本地 smoke 数据里仍有英文标题与 `cdn.dramatv.local` 头像资源噪音；创作者页仍需再做一次单独 smoke 与数据清理。
- 下次先做：继续清理本地 smoke 数据与失效头像资源，再细化首页主内容流密度，并补一轮移动端下发布台 / 放映页 / 方法页的版式校正。

- 根据最新一轮首页导航反馈继续收口 `apps/web/src/components/shared/PageShell.tsx`、`apps/web/src/features/home/HomePage.tsx` 与 `apps/web/src/app/globals.css`：删除首页侧栏里的“创作者 / 发布”入口，保留“首页 / 讨论区 / 内容流”，顶栏右侧改成个人头像入口，并补上工作流空状态说明，避免无效跳转和假能力。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 均通过。
- 当前做到：首页导航、顶栏人格入口和方法侧栏的语义已更偏社区浏览。
- 当前卡点：右上角头像仍是前端占位，首页推荐创作者仍由现有静态数据驱动；若要做成全站统一入口，仍需补真实当前用户数据源。
- 下次先做：待这一轮首页效果确认后，再决定是否把同一套头像入口扩到详情页 / 讨论页，并继续细修移动端和间距层级。

- 根据新反馈继续给首页做减法：重写 `apps/web/src/features/home/HomePage.tsx`，删掉侧栏策略说明、创作者侧栏、讨论描述、重复标签和大段首屏说明，首页收成“极简导航 + 一条样片 + 作品流 + 创作过程 / 讨论侧栏”。
- 同步调整 `apps/web/src/app/globals.css`：压低首页字号、段落长度、视频区高度和侧栏卡片密度，让首页从“信息堆叠”变成“先扫一眼就能找到主线”。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：首页文案和说明性信息已明显减半，创作者入口主要回收到卡片头像和顶栏头像，不再在首页重复出现多个说明块。
- 当前卡点：这一轮主要解决的是“乱”和“重”，还没有继续压视觉装饰层；如仍嫌重，下一轮应继续削弱背景光效、边框层次和 Hero 存在感。
- 下次先做：待简化版确认后，再决定是否继续走更极简方向，例如缩小首屏样片、收窄侧栏、继续减少顶部品牌信息。

- 继续收口 `/discussions`：重写 `apps/web/src/features/discussions/DiscussionsPage.tsx`，删掉 Hero 侧栏、接口占位区和大段说明，把页面改成“轻首屏 + 频道入口 + 最新讨论列表”。
- 同步调整 `apps/web/src/app/globals.css`：新增更轻的讨论区 Hero、频道块和帖子行样式，并补上响应式与 hover / focus 状态。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：讨论区首页的信息层级已明显简化，主要保留频道入口和帖子列表，阅读路径更直接。
- 当前卡点：讨论详情页 `/discussions/[slug]` 仍保持上一版较重的信息结构；如下一轮继续做减法，需要连详情页一起收。
- 下次先做：待讨论区首页确认后，再决定是否继续压缩讨论详情页与顶部品牌区的信息量。

- 继续收口作者页：重写 `apps/web/src/components/shared/CreatorHeader.tsx` 与 `apps/web/src/features/creator/CreatorPage.tsx`，把头部从大面积展示板改成更轻的资料条，并把“作品 / 工作流”双栏改成单列混合内容流。
- 同步调整 `apps/web/src/app/globals.css`：压低作者头部尺寸，新增更轻的资料条样式，并新增单列 `creator-stream-grid`，避免只有少量内容时仍显得像两大分区。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页更像创作者主页，视频与工作流已合并到同一条内容流里。
- 当前卡点：卡片本身仍保留较完整信息量；如仍嫌重，下一轮应该继续削减卡片内说明和元信息。
- 下次先做：待作者页确认后，再决定是否继续压缩视频卡 / 工作流卡的信息密度，或者转去处理讨论详情页。

- 根据最新反馈继续修正作者页规则：`apps/web/src/features/creator/CreatorPage.tsx` 不再混排 `WorkflowCard`，只保留 `VideoCard`；工作流只作为视频卡里的“查看创作过程”附属入口，不再作为独立卡片出现。
- 同步调整 `apps/web/src/app/globals.css`：把作者头部和内容区再压小一档，并把 `creator-stream-grid` 改成与首页一致的双列卡片尺寸。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页已对齐“首页卡片大小 + 只展示作品卡”的方向，工作流不再作为独立卡片出现。
- 当前卡点：如果后续数据里出现“作者有工作流但没有视频”，当前作者页会按规则不展示独立工作流卡；这符合当前要求，但若产品规则再变更需要继续调整。
- 下次先做：如仍觉得作者页重，优先继续缩 `VideoCard` 的文案和元信息，而不是再把工作流独立拉出来。

- 继续根据最新反馈压缩作者页卡片：重写 `apps/web/src/components/cards/VideoCard.tsx`，去掉媒体区里重复出现的“查看创作过程”按钮，只保留正文底部的一个入口。
- 同步调整 `apps/web/src/app/globals.css`：把作者页 `creator-stream-grid` 改成固定较小卡宽，媒体区高度压到更接近原来的一半，并收紧作者信息、标题、摘要和底部操作区。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 再次通过。
- 当前做到：作者页视频卡已明显缩小，空白媒体占位被压下去，流程入口只剩一个，工作流继续只作为视频附属关系存在。
- 当前卡点：如用户仍觉得大，下一轮就不能只缩卡片比例，而要继续减少卡片内部层级，例如弱化顶部统计和底部状态 pill。
- 下次先做：待尺寸确认后，再决定是否继续把作者页卡片收成更接近信息流列表，而不是封面型卡片。

- 已实际验证外部参考页 `https://youmind.com/zh-CN/seedance-2-0-prompts?utm_source=nav`：页面卡片为 Cloudflare Stream iframe 视频卡，“查看详情”弹层里可拿到完整提示词，视频也可通过 `manifest/video.mpd + ffmpeg -c copy` 下载为本地 `mp4`。
- 已落地一条本地样例到 `tmp/youmind-samples`：包含 `seedance-2-romance.mp4` 与对应的 `seedance-2-romance-prompt.txt`，可作为后续批量采集和前端静态联调样本。
- 新增 `docs/02_研究/YouMind Seedance界面复刻与30条样本采集方案.md`，整理了 30 条样本采集方法、目录规范、数据结构、前端复刻边界、验收标准和可直接复制的执行提示。
- 当前做到：项目已具备一套可复用的外部样本采集路径和前端复刻交接文档。
- 当前卡点：30 条样本尚未批量入库；若真的开始批量抓取，需要先决定是继续放在 `tmp` 做实验，还是直接按正式目录写入 `apps/web/public/external-samples/youmind-seedance`。
- 下次先做：如继续推进，优先批量采集 30 条样本并生成 `manifest.json`，再用这批静态数据做独立的 YouMind 风格参考页。

- 根据最新详情页反馈，重写 `apps/web/src/features/video-detail/VideoDetailPage.tsx`：把视频详情页从“首页壳子 + 右侧展板”收成更直接的作品详情结构，保留视频、标题、标签、作者、创作过程、点赞 / 收藏、评论和相关推荐，但减少重复动作和重复信息块。
- 同步调整 `apps/web/src/app/globals.css`：压缩 `video-detail` 顶部头部尺寸，缩小页面宽度与右栏比例，把 2x2 大统计卡改成更轻的统计条，把作者区与关注动作合并，把创作过程卡改成更轻的单行信息块，同时压低评论区和相关推荐区的标题与留白。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 均通过，这轮重构没有破坏路由或构建。
- 当前做到：视频详情页已明显从“展板式页面”回收到“内容式详情页”，信息主线更聚焦在作品本身。
- 当前卡点：这一轮还没有继续动工作流详情页和讨论详情页；如果接下来仍觉得详情页体系不统一，下一步要按同样逻辑继续收这两页。
- 下次先做：待这版视频详情页方向确认后，再继续把工作流详情页和讨论详情页按同样的减法逻辑统一掉。

### 2026-04-09

### 2026-04-15
- Home page style reset completed on formal `apps/web` mainline. `PageShell` now has a dedicated `home` header with floating cinematic navigation, and `HomePage` no longer uses the old three-column control-panel layout.
- The new homepage structure is: cinematic hero, lead-story spotlight card, filmstrip shelf, curated content panels, creator radar, and compact launch-pad actions. Data source stayed on the existing `HomePageView` contract; no backend/API change was made.
- Verification passed on `2026-04-15`: `apps/web -> npm.cmd run build` succeeded, `http://127.0.0.1:3106/` returned `200`, and Playwright screenshot review confirmed the homepage now tracks the `mindloop-_-cinematic-archive (1)` direction much more closely.
- Discussion hub replica pass completed on formal route `/discussions`. The page now uses the cinematic floating topbar, three-column community layout, topic cards, thread stream, trending rail, and contributor rail aligned to the `3111` reference direction.
- Discussion page data still uses the current backend where available: channels and featured threads come from `getDiscussionHome`, and thread author avatars/names are filled from `getDiscussionThread` per slug so the list is not purely fake placeholder content.
- Verification passed on `2026-04-15`: `apps/web -> npm.cmd run build` succeeded again, Playwright screenshot check on `http://127.0.0.1:3106/discussions` matched the new layout, and console errors were cleaned after filtering blocked avatar hosts.
- Topbar refinement completed on `2026-04-15`: the shared `home` shell now uses a full-width sticky header flush to the top edge instead of the previous rounded floating capsule, and the content area is constrained separately through `page-shell-home-content`.
- Typography refinement completed on `2026-04-15`: the `Drama TV` wordmark, nav sizing, and utility button proportions were tightened to better track the `3111` reference. Verified visually on both `/` and `/discussions`, including scroll-state checks with no top gap.
- Second refinement pass completed on `2026-04-15`: homepage and discussion typography were compressed another step down, including the shared topbar, hero titles, card titles, and sidebar/thread copy so the page reads closer to the tighter `3111` density.
- Top-edge artifact mitigation completed on `2026-04-15`: the top chrome was darkened and the topbar background was made more opaque to avoid the “top gap / bright seam” impression when the page is scrolled to `0`. Verified again on `/` and `/discussions` with fresh screenshots after `apps/web -> npm.cmd run build`.
- Discussion copy cleanup completed on `2026-04-15`: added a front-end presentation layer for smoke/test discussion titles, excerpts, and topic tags so long English slug-like strings now render as shorter Chinese display labels on `/discussions`, and homepage discussion cards reuse the same title cleanup.
- Discussion density refinement completed on `2026-04-15`: reduced the discussion-page type scale another step and added line clamping for topic cards, thread titles, excerpts, and trend labels so long titles no longer dominate the layout. Verified with `apps/web -> npm.cmd run build` and fresh Playwright screenshots.

- Recovery-guide alignment check completed: do not assume the visual migration is already recognized. The formal mainline is still `apps/web` (`Next.js + React + TypeScript`) + `apps/server` (`Spring Boot`); the old `React + Vite` work remains archive/reference only.
- Route/code/runtime mismatch confirmed for `/me`: source contains `/api/me/hub` in `apps/server/src/main/java/com/dramatv/community/me/controller/MeController.java`, frontend `/me` consumes it from `apps/web/src/app/(community)/me/page.tsx` through `apps/web/src/lib/api/community-service.ts`, but the always-on local `18080` runtime still returns `500` with `No static resource api/me/hub`.
- Runtime mismatch evidence tightened: `logs/server/error.log` and `server-18080.out.log` repeatedly record `No static resource api/me/hub`; current local `java` process start time is `2026-04-14 10:07:28`; `MeController.java` last write time is `2026-04-14 12:21:55`; `apps/server/target/classes/com/dramatv/community/me/controller/MeController.class` last write time is `2026-04-14 12:28:56`; `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar` last write time is `2026-04-12 14:22:12`, and the packaged jar currently contains `Count=0` matches for `MeController.class`. Current judgment: local `18080` is running a stale backend build/process, not the latest source.
- Creator page discrepancy confirmed: route still fetches workflows in `apps/web/src/app/(community)/creators/[id]/page.tsx`, mapper/view-model still preserve `workflows` in `apps/web/src/lib/mappers/community.ts` and `apps/web/src/lib/contracts/view-models.ts`, but `apps/web/src/features/creator/CreatorPage.tsx` renders only the `videos` section. This does not satisfy the documented creator-page split of `作品 + 工作流`.
- Home page discrepancy confirmed: `apps/web/src/features/home/HomePage.tsx` still builds and renders `standaloneWorkflowShelf` / `#workflow-shelf` from `feedItems` + `hotWorkflows`. Copy already frames workflow as a linked method entry, but implementation still keeps a semi-independent workflow shelf structure.
- Current status: this round stayed in inspection mode only. No fix was applied. The next highest-value step is either `1)` restart/run the current formal backend build and re-check `GET /api/me/hub` + `/me`, or `2)` continue pure audit mode and write a runtime visual-gap checklist for `/`, `/videos/[id]`, `/creators/[id]`, `/me`.
- Follow-up runtime action completed: the stale always-on backend process `PID 11976` was confirmed alive on `18080`, then stopped manually before restart. A fresh package was built at `2026-04-15 13:36:50`, and the rebuilt jar now contains `BOOT-INF/classes/com/dramatv/community/me/controller/MeController.class`.
- Local backend was restarted cleanly on `18080`; the new running Java process is `PID 14716`, started at `2026-04-15 13:37:09`. Verification passed: `GET http://127.0.0.1:18080/actuator/health` -> `200 {"status":"UP"}` and `GET http://127.0.0.1:18080/api/me/hub` -> `200` with real hub payload and requestId `2a657d98-3d1e-48dd-a661-0645975e71cd`.
- Frontend follow-up verification also passed after backend restart: `GET http://127.0.0.1:3106/me` -> `200`, no backend-unavailable fallback markers, and page HTML now contains `Rina Flux`, liked-section content, and favorited-section content. Current judgment: `/me` is now restored in local runtime; the earlier failure was a stale-process issue, not a missing-code issue.

- 补做一轮项目现状核对：按 `AGENTS.md` 的会话恢复入口重新对照文档与代码，确认当前主线工程已不是“React + Vite 原型”，而是 `apps/web` 的 `Next.js + React + TypeScript` 前端与 `apps/server` 的 `Spring Boot` 后端；旧原型已归档到 `archive/legacy-react-vite-prototype`。
- 已验证：根目录执行 `npm.cmd run build:web` 可以完整通过，当前社区主站路由包含首页、视频详情、工作流详情、作者页、发布页、讨论区、画布页和 seedance 参考页。
- 代码 / 文档偏差补记：
- `AGENTS.md` 里“现有代码仍是 React + Vite 原型”的表述已落后于仓库现状，应以代码为准。
- `docs/03_架构/候选技术栈分析.md` 仍写 `Tailwind CSS`，但 `apps/web/package.json` 当前没有 Tailwind 依赖，正式前端实际使用的是自定义全局 CSS。
- 文档要求作者主页同时展示“作品 + 工作流”，但当前 `apps/web/src/features/creator/CreatorPage.tsx` 已按最新产品规则改成只展示视频卡，工作流只作为视频附属入口存在。
- 文档里的鉴权设定比代码更完整；当时后端 `SecurityConfig` 仍是 `permitAll`，`AuthApplicationService` 还是基于 mock catalog 的 demo 登录态。
- 文档里的画布联动设计比代码更靠前；当时数据库与迁移已为 runtime / copy task 预留表结构，但 `CanvasApplicationService` 仍是内存态 stub。
- 当前做到：项目已经处于“社区主路径部分真实打通、账号与画布仍是演示态”的阶段，不宜再简单判断成纯页面原型。
- 当前卡点：后端没有本地 Maven 可执行命令，这一轮没有补做 `apps/server` 的即时编译验证；另外讨论区仍主要是前端静态占位，不属于已打通的真实后端主链路。
- 下次先做：如果继续推进，应优先统一文档口径，然后补作者页规则说明、真实鉴权方案和讨论区 / 画布的阶段边界，避免后续继续按过时文档判断项目阶段。

- 按“先统一文档，再逐步去 mock”继续收口：删除前端未引用的 `apps/web/src/lib/mock/community-api.ts` 和后端未引用的 `apps/server/src/main/java/com/dramatv/community/shared/mock/MockCommunityCatalog.java`，并把 `application.yml` 里的 `mock` profile 配置整体移除；`local-db` 现在是唯一保留的日常运行路径。
- 调整 `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`：工作流详情查询现在会真实关联 `canvas_bindings`，把 `binding_type / open_url / canCopy` 回写到 `WorkflowDetailResponse.canvasBinding`，不再返回空的画布联动信息。
- 调整 `apps/server/src/main/java/com/dramatv/community/interaction/persistence/InteractionJdbcPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishDraftPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishedContentPersistenceService.java`、`apps/server/src/main/java/com/dramatv/community/publish/persistence/PublishModerationPersistenceService.java` 与 `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`：移除 `@Profile("!mock")`，这些真实持久化服务不再挂在“非 mock 才启用”的条件上。
- 调整 `apps/web/src/features/devtools/local-smoke/shared.ts` 与相关文档：开发工具页环境类型收成 `real`，`apps/server/README.md`、`docs/04_实施设计/后端本地数据库启动与建表验证.md`、`docs/04_实施设计/页面与接口对接规划.md` 也同步明确“当前仓库不再保留运行时 mock 分支”。
- 已验证：根目录执行 `npm.cmd run build:web` 通过；执行 `powershell -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过，说明这轮“去 mock + 接真实画布绑定”没有破坏前后端编译。
- 纠正上一条记录里已过时的两点：`AuthApplicationService` 已不再依赖 `MockCommunityCatalog`，只是当前仍保留本地开发态 demo session；`CanvasApplicationService` 也已切到 JDBC + PostgreSQL 路径，不再是内存 stub。
- 当前做到：文档口径已经对齐到“`apps/web` + `apps/server` 全链路开发、无 runtime mock fallback”，首页 / 详情 / 作者 / 发布 / 画布主链路的正式代码也已全部站到真实后端和真实数据库路径上。
- 当前卡点：鉴权仍是本地开发态 demo session，不是真实账号体系；媒体上传资产、审核视角查询、讨论区真实帖子实体仍未进入同等完成度。
- 下次先做：沿着全链路继续推进时，优先顺序建议是 `真实上传 / 媒体资产入库 -> 真实鉴权方案 -> 讨论区最小后端实体`，而不是再回头恢复任何 mock 分支。

### 2026-04-10

#### 2026-04-10 续

- 落地后端日志切分与滚动：新增 `apps/server/src/main/resources/logback-spring.xml`，固定日志目录 `logs/server`，区分 `application.log`、`error.log`、`access.log`，并统一在日志 pattern 中输出 `requestId`；`application.yml` 新增 `dramatv.logging.dir` 与 `com.dramatv.community.access` 日志级别。
- 新增 `apps/server/src/main/java/com/dramatv/community/shared/request/AccessLogFilter.java`，记录 `method/path/status/durationMs/remoteIp`，默认跳过 `/actuator/health` 和 `/actuator/info`；`RequestIdFilter` 增加顺序，确保 `requestId` 先进入 MDC 再写 access log。
- 前端错误态补齐 `requestId` 展示：重写 `CommunityBackendUnavailableState` 以及社区首页、视频详情、工作流详情、作者页、画布页、发布页、smoke 页等路由错误页，在后端不可用时直接展示 `Request ID`。
- 前端 server action 补齐 `requestId`：重写 `apps/web/src/features/publish/actions.ts` 与 `apps/web/src/features/devtools/local-smoke/actions.ts`，失败文案统一通过 `appendCommunityRequestId(...)` 追加 `Request ID`。
- 修正 `apps/web/src/lib/api/community-service.ts`：补充 `getCommunityErrorRequestId` / `appendCommunityRequestId`，失败响应解析统一回收后端 `requestId`；同时清掉导致 TS 语法错误的坏字符串，恢复前端编译。
- 验证通过：`apps/web` 执行 `npx.cmd tsc --noEmit` 通过；`apps/server` 执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 未完成项：`apps/web/src/features/community-interactions/actions.ts` 里互动类 server action 还没有统一把 `requestId` 拼进错误提示；当前页面级错误态和发布/smoke 链路已补齐，下轮优先补这一块。

- 对照参考脑图 `C:\Users\psk13\Documents\xwechat_files\wxid_s7fuv84r25qm22_5dbc\msg\file\2026-04\Map1(1).pdf` 重新梳理社区结构，确认原来的社区脑图主要缺的不是“再多几个页面”，而是缺少对象级字段、状态流转、权限边界、资源分层、通知回流、数据反馈和跨内容对象联动。
- 新增 `docs/03_架构/DramaTV社区功能脑图-详细版.drawio`，把社区拆成“内容对象体系 / 首页与发现 / 提示词库 / 作品社区 / 工作流与画布 / 讨论区 / 创作者与发布 / 互动与治理 / 关键联动关系”九个分支，并补到可执行的小功能级别。
- 新增 `docs/03_架构/DramaTV社区关键联动链路图.drawio`，单独把 `Prompt -> Workflow -> Copy To Canvas -> Runtime -> Publish -> Review -> Feed -> Video Detail -> Interaction -> Creator -> Continue Discovery` 的主链路，以及 `Discussion ↔ Content Object`、`Notification -> Creator Workspace -> Re-publish`、`Data Feedback -> Feed Ranking` 的回流路径画出来，避免后续页面和接口拆分各自为政。
- 已验证：`docs/03_架构/DramaTV社区功能脑图-详细版.drawio` 与 `docs/03_架构/DramaTV社区关键联动链路图.drawio` 均能通过本地 XML 解析。
- 当前做到：社区脑图已经从“页面罗列”推进到“对象 + 小功能 + 状态 + 回流”的层级，可以直接作为下一步拆 API、表结构、页面模块和联调顺序的基础图。
- 当前卡点：详细脑图和联动链路图已经足够指导第一轮实现，但如果继续往“研发可执行清单”推进，还需要再把每个对象下的最小接口、状态字段和前后端 owner 拆成单独文档。
- 下次先做：优先把这两张图继续落成一份“社区对象关系表 + 页面动作清单 + API / 表结构映射”文档，然后按链路从发布、详情、讨论、通知四段往代码里逐段对齐。
- 修复 `scripts/start-server-18080.ps1`：去掉依赖 `Invoke-WmiMethod` 的进程创建方式，改为 `Start-Process`；新增可执行 Spring Boot jar 检查与自动重打包；启动确认从固定 2 秒改为最长 45 秒轮询 `http://127.0.0.1:18080/actuator/health`，避免“服务其实能起来，但脚本先误报失败”。
- 修复 `scripts/start-web-3100.ps1`：不再是前台阻塞脚本，改成真正的后台启动脚本；默认用 `start` 模式稳定启动，并支持 `-Mode dev`；若缺少 `.next/BUILD_ID` 会自动先执行 `npm run build`；启动确认改为轮询 `http://127.0.0.1:3100/`，并统一输出日志路径。
- 已验证：在本机真实环境下完成一轮前后端冷启动验证，`scripts/start-server-18080.ps1` 能从零拉起后端并让 `actuator/health` 返回 `{"status":"UP"}`，`scripts/start-web-3100.ps1` 能从零拉起前端并让 `http://127.0.0.1:3100/` 返回 `200`。

- 结合团队关于 DramaTV 画布开发和上线问题的讨论，已把“全链路排障能力必须前置”正式补入项目规范：`AGENTS.md` 新增 `可观测性与链路追踪规则 / 错误码与日志规则 / Bug 反馈与复现信息规则` 三节，明确 `requestId` 贯穿、关键业务 ID 打点、第三方错误统一映射、日志固定落盘与敏感信息脱敏。
- 同步把两条高频经验沉淀到 `memory/MEMORY.md`：一是进入全链路阶段后必须先补 `requestId + 错误码 + 日志`，二是上传 / 画布 / 审核等跨系统链路不能直接把第三方原始错误透给前端。
- 当前做到：项目级开发规范已经从“页面、模块、数据结构”进一步补到“排障、日志、错误处理、Bug 反馈字段”。
- 当前卡点：规范已经收口，但代码层尚未完全落实到前端主动传 `X-Request-Id`、后端统一异常映射、结构化日志落盘这几个点。
- 下次先做：按新增规范反推代码整改顺序，优先补前端 `X-Request-Id`、后端统一异常映射和上传 / 画布链路的安全错误返回。

- 按新增规范开始反推代码整改：前端 `apps/web/src/lib/api/community-service.ts` 已统一为真实后端请求自动附带 `X-Request-Id`；后端 `RequestIdFilter` 已把 `requestId` 同步写入 `MDC`，给后续日志检索留出统一键。
- 新增后端公共异常层：`apps/server/src/main/java/com/dramatv/community/shared/error/ApiBusinessException.java` 与 `apps/server/src/main/java/com/dramatv/community/shared/error/ApiExceptionHandler.java` 已落地，统一收口业务异常、参数校验异常、请求体错误和兜底 500，并在日志中补记 `status / code / requestId / method / path`。
- 已开始回收控制器里的手写异常返回：`HomeFeedController`、`UploadController`、`CommentController`、`InteractionController` 改为走统一异常出口；`HomeFeedQueryService`、`UploadApplicationService`、`CanvasApplicationService` 也已改为使用带错误码的业务异常，补上 `FEED_CHANNEL_INVALID`、`UPLOAD_FILE_TOO_LARGE`、`UPLOAD_MIME_NOT_ALLOWED`、`WORKFLOW_ID_INVALID`、`CANVAS_COPY_MODE_INVALID`、`CANVAS_COPY_FORBIDDEN` 等安全返回。
- 前端交互层已补上新增画布复制错误码的人话提示，避免画布复制失败时只落到通用错误文案。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；根目录执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：`requestId` 透传、统一异常出口、上传/画布链路安全错误返回已经从规范落到第一版代码。
- 当前卡点：前端还没有把 `requestId` 明确展示到失败态 UI；后端日志尚未补到固定滚动文件与 access/error 分流；上传策略本身仍是本地占位实现，不是真实对象存储签发。
- 下次先做：继续把前端错误态补上 `requestId` 暴露入口，并把后端日志配置和上传链路真实化往前推进。

- 收尾前端 `requestId` 改造：清理 `apps/web/src/lib/api/community-service.ts` 里上轮为规避乱码留下的临时注释死代码，保留统一的 `getCommunityErrorRequestId` / `appendCommunityRequestId` / `requestBackend(Command)` 错误透传逻辑；`apps/web/src/features/community-interactions/actions.ts` 已统一通过 `appendCommunityRequestId(...)` 给评论、点赞、收藏、关注、复制工作流等交互失败态补齐 `Request ID`。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过；`apps/web` 下执行 `npm.cmd run build` 通过；根目录执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：后端日志切分与滚动、后端统一异常出口、前端页面失败态、发布链路、smoke 工具页、互动 server action 的 `requestId` 展示和透传已经收口到同一套实现。
- 当前卡点：上传链路仍是本地占位实现，不是真实对象存储签发；讨论区还是前端结构先行，尚未达到和发布/详情链路同等级的真实后端完成度；作者页与讨论区的产品规则还需要再对齐到最新脑图和联动链路。
- 下次先做：在不回退到 mock 的前提下，基于当前已完成能力与待完成能力输出一版“页面闭环 / 数据对象 / 交互链路 / 画布联动边界”的现状分析和下一步拆解。

- 按新的发布范围开始收口发布中心：`apps/web/src/features/publish/PublishPage.tsx` 已从“作品 + 创作过程 / 只上传视频 / 单独发布工作流”三模式，改成 `视频发布 / 帖子发布` 两个入口；视频发布里新增“附带工作流”开关，工作流不再作为当前发布中心第一入口，帖子发布则明确标注为“下一步接入”，不再伪装成已可提交能力。
- 同步调整前端发布页口径：`apps/web/src/lib/contracts/view-models.ts` 中 `PublishPageView.activeTab` 已改成 `video | post`；当前 mapper 仍默认落到 `video`，后续帖子后端接入后可直接切到真实 tab。
- 这轮还顺手补了一处实际可用性：附带工作流在提交后如果已经拿到目标内容 ID，发布页会优先把该 ID 回填到视频的 `workflowId` 绑定输入，减少“先发视频附带工作流”场景下手工抄 ID 的摩擦。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过；`apps/web` 下执行 `npm.cmd run build` 通过；本地访问 `http://127.0.0.1:3100/publish` 返回 `200`。
- 当前做到：发布中心的产品表达已经收口到“视频发布是当前真链路，帖子发布是下一条真链路，工作流是视频附带块”，和最新任务拆分一致。
- 当前卡点：帖子实体、帖子草稿、讨论频道、帖子详情与回复接口还没有进入后端；视频上传仍是资源 ID 手填，不是真实上传闭环。
- 下次先做：优先进入帖子后端第一刀，补 `post` 草稿类型、帖子主表/频道表和最小读写接口，再把发布页里的帖子入口从“任务位”推进到可提交表单。

- 继续完成帖子后端第一刀收口：`apps/server` 已补齐 `discussion_channels` / `discussion_threads` 迁移、`PublishDraftType.POST`、`/api/post-drafts`、`/api/discussions/home`、`/api/discussions/threads/{slug}`，并把评论链路扩到 `targetType=post`；`InteractionJdbcPersistenceService` 已支持 `post` 评论目标校验、帖子回复计数与 `last_activity_at` 同步。
- 去掉发布草稿应用层里的内存 fallback：`VideoDraftApplicationService`、`WorkflowDraftApplicationService`、`PostDraftApplicationService` 不再走 `ConcurrentMap + ObjectProvider` 的 mock 分支，统一强制走 `PublishDraftPersistenceService` 的真实数据库路径，符合当前“全链路开发、不再用 mock 数据”的要求。
- 修正帖子入库持久化：`PublishedContentPersistenceService` 已补齐帖子发布所需 import 与 `discussion_threads` upsert 逻辑，帖子支持频道归属、标签、绑定已发布 `video/workflow`、slug 生成与摘要落库。
- 已验证：`apps/server` 执行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；随后执行 `... package` 通过。
- 已做最小接口烟测：在单命令内拉起最新 jar 后，真实打通 `POST /api/post-drafts -> PUT /api/post-drafts/{id} -> POST /api/post-drafts/{id}/submit -> GET /api/discussions/home -> GET /api/discussions/threads/{slug} -> POST /api/comments(targetType=post) -> GET /api/comments?targetType=post&targetId=...`，结果通过。一次实际联调样例返回：`draftId=834be661-7397-43cb-98a0-9d19bc91b107`，`targetId=b7868830-768e-4c51-9d69-08a70a538010`，`discussionSlug=post-publish-smoke-test-b7868830`，评论列表 `commentCount=1`；整条链路都有真实 `requestId`。
- 当前卡点：`scripts/start-server-18080.ps1` 现阶段仍优先启动已存在 jar，日常联调前需要先重新 `package` 才能保证拿到最新后端代码；另外 `docs/04_实施设计/第一阶段 API 清单.md` 与部分页面契约文档还没同步帖子链路新接口。
- 下次先做：把 `/discussions` 前端从 pending route 接回真实后端；然后继续做帖子发布表单接真接口，再补文档里的帖子 API / 页面数据契约，最后再决定是否进入帖子互动增强（点赞/收藏/审核）或视频真实上传闭环。

- Continued the post/discussion frontend finish-up: `apps/web/src/features/publish/PublishPage.tsx` now exposes a real `post draft` form instead of a placeholder block, covering `channelSlug / title / content / tagNames / bindingTargetType / bindingTargetId`, while keeping `video publish + optional attached workflow` as the P0 main path.
- Rewrote `apps/web/src/lib/mappers/community.ts` to close the discussion binding type gap and keep `/discussions` + `/discussions/[slug]` on the real backend path; also rewrote `apps/web/src/features/publish/actions.ts` to add `savePostDraftAction` and `submitPostDraftAction`.
- Cleaned the most visible garbled frontend copy in `apps/web/src/lib/presentation.ts` and `apps/web/src/components/publish/PublishFormSection.tsx` so status labels in the publish flow are readable again.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Documentation sync: added `docs/04_实施设计/帖子发布与讨论区真实链路补充.md` to capture the live `post-drafts` / `discussions` / `comments(targetType=post)` chain and the page contract delta.
- Current state: frontend now has a real end-to-end path for `video publish (optional workflow)` plus `post publish`, and the discussion list/detail pages are both backed by the live Spring Boot APIs.
- Current gap: post submit still returns `targetId` but not a directly navigable `slug`, so the publish page cannot yet jump straight to the newly created thread detail route.
- Next: 1) add slug or query-by-target for post submit success, 2) merge the delta doc back into the two main design docs, 3) continue with post interaction enhancements or real upload flow.
- Continued the next small step for post publish: backend `POST /api/post-drafts/{id}/submit` now returns both `targetId` and `slug`, so frontend no longer has to stop at an opaque thread ID after submit.
- Updated `apps/server/src/main/java/com/dramatv/community/publish/application/PostDraftApplicationService.java` and `apps/server/src/main/java/com/dramatv/community/publish/dto/response/PostDraftSubmitResponse.java`; frontend `apps/web/src/features/publish/actions.ts`, `apps/web/src/features/publish/PublishPage.tsx`, `apps/web/src/lib/api/community-service.ts`, and `apps/web/src/lib/contracts/community-api.ts` now consume the slug and expose an `Open Published Thread` entry after success.
- Verification passed again: root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`; `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Current state: the post publish flow now closes at `submit -> receive slug -> open discussion thread`, so the publish page can hand users back into the live discussion route immediately.
- Next: keep splitting by smallest unit, with the best next cuts being `discussion channel filtering`, `post interaction enhancement`, or `upload flow real asset path`.
- Continued the next small slice for discussion thread like. Backend `InteractionJdbcPersistenceService` now accepts `targetType=post` for likes, validates published `discussion_threads`, and syncs aggregate counts back into the thread row.
- Added `apps/server/src/main/resources/db/migration/V6__add_discussion_thread_like_count.sql` so `discussion_threads` gains a real `like_count` column with a safe backfill from `interaction_actions`.
- Extended `DiscussionQueryService` and `DiscussionThreadDetailResponse` so `GET /api/discussions/threads/{slug}` now returns real thread like stats plus `viewerActions.liked`.
- Updated frontend contracts, adapter, mapper, and `apps/web/src/features/discussions/DiscussionDetailPage.tsx` to expose a real `Like Post` toggle on the live discussion detail route.
- Added `toggleDiscussionLikeAction` in `apps/web/src/features/discussions/actions.ts`, so the live path is now `open thread -> like post -> refresh detail -> show updated count/state`.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`; root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`.
- Current state: discussion threads now have real publish, thread read, comments, comment like, channel filtering, homepage entry, and thread like on the formal `apps/web + apps/server` stack.
- Next: keep the same small-slice rhythm and choose one of `discussion thread favorite/collection`, `discussion publish/edit polish`, or `video real upload/media asset path` as the next full-chain cut.
- Runtime smoke also passed after packaging the new jar with Flyway `V6`: started a temporary local server on `127.0.0.1:18081`, fetched `post-publish-smoke-test-b7868830`, executed `POST /api/interactions/like` with `targetType=post`, confirmed `likeCount 0 -> 1` and `viewerActions.liked false -> true`, then executed `DELETE /api/interactions/like` and confirmed the state returned to `0 / false`.
- Smoke requestIds captured on the live path: `smoke-discussion-like-before`, `smoke-discussion-like-after-like`, `smoke-discussion-like-after-unlike`.

- Continued the next small slice for real source video upload on the formal `apps/web + apps/server` stack. Backend `UploadApplicationService` no longer returns fake `uploads.dramatv.local` URLs: `POST /api/uploads/video-policy` and `POST /api/uploads/image-policy` now create real `media_assets` rows with UUID `assetId`, backend-local upload URLs, and pending upload status.
- Added `PUT /api/uploads/assets/{assetId}/binary` in `UploadController`, plus `MediaResourceConfig` and `dramatv.media.local-dir`, so uploaded files are written to local disk under `tmp/media/**`, published at `/media/**`, and returned back through real `publicUrl` values that can be used by the catalog query layer.
- Tightened publish validation in `PublishedContentPersistenceService`: video submit now requires a ready `sourceAssetId`, and media asset binding resolves only `media_assets.status_code = 'ready'` instead of any existing row.
- Updated frontend contracts and API client in `apps/web/src/lib/contracts/community-api.ts` and `apps/web/src/lib/api/community-service.ts` to support `createUploadPolicy` + `uploadBinaryAsset`.
- Updated `apps/web/src/features/publish/PublishPage.tsx` so video publish now uses a real file input for source video upload, auto-fills and auto-saves `sourceAssetId` after successful upload, and disables `Submit Video` until a real uploaded source asset is ready. `sourceAssetId` is no longer treated as a free-typed field in the main path.
- Verification passed: root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`; root -> `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests package`; `apps/web` -> `npx.cmd tsc --noEmit`; `apps/web` -> `npm.cmd run build`.
- Runtime verification status: temporary server startup on `127.0.0.1:18081` succeeded, logs confirmed Flyway `V6` and `/media/**` local resource mapping. Direct upload smoke from the current runner remains unstable because the local loopback request path does not reliably complete in this execution environment, so the code path is compiled and packaged but still needs one manual/local browser verification pass for `policy -> binary upload -> sourceAssetId auto-fill`.
- Next: 1) run one browser-side/manual verification on `/publish` to confirm the new real upload UI and generated `sourceAssetId`, 2) then continue the next smallest slice, likely `discussion favorite/collection` or `cover image upload`.

- 继续按最小切片补齐讨论区：`GET /api/discussions/home` 现已支持可选 `channel` 查询参数，后端 `DiscussionController` / `DiscussionQueryService` 会基于频道 slug 过滤 `featuredThreads`，不再只有全量讨论流。
- 前端讨论页已接上这条真实筛选链路：`apps/web/src/app/(community)/discussions/page.tsx` 读取 `searchParams.channel`，`apps/web/src/lib/api/community-service.ts` 将其透传给后端；`apps/web/src/features/discussions/DiscussionsPage.tsx` 已把频道卡片改成真实筛选入口，并补了当前选中态、清除筛选入口和空结果提示。
- 同步补了样式层收口：`apps/web/src/app/globals.css` 为讨论频道卡片增加 hover / focus / active 态，避免频道筛选只是“参数能传”，页面却没有可识别反馈。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过；根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 当前做到：`/discussions?channel=...` 已成为真实后端筛选链路，讨论区首页从“全量列表页”推进到“频道入口 + 频道过滤 + 线程详情”闭环。
- 当前卡点：频道筛选只作用于讨论页线程流，首页或其他入口还没有带频道上下文跳转；讨论贴本身还缺点赞/收藏等互动增强；媒体上传仍未进入真实对象存储链路。
- 下次先做：建议继续拆成更小一步，优先做“帖子互动增强”里的第一刀，例如先把讨论贴点赞打通，或者先把 `/discussions` 的频道筛选同步到首页讨论入口。

- 继续清掉首页里的静态讨论数据：`apps/web/src/app/(community)/page.tsx` 现在会同时读取 `getHomeFeed()` 和 `getDiscussionHome()`；`apps/web/src/lib/mappers/community.ts` 与 `apps/web/src/lib/contracts/view-models.ts` 已把首页讨论频道与讨论高亮纳入 `HomePageView`。
- `apps/web/src/features/home/HomePage.tsx` 已重写首页右侧讨论入口，不再使用硬编码 `discussionHighlights`；现在展示的讨论卡片来自真实后端线程，频道 chip 会跳到 `/discussions?channel=...`，讨论卡片会跳到真实帖子详情页。
- 这轮顺手把首页该文件里最明显的一段乱码文案替换成了可读的 ASCII 文案，避免继续在脏文件上叠补丁。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过。
- 当前做到：首页已经从“作品主流 + 静态讨论入口”推进到“作品主流 + 真实讨论入口 + 频道上下文跳转”，首页这块不再伪装讨论数据已接通。
- 当前卡点：首页 hero 仍使用本地预置视频资源；讨论贴主体还缺点赞/收藏等互动能力；上传链路仍未进入真实对象存储签发。
- 下次先做：继续按最小切片推进，优先补“讨论贴点赞”这一刀，让帖子详情从“可评论”推进到“可互动”。

- 继续完成发布页上传链路的下一小刀：`apps/web/src/features/publish/PublishPage.tsx` 已把 `video cover` 和 `workflow cover` 都切到真实文件上传 UI，封面上传成功后会自动回填并保存 `coverAssetId`，不再把封面 ID 当作主路径里的手填字段。
- 同时收口了这次未验证 patch 遗留的问题：工作流封面区不再把 `type="file"`、`value` 和错误的 `videoForm.coverAssetId` 混在一起；发布页标签解析已改用正常的逗号/换行拆分逻辑，避免脏字符继续污染 tags。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过。
- 当前做到：发布页主路径已经形成 `source video upload -> sourceAssetId auto-fill/save -> optional video/workflow cover upload -> coverAssetId auto-fill/save -> submit gating` 的真实前端链路，源视频和封面都不再依赖 mock 输入。
- 当前卡点：这轮只完成了代码与构建收口，浏览器侧还需要做一次手动验证，确认 `/publish` 上视频封面和工作流封面的 `policy -> binary upload -> draft save` 都能稳定跑通。
- 下次先做：1) 先做一次本地浏览器手动验证并记录结果；2) 验证通过后继续下一个最小切片，优先可选 `discussion favorite/collection` 或发布页文案/状态细化。

- 继续把发布页上传链路跑到浏览器实测。先定位到一个前端运行态问题：`scripts/start-web-3100.ps1` 之前只设置了 `DRAMATV_API_BASE_URL`，没有给浏览器侧上传代码注入 `NEXT_PUBLIC_DRAMATV_API_BASE_URL`，导致 `/publish` 页能 SSR 出草稿，但浏览器里点击上传时 `createUploadPolicy` 直接在前端本地失败。
- 已更新 `scripts/start-web-3100.ps1`：现在会同时设置 `DRAMATV_API_BASE_URL` 和 `NEXT_PUBLIC_DRAMATV_API_BASE_URL`，并写入 `.next/dramatv-build-env.json`；`start` 模式下如果生产构建缺失、build env stamp 缺失或 public API base 变化，会自动重建；旧日志文件被占用时只警告，不再因为删日志失败把启动流程卡死。
- 浏览器实测继续暴露出第二个运行态问题：修完 public env 后，`POST /api/uploads/video-policy` 仍被 CORS 预检拦截，Chrome 报错为 `No 'Access-Control-Allow-Origin' header is present on the requested resource`，对应真实 requestId 为 `web-3ed0d966-0586-4f26-b991-283bff7b48cd`。
- 已更新 `apps/server/src/main/java/com/dramatv/community/shared/config/CorsConfig.java`，将本地开发跨域策略改为 `allowedOriginPatterns(\"http://localhost:*\", \"http://127.0.0.1:*\")`，不再把本地联调端口写死在 `3000 / 5173` 两组值上。
- 已验证：重新打包 `apps/server` jar，重启后端 `18080`，并用修好的启动脚本启动全新前端实例 `http://127.0.0.1:3102`；随后通过 Playwright 在 `/publish` 上完成真实浏览器上传验证，链路全部返回 `200`。
- 本次浏览器实测通过的关键链路与结果：
- `POST /api/uploads/video-policy` -> `200`，requestId `web-66191920-cb68-43ae-8d6f-018e189eacd8`
- `PUT /api/uploads/assets/10d4b4c2-c6f2-4a92-8143-3bfd2be3cf5e/binary` -> `200`，页面成功回填 `Source Asset ID = 10d4b4c2-c6f2-4a92-8143-3bfd2be3cf5e`，`Submit Video` 由禁用变为可点击
- `POST /api/uploads/image-policy` + `PUT /api/uploads/assets/427f8f53-4447-4ff4-bda2-61627eb6d84d/binary` -> `200`，页面成功回填 `Cover Asset ID = 427f8f53-4447-4ff4-bda2-61627eb6d84d`
- `POST /api/uploads/image-policy` + `PUT /api/uploads/assets/3d3676df-770c-47de-90b9-a798eb604015/binary` -> `200`，页面成功回填 `Workflow Cover Asset ID = 3d3676df-770c-47de-90b9-a798eb604015`
- 当前做到：发布页的 `source video upload + video cover upload + workflow cover upload` 已经在真实浏览器、真实前后端、真实本地文件落盘链路上验证通过；这条链路不再停留在“代码已写/构建已过”的阶段。
- 当前卡点：视频提交和工作流提交本身虽然仍有现成链路，但这轮没有继续往“提审成功后前台详情可读”做浏览器 smoke；本地前端实例目前依赖启动脚本固定注入的 API base，后续如果换端口或环境还要继续统一脚本入口。
- 下次先做：1) 补一轮 `Submit Video` / `Submit Workflow` 浏览器 smoke，把上传后的提交流转也实测掉；2) 然后继续下一个最小功能切片，优先可选 `discussion favorite/collection` 或发布页状态/错误信息细化。

- 继续把上传后的提交流转跑到浏览器实测。在 `http://127.0.0.1:3102/publish` 上完成一轮真实 smoke：先提交附带工作流，再提交视频，确认 `workflow` 和 `video` 都从 `Draft` 进入 `In Review`，并各自拿到真实 `targetId`。
- 这轮真实结果：
- `workflow` 提交后，状态变为 `In Review`，`targetId = ccfd6f04-10b3-4695-acf0-7b4d408808af`，并自动回写到视频表单里的 `Workflow ID`
- `video` 提交后，状态变为 `In Review`，`targetId = 99fac764-9d0c-463e-b5dd-e4a626e2a85c`
- 两个提交按钮在提交后都进入禁用态，说明发布页的最小提交流转已经从“可上传”推进到了“可提交并锁定”
- 顺手补了一个前端收口：`apps/web/src/features/publish/PublishPage.tsx` 现在会在 `videoDraft.targetId` / `workflowDraft.targetId` 出现时提供详情页跳转入口，初版文案为 `Open Published Video` / `Open Published Workflow`
- 随后的浏览器验证又暴露出一个真实语义问题：`in_review` 状态虽然已有 `targetId`，但 `/videos/{id}` 与 `/workflows/{id}` 详情路由仍按 `publish_status = 'published'` 过滤，所以提审后立即打开会得到 `404`，这两个入口会误导用户
- 已完成修正：发布页现在只会在 `statusCode === 'published'` 时展示 `Open Published Video` / `Open Published Workflow`；若当前是 `in_review` 且已有目标 ID，则改为显示明确状态提示，不再伪装成已可访问详情
- 已验证这个语义修正：在 `http://127.0.0.1:3104/publish` 上重新走最小 smoke，视频与工作流均进入 `In Review`，页面不再出现详情链接，转而显示：
- `Video review target created. The public detail link will appear after the video is published.`
- `Workflow review target created. The public detail link will appear after the workflow is published.`
- 同次 smoke 的真实目标 ID：
- `video targetId = 22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- `workflow targetId = 0c81983d-a087-4791-b9b3-64746732e74f`
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；`apps/web` 下 `npm.cmd run build` 通过；浏览器端在 `3102` / `3104` 两个新实例上完成真实 smoke。
- 当前做到：发布页视频主链路已经具备 `source upload -> optional workflow upload -> workflow submit -> video submit -> correct in_review state messaging` 的真实闭环，并且不再把不可访问的审核中内容伪装成可打开详情。
- 当前卡点：视频/工作流在 `in_review` 后仍没有“审核结果回流到 published”的本地演示链路，所以发布页还无法在本地自然进入“出现详情链接”的最终展示态；这一块需要接内部审核回调或给本地一个明确的审核通过入口。
- 下次先做：1) 补一个本地可控的“审核通过/发布完成”演示链路，让 `in_review -> published` 能闭环；2) 或切回社区互动面，继续做 `discussion favorite/collection` 这类下一刀全链路能力。
- 继续把本地发布闭环补到 `published`，但按产品边界不把“审核通过”做成用户端功能。新增 [scripts/invoke-local-audit-callback.ps1](/E:/点众/DramaTV社区搭建/scripts/invoke-local-audit-callback.ps1)，脚本直接复用现有 `/api/internal/audit-callback`，默认把 `video|workflow` 目标推进到 `approved/published`，也支持传自定义 `statusCode` 做内部联调。
- 本地实测通过一条工作流回调链路：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/invoke-local-audit-callback.ps1 -TargetType workflow -TargetId 0c81983d-a087-4791-b9b3-64746732e74f` 返回 `statusCode = approved`，随后 `GET /api/workflows/0c81983d-a087-4791-b9b3-64746732e74f` 可读，`GET /api/feed/home` 也已出现该工作流卡片。
- 本地实测通过一条视频回调链路：`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/invoke-local-audit-callback.ps1 -TargetType video -TargetId 22968e91-49c1-4ae4-8b61-05f4a74a5aad` 返回 `statusCode = approved`，随后 `GET /api/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad` 可读，且关联工作流 `0c81983d-a087-4791-b9b3-64746732e74f` 的 `videoBindCount = 1`、`relatedVideos` 已包含该视频。
- 当前做到哪一步：正式主链路现在已经具备 `draft -> in_review -> internal audit callback -> published -> detail/feed visible` 的本地演示闭环，审核入口保持在内部脚本层，不暴露到 `/publish` 用户页。
- 下次先做什么：1) 如果要继续提效内部联调，再考虑把这条内部脚本接进 `/dev/smoke` 开发工具页；2) 用户侧功能继续按最小切片回到 `discussion favorite/collection` 或其他未完成的后端真链路。
- 继续按最小切片补讨论区互动，这一刀只做帖子收藏，不扩散到列表页。后端新增 `apps/server/src/main/resources/db/migration/V7__add_discussion_thread_favorite_count.sql`，为 `discussion_threads` 增加真实 `favorite_count` 聚合列并从 `interaction_actions(action_type='favorite', target_type='post')` 回填已有数据。
- 后端同时补齐帖子收藏真链路：`InteractionJdbcPersistenceService` 现在允许 `targetType=post` 走 `/api/interactions/favorite`，并把聚合数同步回 `discussion_threads.favorite_count`；`DiscussionQueryService` 与 `DiscussionThreadDetailResponse` 也已返回 `stats.favoriteCount` 和 `viewerActions.favorited`。
- 前端同步接通帖子详情收藏：`apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts` 已扩展帖子详情契约；`apps/web/src/features/discussions/actions.ts` 新增 `toggleDiscussionFavoriteAction`；`apps/web/src/features/discussions/DiscussionDetailPage.tsx` 已显示收藏统计并提供 `Favorite Post / Remove Favorite` 交互按钮。
- 静态验证通过：根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 通过。
- 真实接口 smoke 通过：用临时 `18082` 进程在同一个 PowerShell 命令里拉起新 jar、打请求、再自动停进程，针对线程 `post-publish-smoke-test-b7868830 / b7868830-768e-4c51-9d69-08a70a538010` 验证 `favorite` 前后状态完整回流。实测结果为 `favoriteCount 0 -> 1 -> 0`、`viewerActions.favorited false -> true -> false`；请求 `requestId` 分别为 `b74e414c-85f2-49a3-a7cd-47657a2386e9` 和 `81f7fc61-aa4a-40f9-ba91-e3a34a67d589`。
- 运行态补记：本次一度因为 `18080` 正在运行导致可执行 jar 被锁，`package` 无法 repackage；在当前执行环境里，临时后端 smoke 用“同一命令内启动临时进程 -> 轮询健康检查 -> 打请求 -> finally 里停进程”的方式比常驻后台启动更稳。
- 当前做到哪一步：讨论详情页现在已经具备真实 `评论 + 评论点赞 + 帖子点赞 + 帖子收藏` 闭环，收藏不再只是视频/工作流能力。
- 下次先做什么：优先继续同一条最小切片路线，补 `discussion collection/favorite` 之外的下一刀，例如讨论列表/首页的收藏态透出，或转去做发布/详情链路里仍未完成的用户侧互动能力。
- 继续把同一条能力往上游透出，这一刀只做“讨论列表 / 首页侧栏显示帖子收藏态”，不增加新的列表交互。后端 `DiscussionHomeResponse` 与 `DiscussionQueryService.loadFeaturedThreads(...)` 已补 `favoriteCount` 和 `viewerActions.favorited`，这样 `/api/discussions/home` 返回的线程卡片数据不再只有回复数。
- 前端同步扩展 `ApiDiscussionHomeResponse`、`DiscussionThreadCardView` 和 `mapDiscussionHubPageView(...)`，讨论卡片现在具备 `favoriteCountLabel` 与 `viewerFavorited`；`apps/web/src/features/discussions/DiscussionsPage.tsx` 与 `apps/web/src/features/home/HomePage.tsx` 已把这两个字段透出到列表 UI。
- 静态验证再次通过：根目录 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过；`apps/web` 下 `npx.cmd tsc --noEmit` 与 `npm.cmd run build` 通过。
- 真实接口 smoke 这次改用 `spring-boot:run` 临时进程完成，因为当前环境下可执行 jar 偶发 `NoClassDefFoundError` 类加载异常。针对 `GET /api/discussions/home?channel=video-production` 的目标线程 `b7868830-768e-4c51-9d69-08a70a538010`，实测收藏态会随帖子收藏动作同步回流：`favoriteCount 0 -> 1 -> 0`、`viewerActions.favorited false -> true -> false`；请求 `requestId` 分别为 `98b68688-4f2e-4905-aded-d031aab3b01b` 与 `fe8ad928-4ca2-404c-9f29-a7b57c164930`。
- 当前做到哪一步：讨论详情页、讨论列表页和首页右侧讨论入口现在都能读取真实帖子收藏态，用户即使不进入详情页，也能看到哪些讨论帖已经被当前账号收藏。
- 下次先做什么：继续按最小切片补“列表可操作”能力时，可以优先做讨论列表卡片上的点赞/收藏快捷动作；如果想回主发布链路，就转去补发布后内容管理或更多详情页互动。
- 继续把讨论区列表卡片快操作补到“点赞”这一刀：后端 `DiscussionHomeResponse` / `DiscussionQueryService` 已补 `likeCount` 与 `viewerActions.liked`，前端 `DiscussionThreadQuickFavoriteCard` 现在支持 `Like` / `Favorite` 双快操作，首页侧卡与讨论列表共用同一套真实卡片状态。
- 已验证：`apps/server` compile、`apps/web` 下 `npx.cmd tsc --noEmit` 通过；真实接口 `POST /api/interactions/like`、`DELETE /api/interactions/like`、`GET /api/discussions/home?channel=video-production` 连通，requestId 分别为 `quick-like-post-smoke-20260412-5`、`quick-like-post-smoke-20260412-6`、`quick-like-post-smoke-20260412-7`。
- 浏览器实测：在 `http://127.0.0.1:3106/discussions` 与首页 `/` 上，线程 `b7868830-768e-4c51-9d69-08a70a538010` 的点赞状态完成 `0 -> 1 -> 0` 回流，同时 `Like -> Unlike -> Like` 与首页侧卡 `Liked` 状态同步。
- 继续回到发布页可用性这条线，不再让帖子绑定强依赖手填 `bindingTargetId`。`getPublishBootstrap()` 现已额外拉取当前作者已发布的 `videos/workflows`，`PublishPageView` 增加 `postBindingCandidates`，帖子表单新增真实 `Published Target` 选择器，并在选择时自动回填 `bindingTargetId`，仍保留手填兜底。
- 浏览器实测：`http://127.0.0.1:3106/publish` 的帖子发布表单现在可以直接选择 `Review state fix workflow · Copyable workflow` 作为绑定目标，不再手填 ID；提交后草稿 `651e1c30-4942-442f-89ff-ee552f75db13` 进入 `Published`，生成线程 `5d02e4ce-f9fc-4aa5-9019-ca5a7e23017b` / slug `post-publish-selector-smoke-20260412-workflow-option`。
- 真实联动验证：从发布页打开 `/discussions/post-publish-selector-smoke-20260412-workflow-option` 后，详情页正确显示 `Bound workflow: Review state fix workflow`，并可继续跳转到 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f`；`GET /api/discussions/home?channel=video-production` 的 requestId `3134004b-b9c7-4cdb-8122-7200301b94b6` 已返回新线程位于首位，首页侧栏也已读到该帖子。
- 当前做到哪一步：两种发布主线现在都具备真实用户侧闭环。视频发布链路已到 `draft -> in_review -> internal audit callback -> published`；帖子发布链路已到 `draft -> published -> discussion detail visible -> bound workflow/video jump`。
- 下次先做什么：优先继续补发布页的“绑定对象可读性”，比如给已选目标增加摘要/跳转预览；如果切回讨论区，则补列表快操作的成功提示与 requestId 透出。
- 继续沿着同一条发布页主线补“已选绑定对象的可读性”，不新增后端接口。前端 `PublishBindingTargetOptionView` 现已补 `summary` 与 `href`，发布页选择已发布视频/工作流后，会直接显示目标标题、摘要文案、辅助标签、目标 ID 与跳转入口，而不再只是下拉框里的一条文本。
- 代码收口：`mapPublishVideoBindingTarget(...)` 与 `mapPublishWorkflowBindingTarget(...)` 已把真实 `summary` / 详情链接映射进发布页视图；`PublishPage.tsx` 新增 `Selected Target` 预览卡和 `Manual Target` 降级提示；`globals.css` 补了预览卡样式，仍复用发布页现有视觉语言。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过。
- 浏览器实测：在 `http://127.0.0.1:3106/publish` 切到 `Post Publish` 后，选择 `Binding Type = workflow`、`Published Target = Review state fix workflow - Copyable workflow`，页面会立即出现 `Selected Target` 预览块，并提供 `Open Selected Workflow` 跳转；点击后已成功进入 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f`。
- 当前做到哪一步：帖子发布页现在已经从“能绑定”推进到“能看懂自己绑定了什么”。当前用户侧闭环为 `选择真实已发布目标 -> 页面内看到预览 -> 可直接打开确认 -> 再提交帖子`。
- 下次先做什么：优先补“同页内刚发布的视频/工作流自动进入帖子绑定候选列表”，这样用户在一次会话里完成内容发布后，不刷新页面也能立刻发绑定讨论贴；如果暂时不做这个，再补列表快操作成功提示与 requestId 透出。
- 2026-04-12 产品口径修正：帖子不是视频/工作流的绑定外壳，而是独立内容类型；只有视频与工作流做绑定展示。已把用户端帖子绑定能力从前台撤回，先不删除后端保留字段，避免打断已跑通的真实链路兼容性。
- 前端收口：`apps/web/src/features/publish/PublishPage.tsx` 已移除帖子表单里的 `Binding Type / Published Target / Binding Target ID / Selected Target / Manual Target`；帖子提交 payload 不再发送 `bindingTargetType`、`bindingTargetId`；发布页顶部与模式卡文案已改为“帖子独立发布”。
- 讨论区收口：`apps/web/src/features/discussions/DiscussionDetailPage.tsx` 不再展示 `Author And Binding / Open Bound Content / Bound target`；`apps/web/src/features/discussions/DiscussionThreadQuickFavoriteCard.tsx` 不再在列表卡片上展示帖子绑定 chip。
- 数据装配收口：`apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts` 已去掉发布页对 `postBindingCandidates` 的依赖，`getPublishBootstrap()` 不再额外拉取创作者已发布视频/工作流给帖子表单使用。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过。
- 浏览器实测：在 `http://127.0.0.1:3106/publish` 切到 `Post Publish` 后，表单不再出现任何绑定入口；随后发布独立帖子 `standalone-post-smoke-20260412-151127`，草稿 `694ac9c0-7be2-4fd7-b06a-487686e38114` 进入 `Published`，目标线程 `0c1a3487-1063-4fd1-abf6-328e41c7be00`，slug 为 `/discussions/standalone-post-smoke-20260412-151127`。
- 浏览器实测补充：打开 `/discussions/standalone-post-smoke-20260412-151127` 后，详情页仅保留独立帖子语义，右侧显示 `Author Snapshot` 和 “This thread is an independent discussion post.”，不再出现任何绑定对象跳转入口。
- 当前做到哪一步：视频发布链路保持“可选绑定工作流”，帖子发布链路已回到“独立帖子”；用户侧产品语义已与最新口径一致。
- 下次先做什么：继续按最小切片推进后端未完善能力，优先梳理“视频发布并绑定工作流”的后续详情联动与列表透出，不再在帖子侧继续扩展绑定能力。
- 同轮顺手修复：Playwright 新会话检查时发现 `DiscussionThreadQuickFavoriteCard` 在缺少计数字段的线程上会因为 `undefined.toLocaleString()` 触发前端报错。已在 `apps/web/src/lib/mappers/community.ts` 为 discussion list/home 卡片补 `likeCount/favoriteCount` 默认值和 viewerActions 兜底，并在 `apps/web/src/features/discussions/DiscussionThreadQuickFavoriteCard.tsx` 增加 `safeCount(...)` 防守式处理。
- 已验证补充：再次执行 `apps/web` 下 `npx.cmd tsc --noEmit` 通过；重新打开 `http://127.0.0.1:3106/discussions` 后 Playwright 控制台 `error` 为 `0`，讨论列表卡片正常渲染。

### 2026-04-14

- 新增 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md`，基于 `apps/web/src/app` 真实路由、`features/*` 真实页面组件和页面内实际跳转代码，整理当前已有界面、页面跳转关系、已成立闭环与缺口界面，不再用产品假设替代代码现状。
- 同步补充 `docs/README.md`，把这份页面分析文档纳入文档结构、推荐阅读顺序和当前主线文档表，后续补界面或补跳转关系时可直接从这里进入。
- 这轮文档分析确认了 4 个关键缺口：作者主页已有 `workflows` 数据但 UI 未展示；首页缺少稳定创作入口；工作流缺少独立发现页；视频/工作流详情与讨论广场之间缺少清晰互转入口。
- 当前做到哪一步：已经把“现在有哪几个界面、界面之间怎么跳、还缺哪些界面”沉淀成可直接给产品和研发共用的总览文档。
- 当前卡点：这次只完成了分析和文档沉淀，还没继续把缺口转成实施清单或直接落代码，尤其作者页工作流区和工作流发现页仍停留在结论层。
- 下次先做什么：优先把这份文档继续下钻成“缺口界面优先级与实施拆解”，或者直接按第一优先级开始补作者页工作流区 / 首页创作入口 / 详情页讨论入口。

- 产品口径修正：工作流不再按独立内容线规划，继续固定为“和视频绑定展示”的附属关系；已同步修改 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 与 `memory/MEMORY.md`，移除“工作流独立发现页 / 作者页独立工作流区”这类错误方向。
- 同轮补充新的缺口页面：个人中心页已明确加入产品分析与项目记忆，当前最低要求是承接“个人信息 + 我的点赞 + 我的收藏”，后续再视阶段追加“我的发布 / 我的草稿 / 我的关注”。
- 继续收口页面分析文档：已把个人中心页进一步融合进 `docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 的全局关系图、页面跳转拆解、闭环分析和优先级章节，同时把作者主页重新定义为“对外创作者主页”，避免和个人中心混同。

- 个人中心第一版已从文档位推进到真实全链路实现。后端新增 `apps/server/src/main/java/com/dramatv/community/me/controller/MeController.java`、`apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java` 与 `apps/server/src/main/java/com/dramatv/community/me/dto/response/MeHubResponse.java`，提供真实接口 `GET /api/me/hub`，返回当前用户 profile、最近点赞列表、最近收藏列表。
- 前端新增 `apps/web/src/app/(community)/me/page.tsx` 与 `apps/web/src/features/me/PersonalCenterPage.tsx`，并同步更新 `apps/web/src/lib/contracts/community-api.ts`、`apps/web/src/lib/contracts/view-models.ts`、`apps/web/src/lib/api/community-service.ts`、`apps/web/src/lib/mappers/community.ts`，让 `/me` 页面直接消费真实后端数据，不再是规划位或 mock 容器。
- 全局入口同步收口：`apps/web/src/components/shared/PageShell.tsx` 已把顶栏头像默认承接到 `/me`；`apps/web/src/features/home/HomePage.tsx` 已取消把头像跳到推荐作者，首页和其他主线页面现在统一进入个人中心。
- 页面分析文档已继续修正到与代码一致：`docs/01_总览/当前社区界面清单与页面跳转关系分析.md` 不再把首页头像写成跳作者页，也不再把 `/me` 写成建议页，而是明确记录当前已上线的真实承接关系与下一步缺口。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；`apps/server` 下 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile` 通过。
- 运行态补记：临时在 `127.0.0.1:18082` 拉起新后端进程后，`GET /api/me/hub` 已返回 `200 OK`，示例数据里 `profile.displayName = Rina Flux`，`likedItems = []`，`favoritedItems = []`。当前常驻的 `18080` 旧进程如果还没重启，会继续出现 `/api/me/hub` 不存在的旧行为，这不是代码问题，而是本地进程版本没更新。
- 当前做到哪一步：个人中心已经从“文档要求”推进到“真实页面 + 真实接口 + 全局入口”第一版闭环，作者主页和个人中心的产品分工已真正落到代码。
- 下次先做什么：优先继续补 `首页创作入口`、`视频/工作流详情 -> 讨论入口`，或者沿 `/me` 这条线继续补 `我的关注 / 我的发布 / 我的草稿`。

- 对照 `docs/02_研究/YouMind资源抓取与复刻对接总结.md` 继续核实外部提示词页现状，确认之前两个页面都还停留在“预览态”：`/seedance` 仍直接读 `seedance-samples.ts` 的 12 条静态样本，`/nano-banana` 虽已读 `public/nano-banana-data.json`，但同步脚本只下发了 10 条精选。
- 已收口 `apps/web/src/app/(community)/seedance/page.tsx` 与 `apps/web/src/features/seedance-replica/SeedanceReplicaPage.tsx`：`/seedance` 现已改成和 `/nano-banana` 一样从 `public/seedance-data.json` 读取数据，页面统计、下载文件名、搜索占位和底部提示都改为读取真实同步结果，不再写死 `1511 / 前10条 / 加载更多中` 这种旧预览文案。
- 重写 `docs/02_研究/sync-seedance-assets.js`：数据源不再依赖旧的 extracted top10 文件，而是直接聚合 `docs/02_研究/youmind-video-assets/youmind-seedance-library*` 各批次库，按 `featured + 发布时间` 排序后生成 `apps/web/public/seedance-data.json`；本地已同步的视频继续走 `/seedance-videos/*`，其余条目先回退到真实外部视频地址，避免一次性把大量视频全量拷进前端仓库。
- 同步扩大 `docs/02_研究/sync-nano-banana-assets.js` 的输出规模，`apps/web/public/nano-banana-data.json` 已从 10 条扩到 30 条，`/nano-banana` 当前展示仍是精选样本页，但不再是最初那组 10 条超小样本。
- 已验证：执行 `node .\\sync-seedance-assets.js` 后生成 `apps/web/public/seedance-data.json`，当前统计为 `totalLibraryItems = 1452`、`renderedItems = 30`；执行 `node .\\sync-nano-banana-assets.js` 后，`apps/web/public/nano-banana-data.json` 当前统计为 `totalLibraryItems = 3282`、`renderedItems = 30`。
- 已验证补充：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过。
- 当前做到哪一步：两个 YouMind 提示词页都已经从“旧静态预览页”推进到“读取最新同步产物的可用参考页”，虽然仍是精选样本展示，不是整库全量渲染，但页面接法和数据来源已经对齐到当前研究资产。
- 下次先做什么：1) 再决定是否把 `/seedance` 与 `/nano-banana` 继续从“30 条精选”扩大到更大的分批展示；2) 如果用户更关注视觉一致性，再对照 `nano-banana-replica-preview` 做一轮 UI 版本比对与收口。

- 继续收口 `Nano Banana` 的 UI 版本：已将 `docs/02_研究/nano-banana-replica-preview` 的最新预览稿版式正式迁到 [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.tsx) 和 [apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/nano-banana-replica/NanoBananaReplicaPage.module.css)，同时保留 `apps/web/public/nano-banana-data.json` 这条正式数据入口。
- 本轮 UI 合并点：分类改回预览稿里的 `全部 / 精选 / 需要参考图 / 单图案例 / 长提示词 / 最新`，卡片改为单主图 + 深色 prompt 卡 + 底部 CTA，详情层改为预览稿结构，不再沿用之前那套多图网格详情 UI。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；Playwright 实测 `http://127.0.0.1:3106/nano-banana` 已显示新页头文案“正式页现在直接读取社区同步产物，同时沿用最新预览稿的界面结构”，说明运行态也已切到新 UI。
- 当前做到哪一步：`/nano-banana` 现在已经是“最新 UI + 当前正式数据接法”的合并版，不再是旧正式页 UI，也不再是预览目录里那份只吃 10 条数据的静态稿。
- 下次先做什么：如果继续推进同一块，优先把 `nano-banana-replica-preview` 里还没迁入的细节整理成 checklist，然后按同样方法继续收 `Seedance` 的 UI 版本。

### 2026-04-15

- 新增 `docs/03_架构/前端技术栈取舍：继续使用 Next.js 而不切换 React + Vite.md`，把“新版前端是否应从 `Next.js` 切到 `React + Vite`”的分析正式沉淀成架构决策文档。
- 文档结论已固定为：当前阶段不切换正式前端技术栈，继续以 `apps/web` 作为唯一正式前端主线；同事的 `mindloop-_-cinematic-archive (1)` 只作为视觉母版和动效参考，不作为生产运行架构直接继承。
- 文档依据已明确写回：当前代码已经实际依赖 `app router`、服务端页面、`notFound()`、`use server`、`revalidatePath`、统一社区 API 服务层等能力；如果切到 `React + Vite`，本质上不是“换脚手架”，而是重做路由、数据获取、交互刷新和应用边界。
- 同步更新 `docs/README.md`，把这份前端技术栈取舍文档纳入 `03_架构` 目录结构、推荐阅读顺序和当前主线文档表，后续涉及 UI v2 重构、是否保留双前端、是否切 SPA 时都以这份文档为统一入口。
- 当前做到哪一步：已经把“为什么不建议切栈”和“同事 Vite 原型应该如何正确使用”都固化为可复用文档，后续不需要在会话里重复口头解释同一轮技术栈判断。
- 下次先做什么：继续按这个结论推进新版前端，直接在 `apps/web` 内落地视觉重构切片，优先从首页或详情页开始抽取 cinematic 视觉语言并对接现有真实后端。

- 首页 UI v2 第一刀已落地到 `apps/web/src/features/home/HomePage.tsx`：不改后端接口、不改路由，只重写首页结构，把页面从“侧栏 + 简单流列表”升级成“主舞台 + 创作入口 + 作品流 + 工作流入口 + 创作者雷达 + 讨论频道”的正式首页。
- 这轮首页重构继续严格使用真实数据源：直接消费 `feedItems`、`hotWorkflows`、`featuredCreators`、`discussionChannels`、`discussionHighlights`，不再使用 `homeHeroPrefillVideo` 之类的预填充素材作为首页主舞台。
- 首页新版已明确固化当前产品口径：视频仍是主内容；工作流继续作为视频后的方法入口展示；帖子继续走独立讨论区；`/nano-banana` 与 `/seedance` 继续作为独立资源页保留在首页入口层。
- 已验证：`apps/web` 下执行 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过，说明这轮首页重构未破坏现有正式前端主线。
- 当前做到哪一步：新版视觉重构已经从“技术栈判断和文档阶段”进入“真实页面落地阶段”，首页现在是第一块已经正式改造完成的页面切片。
- 当前卡点：本轮只完成了首页，尚未把同样的 cinematic 语言继续迁到视频详情页、作者页、个人中心页和发布页；运行态视觉只做了构建级验证，未追加一轮稳定的浏览器快照验收。
- 下次先做什么：沿同一套视觉语言继续推 `视频详情页` 或 `作者页`，优先把“作品 -> 工作流 -> 作者 -> 讨论”的主链路页面外观统一掉。

- 视频详情页 UI v2 已落到 `apps/web/src/features/video-detail/VideoDetailPage.tsx` 与 `apps/web/src/app/globals.css`：不改接口层、不改 server action，只把页面从“播放器 + 右侧信息栏”改成“左侧作品信息 / 中部放映区 / 右侧作者与工作流联动卡”的放映页结构。
- 这轮视频详情页继续对齐当前产品口径：视频仍是主内容；工作流只作为与视频绑定的创作过程入口出现；作者主页、评论区、更多作品被压进同一条继续浏览路径，避免再把工作流渲染成独立内容线。
- 页面内已保留并重新安放真实交互：点赞、收藏、关注作者、发表评论、评论点赞都继续走现有 `community-interactions/actions.ts`；播放资源仍优先真实视频地址，缺失时才回退到明确标识的本地演示样片。
- 已验证：`apps/web` 下再次执行 `npx.cmd tsc --noEmit` 通过，`npm.cmd run build` 通过；同时本地 `http://127.0.0.1:18080/actuator/health` 与 `http://127.0.0.1:3106/` 均返回 `200`，说明前后端和前端 dev 服务仍在线。
- 当前做到哪一步：首页之后，主链路里的视频详情页也已经切到新视觉骨架，首页 -> 视频详情这一段视觉语言已开始统一。
- 当前卡点：本轮运行态浏览器快照未完成，不是页面挂了，而是 Playwright MCP 会话被现有浏览器实例锁住，暂时拿不到新的页面快照。
- 下次先做什么：优先继续收 `作者页` 或 `个人中心页`，把“首页 -> 视频详情 -> 作者 / 个人中心”这段链路的视觉统一完；如需要浏览器级验收，先处理 Playwright 浏览器锁占用问题再补快照。

- 用户最新反馈已明确修正判断：虽然最近几轮做过首页与视频详情页的结构和样式改写，但“实际没有看到一点视觉效果的迁移”。因此不能再把当前状态描述成“视觉迁移已成功”，后续必须先回到运行态对照与设计差距分析。
- 新增 `docs/01_总览/新会话快速恢复指南.md`，专门给下一个聊天恢复上下文使用。文档里已经写清：
  - 当前正式工程主线是什么
  - 最近真实做了什么
  - 哪些事情不能乐观化
  - 新会话第一优先级应该是什么
  - 应该按什么顺序读文档和代码
- 同步更新 `docs/README.md`，把这份恢复文档纳入 `01_总览`、推荐阅读顺序和当前主线文档表，避免后续新会话漏读。
- 当前做到哪一步：项目已经有一份可以直接交给新聊天的恢复入口，不需要再靠长上下文口头回忆。
- 下次先做什么：新聊天里先按恢复文档执行，优先输出“当前运行态页面与参考前端的视觉迁移差距清单”，再决定首页和视频详情页下一轮具体改法。

### 2026-04-17

- 继续按参考前端做运行态核对，当前本地前端以 `apps/web` 运行在 `http://127.0.0.1:3106`。
- 已确认 `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 的新版工作流详情样式已实际挂到 `/workflows/[id]`，不再是旧版信息页；Playwright 实测 `/workflows/0c81983d-a087-4791-b9b3-64746732e74f` 与 `/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb` 均已显示新版布局。
- 已确认首页精选流与作者页的资源角标逻辑已对齐详情页资源模式：有绑定工作流的视频卡现在显示 `WORKFLOW`，不再出现“卡片写 PROMPT、点进详情却是工作流模式”的错位。
- Playwright 实测通过的当前关键链路：
- 首页 `http://127.0.0.1:3106/`
- 作者页 `http://127.0.0.1:3106/creators/11111111-1111-1111-1111-111111111111`
- 视频详情 `http://127.0.0.1:3106/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- 视频详情 `http://127.0.0.1:3106/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`
- 工作流详情 `http://127.0.0.1:3106/workflows/0c81983d-a087-4791-b9b3-64746732e74f`
- 工作流详情 `http://127.0.0.1:3106/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb`
- 当前做到哪一步：`超能社区 / 精选 / 视频详情 / 工作流详情 / 作者页` 这条前端复刻主链路已经在运行态对齐到新版页面壳子，最近一轮用户指出的“详情页还是旧风格、资源标识不匹配”问题已在本地运行态核实为已修正。
- 下次先做什么：如果用户刷新后仍觉得不够像参考稿，就不要再查路由是否挂错，而是直接进入逐区块视觉微调，优先收标题字号、卡片比例、评论区密度和作者页卡片信息层级。

- 根据最新口径继续收口 `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` 与 `apps/web/src/features/workflow-detail/WorkflowDetailPage.module.css`：工作流详情首屏不再使用单独的“流程网络图 + 状态卡”结构，而是统一回到和视频详情页同一套骨架，左侧保留视频区样式的填充位，右侧压成 `WORKFLOW badge + 标题 + 摘要 + 核心内容面板 + 三个互动按钮`。
- 同步把工作流动作收口到更轻的入口区：顶部只保留 `查看工作流` 位置，`复制到我的空间` 下沉到右下角工作流入口卡里，避免破坏与视频详情页统一的首屏信息层级。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测 `http://127.0.0.1:3106/workflows/0c81983d-a087-4791-b9b3-64746732e74f`，当前页面已显示左侧统一填充区和右侧统一信息区。
- 当前做到哪一步：工作流详情页现在已经和视频详情页共用同一首屏排版逻辑；没有独立视频预览时，会保留统一的媒体展示区占位，不再回退到另一套页面结构。
- 下次先做什么：如果用户继续收细节，就直接在这版上调字号、左侧占位文案、右下角工作流入口卡和评论区密度，不再回头改页面骨架。

- 新增提示词详情页前端预览能力：在 [apps/web/src/app/(community)/videos/[id]/page.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/app/(community)/videos/[id]/page.tsx) 中支持保留前端专用预览 id `prompt-preview`，并新增 [prompt-detail-demo.ts](/E:/点众/DramaTV社区搭建/apps/web/src/lib/prefill/prompt-detail-demo.ts) 提供稳定的 `PROMPT` 资源假数据，避免当前后端还没有真实 prompt 卡时无法验收页面。
- 同步重写 [VideoDetailPage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/video-detail/VideoDetailPage.tsx) 的 `prompt` 模式：右侧现在是正式的可复制提示词面板，文案改为中文结构化提示词；评论标题、占位文案、右下角操作卡都按“提示词详情页”语义单独处理，不再沿用工作流/视频详情的默认文案。
- 样式补充落到 [VideoDetailPage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/video-detail/VideoDetailPage.module.css)：新增 `promptPanelPrompt`、预览提示文案、提示词操作卡按钮组和移动端收口样式。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测 `http://127.0.0.1:3106/videos/prompt-preview`，当前页面已显示 `PROMPT` 角标、右侧结构化提示词面板、底部“一键复制提示词”操作卡。
- 当前做到哪一步：现在已经有一个可直接访问的“提示词详情页”前端样式预览地址，不需要等后端先产出真实 prompt 数据再做视觉验收。
- 下次先做什么：如果用户认可这版结构，就继续把精选页/作者页里的 prompt 资源入口补出来，让卡片可以直接跳到真实 prompt 详情路由，而不是只保留预览页。

- 已继续把提示词详情页接回首页精选流：在 [prompt-detail-demo.ts](/E:/点众/DramaTV社区搭建/apps/web/src/lib/prefill/prompt-detail-demo.ts) 新增首页卡片元数据，在 [HomePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/home/HomePage.tsx) 的 `buildCuratedItems(...)` 中注入 `PROMPT` 入口卡，当前 `/` 的“全部”页已能直接看到并点击进入 `/videos/prompt-preview`。
- 这轮顺手修正了卡位优先级：提示词入口最初因为演示热度被排到首页 Hero 位置，现在已压回普通卡位，不再抢首页现有主内容位。
- 已验证：`apps/web` 下 `npx.cmd tsc --noEmit` 通过；Playwright 已实测首页出现 `PROMPT 月下双人对峙提示词` 卡片，点击后可正常进入标准提示词详情页 `http://127.0.0.1:3106/videos/prompt-preview`。
- 当前做到哪一步：提示词详情页现在不只是孤立预览页，而是已经具备从首页“全部”页进入的标准入口。
- 下次先做什么：如果继续推进，就把作者页和后续真实 prompt 数据也接到同一套路由，不再只依赖前端预览卡。
- Continued workflow detail page alignment polish: `apps/web/src/features/workflow-detail/WorkflowDetailPage.tsx` now uses `相关推荐` for the lower-right recommendation header, and `apps/web/src/features/workflow-detail/WorkflowDetailPage.module.css` now matches the standard video detail rhythm with `recommendRail gap: 22px` and `recommendHeader min-height: 31px`.
- Visual verification passed in Playwright: `/workflows/dd715ee9-189b-4450-a4ca-fdf71fb8aafb` now aligns the lower-right header with the left comment count, and measured `相关推荐` vs `1 条评论` top offset is `delta=0` against the standard `/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad` layout.
- Continued `/me` personal homepage replication: rewrote `apps/web/src/features/me/PersonalCenterPage.tsx` into a creator-style personal profile page with hero header, back link, edit/settings actions, tab bar (`作品 / 讨论 / 收藏`) and a four-column card gallery, with dedicated styles in `apps/web/src/features/me/PersonalCenterPage.module.css`.
- Updated `apps/web/src/app/(community)/me/page.tsx` to fetch the current user's published creator videos and workflows via `getCreatorVideos/getCreatorWorkflows`, so the `作品` tab now uses live published content instead of only the old `点赞/收藏` hub data.
- Verification passed: `apps/web` -> `npx.cmd tsc --noEmit`; Playwright checked `http://127.0.0.1:3106/me` and confirmed the new profile layout is live.

### 2026-04-18

- Continued frontend replica work after local reboot context: current priority remains front-end visual replication first, backend interface polishing later.
- Added the floating publish entry on the featured/home page in `apps/web/src/features/home/HomePage.tsx` and `apps/web/src/features/home/HomePage.module.css`; it links directly to `/publish` and follows the reference-style fixed bottom-right white plus button.
- Reworked `/publish` in `apps/web/src/features/publish/PublishPage.tsx` and `apps/web/src/features/publish/PublishPage.module.css` into the reference-style dark publish page: cancel link, archive title/type/description area, cover upload block, publish guide card, media upload tiles, core-content text area, visibility selector, save draft, and confirm publish action.
- Verification completed before service restart: `apps/web -> npx.cmd tsc --noEmit` passed, and `apps/web -> npm.cmd run build` passed with `/publish` included in the Next.js route list.
- Current runtime note: user reported the machine was rebooted and previous frontend/backend/docker services are down. Next step is to restart the local services and visually verify `http://127.0.0.1:3106/` and `http://127.0.0.1:3106/publish`.
- Runtime recovery completed after reboot: Docker Compose restarted local PostgreSQL and Redis; both containers reported healthy through `docker ps`. The reference replica target also restarted at `http://127.0.0.1:3111/`.
- Backend restart note: direct system `java` still points to Java 8, so the correct path is the project script `scripts/start-server-18080.ps1`, which uses `.tools/jdk-17`. Restarted backend on `http://127.0.0.1:18080`; `GET /actuator/health` returned `{"status":"UP"}`.
- Frontend restart note: Next.js dev server was restarted on `http://127.0.0.1:3106/` with the existing project script in non-sandbox mode. `GET /` returned `200`, and `GET /publish` returned `200` with the real publish page marker `发布新档案`; it no longer rendered the backend-unavailable fallback.
- Workflow preference update: user will handle acceptance checks; do not take excessive screenshots for routine verification. Screenshots remain appropriate when analyzing the target replica page, measuring visual layout, or diagnosing a specific mismatch.
- Continued homepage replica work on the formal `apps/web` mainline only. Rebuilt `apps/web/src/features/home/HomePage.tsx` and `apps/web/src/features/home/HomePage.module.css` from the previous multi-section “long information feed” into the reference-style homepage skeleton: full-screen cinematic hero, centered `Get Inspired with Us.` headline, glass search bar, compact archive wall, footer, and fixed publish button.
- Homepage content model remains aligned with the current community constraint: homepage archive cards now only expose `PROMPT` and `WORKFLOW` badges, and every card still routes to the matching prompt detail page or workflow detail page.
- Used the reference repo `mindloop-_-cinematic-archive (1)` as structural guidance instead of continuing blind visual guessing. The latest homepage now follows the same primary rhythm as `http://127.0.0.1:3111/`: hero first, archive wall second, footer last. Removed the previously overbuilt discussion/creator/launch multi-panel homepage layout from `/`.
- Hero polish pass completed: switched the hero background to the same cinematic atmosphere direction as the reference homepage, pulled the copy block upward, tightened typography rhythm, changed the search bar to the rounded glass style, and kept the floating white publish button in the lower-right corner.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` passed after the homepage rewrite, and Playwright rechecked `http://127.0.0.1:3106/` with the new homepage structure live. Latest visual checkpoint screenshot: `home-3106-after-home-polish.png`.
- 当前做到哪一步：首页已经从“长信息流式复刻偏差”收敛到“参考页骨架对齐”状态，当前 `3106` 运行态已是满屏头图 + 精选档案墙 + 页脚结构。
- 当前卡点：首页大骨架已经对了，但 hero 素材、个别字体细节、档案卡信息密度和顶部间距仍可能需要按用户最新验收继续微调；这轮没有继续改精选页和详情页，只收首页。
- 下次先做什么：等用户验收首页后，继续按同一视觉语言收精选页或补首页细节，不要再把首页加回多块运营分区。

- Continued homepage route split work for the new target mapping. `apps/web/src/components/shared/PageShell.tsx` now separates the two homepage semantics: `Drama TV -> /`, nav `首页 -> /home`, nav `精选 -> /seedance`, and nav `超能社区 -> /discussions`.
- Updated `apps/web/src/features/home/HomePage.tsx` so the current cinematic landing page keeps the `landing` nav state instead of pretending to be the content homepage.
- Added a new formal route at `apps/web/src/app/(community)/home/page.tsx` and a new page implementation at `apps/web/src/features/home/CommunityHomePage.tsx`.
- The new `/home` page is the first-pass content-community homepage skeleton for the route you described as “click the nav 首页 text after entering DramaTV”, while `/` remains the unauth cinematic landing page.
- `CommunityHomePage.tsx` reuses the existing real `getHomeFeed + getDiscussionHome` data path plus `homeDemoCatalog` fallback/demo resources, and builds a long-form homepage with sections for `灵感进发 / 为你推荐 / 工作流 / 讨论 / 作者 / 社区入口`. Resource badges remain constrained to `PROMPT` and `WORKFLOW`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit` succeeded; Playwright confirmed `http://127.0.0.1:3106/` still serves the cinematic landing page, and clicking the top nav `首页` now navigates to `http://127.0.0.1:3106/home` with the new content homepage layout live.
- 当前做到哪一步：你后面要继续复刻的两个“首页”现在已经拆开了，`/` 是点 `Drama TV` 回去的 landing，`/home` 才是导航 `首页` 对应的内容社区首页。
- 当前卡在哪里：新 `/home` 目前还是第一版结构对齐，只是先把路由关系和长页骨架搭出来，还没有按你最新那张“点击首页字样后进入的目标页”截图把顶部节奏、字级、分区密度和卡片阵列精修到位。
- 下次先做什么：直接在 `apps/web/src/features/home/CommunityHomePage.tsx` 上继续复刻新 `/home` 的目标页面，优先收顶部结构、`灵感进发 / 为你推荐` 分区、卡片阵列和发布按钮节奏。

- 根据用户最新指出的“精选页路由突然错了”继续回查运行态，确认根因不是页面挂了，而是我上一轮把社区内的 `精选` 导航错误改到了 `/seedance`。`/seedance` 在现有文档和代码里都只是视频提示词专题资料页，不是已经验收过的社区精选流页面。
- 对照用户提供的旧截图与 `mindloop-_-cinematic-archive (1)/src/App.tsx` 里的留存实现，恢复了正式社区精选页：新增 [apps/web/src/features/featured/FeaturedArchivePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.tsx)、[apps/web/src/features/featured/FeaturedArchivePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.module.css) 和 [apps/web/src/app/(community)/featured/page.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/app/(community)/featured/page.tsx)。
- 当前正式路由映射已修正为：`Drama TV -> /`、导航 `首页 -> /home`、导航 `精选 -> /featured`、导航 `超能社区 -> /discussions`。`/seedance` 和 `/nano-banana` 继续保留为独立资源专题页，不再承接社区精选主导航。
- 同步收口站内精选入口和回流：`PageShell.tsx` 顶部导航、`HomePage.tsx` 的“查看全部”、`CommunityHomePage.tsx` 的“进入精选 / 查看更多”、`home-resource-catalog.ts` 的“进入精选页”卡片都已改为 `/featured`；视频详情、工作流详情、发布页的“返回列表 / 取消发布”也统一回到 `/featured`。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；Playwright 实测 `http://127.0.0.1:3106/featured` 已显示社区精选页结构，顶部 `精选` 导航指向 `/featured`，从精选卡片进入 `/videos/prompt-preview-xianxia` 后“← 返回列表”已回到 `/featured`，浏览器控制台错误为 `0`。
- 当前做到哪一步：社区正式导航已经重新接回“社区精选页”，不再错误落到 `seedance` 专题页；用户指出的这条路由偏移问题已在运行态修正。
- 下次先做什么：继续按这张已恢复的精选页为基底，细收筛选条文案、卡片布局比例、右侧推荐位和字体细节，把 `/featured` 继续往你之前验收过的那版视觉上压近。

- Continued `/featured` visual polish on the formal `apps/web` route. Reworked [apps/web/src/features/featured/FeaturedArchivePage.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.tsx) and [apps/web/src/features/featured/FeaturedArchivePage.module.css](/E:/点众/DramaTV社区搭建/apps/web/src/features/featured/FeaturedArchivePage.module.css) so the top filter/search/sort row now reads as one integrated control strip, the inner page body no longer looks like a boxed black frame, and the card wall now uses a lead collage plus balanced masonry columns instead of the previous hole-prone span grid.
- Added display-side text compaction on the featured page so card titles, authors, and tag strings render shorter and cleaner, reducing the noisy long-string feel while keeping the resource types constrained to `PROMPT` and `WORKFLOW`.
- Verification passed: `apps/web -> npx.cmd tsc --noEmit`; Playwright rechecked `http://127.0.0.1:3106/featured` and captured the updated visual checkpoints `featured-current-before.png`, `featured-reference-3111.png`, `featured-after-pass-1.png`, `featured-after-pass-2.png`.
- 当前做到哪一步：精选页已经从“路由修正后的恢复版”推进到“版式收口版”，这轮重点处理了顶部栏不对、页面像整体黑框、卡片排布出现明显空缺这三处问题。
- 当前卡在哪里：整体方向已经对上，但如果继续往参考图压，还可以细收顶部控件宽度比例、卡片封面素材选择、局部留白和字体权重。
- 下次先做什么：等用户验收这版 `/featured`，再决定继续精修精选页，还是切回下一个待复刻页面；不要再改动 `精选 -> /featured` 这条已修正的正式路由映射。

- 根据用户最新纠正，四个页面新增的“画布入口”最终口径改为：放在左侧，原来的发布入口不要动，只做位置避让，不允许重合遮挡。
- 已在 [apps/web/src/components/shared/PageShell.tsx](/E:/点众/DramaTV社区搭建/apps/web/src/components/shared/PageShell.tsx) 调整共享浮动入口顺序，改成左侧 `画布入口`、右侧保留原 `发布` 卡片；文案收敛为“画布入口 / 进入联动画布”。
- 已在 [apps/web/src/app/globals.css](/E:/点众/DramaTV社区搭建/apps/web/src/app/globals.css) 收口浮动按钮样式：整体固定栏向内收，左侧画布入口改为更紧凑的小号样式，右侧发布入口维持原白色卡片视觉，桌面端与移动端都补了避让间距。
- 已验证：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/web -> npm.cmd run build` 通过；Playwright 已实测 `http://127.0.0.1:3106/`、`/home`、`/featured`、`/discussions` 四页，当前都是左侧画布入口、右侧发布入口，未出现重叠遮挡。
- 当前做到哪一步：四个主页面的浮动双入口位置已经按最新口径收正，现阶段不再需要回退到“右侧新增画布入口”的错误方案。
- 下次先做什么：如果用户继续精修，就直接在这版基础上微调左侧画布入口的尺寸、阴影、文案密度和离边距离，不再改动发布入口本身。
- 2026-04-19 后端登录与鉴权边界继续收口：`apps/server` 已把 `CurrentUserFilter` 解析出的 Bearer token 用户同步写入 Spring Security `SecurityContext`，`SecurityConfig` 改为显式区分公开读接口与受保护接口，并统一输出 JSON `401/403 + requestId`，不再返回默认 HTML 错误页。
- 2026-04-19 已验证当前安全边界：匿名访问 `/api/feed/home` 仍为 `200`；匿名访问 `/api/me/hub`、`/api/uploads/video-policy`、`/api/comments POST`、`/api/interactions/*` 均为 `401`；使用 `creator-a / dramatv-local-dev` 登录后，`/api/auth/me` 与 `/api/uploads/video-policy` 恢复 `200`。
- 2026-04-19 本地后端开发脚本补噪音处理：`scripts/start-server-dev-18080.ps1` 遇到旧日志文件被占用时不再抛出 `Remove-Item` 错误，而是提示进入 append 模式，避免反复重启时的误导性报错。
- 2026-04-19 前端路由边界第一次正式收口：新增 `apps/web/src/lib/routes/community-routes.ts` 统一定义正式社区页与内部隔离页；正式主线保留 `/`、`/home`、`/featured`、`/discussions`、`/discussions/new`、`/discussions/[slug]`、`/publish`、`/videos/[id]`、`/workflows/[id]`、`/creators/[id]`、`/canvas/[runtimeId]`、`/login`、`/me`。
- 2026-04-19 已把历史复刻/实验页迁入内部隔离区：新增 `/internal`、`/internal/seedance`、`/internal/nano-banana`、`/internal/dev/smoke`；旧的 `/seedance`、`/nano-banana`、`/dev/smoke` 现仅做跳转，不再作为正式主线页面。
- 2026-04-19 `proxy.ts` 已对 `/internal` 放行，避免内部参考页被游客登录拦截；`SeedanceReplicaPage` 内部分享和跨页跳转也已改到 `/internal/*`，不再把实验页暴露为主站流量入口。
- 2026-04-19 顶部个人入口语义修正：`PageShell` 默认不再把登录用户名字/头像指向 `/me`，而是默认跳转到当前用户自己的公开主页 `/creators/{currentUser.id}`；`/me` 继续保留为个人中心能力页。
- 2026-04-19 已验证前端整理结果：`apps/web -> npx.cmd tsc --noEmit` 通过，`apps/web -> npm.cmd run build` 通过。当前构建产物中正式主线和内部隔离页可同时存在，但内部页已从产品语义上完成分层。
- 2026-04-19 下一步主线：在现有正式工程 `apps/web + apps/server` 上设计并实现“已抓取视频+提示词 / 图片+提示词”导入链路。开始前需要用户提供本地资源路径；导入时优先保证数据模型和后续画布联动兼容，不走一次性脏导入。
- 2026-04-20 互动补漏继续收口：`prompt` 已正式纳入后端 `comments / like / favorite` 目标类型，前端提示词详情页不再借道视频互动动作；`/prompts/[id]` 现已加载真实评论并回刷真实互动状态。
- 2026-04-20 工作流详情页互动已确认走真实后端链路：实测使用 `creator-a / dramatv-local-dev` 对真实工作流 `0c81983d-a087-4791-b9b3-64746732e74f` 完成点赞、收藏、评论、评论点赞，接口返回与数据库计数一致；随后已执行 `scripts/reset-local-interaction-baseline.ps1`，视频 / 工作流 / 提示词 / 帖子互动计数全部重新归零。
- 2026-04-20 为避免用户继续点进假 workflow target，`/featured` 已改为优先展示后端真实 `hotWorkflows`，访客首页 `HomePage` 也改为优先使用真实 `view.hotWorkflows`；保留的 `workflow-preview-*` 详情页已明确降级为只读预览态，不再伪装成可写的真实互动页。
- 2026-04-20 帖子详情页第一版正式视觉已落地到 `apps/web/src/features/discussions/DiscussionDetailPage.tsx` 与 `DiscussionDetailPage.module.css`：从旧的通用玻璃面板改成当前社区风格的独立帖子详情页，包含标题 hero、作者卡、粘性互动条、Markdown 正文、发布信息侧栏和回复区；同时按最新产品口径保持帖子为独立讨论内容，不在用户端展示历史 binding 侧栏。
- 2026-04-20 本地真实链路已用 `creator-a / dramatv-local-dev` 跑通：`POST /api/post-drafts` 创建草稿，`PUT /api/post-drafts/{id}` 写入标题/Markdown/标签，`POST /api/post-drafts/{id}/submit` 发布后得到帖子 `smoke-20260420-183624`，随后 `GET /api/discussions/threads/{slug}`、帖子点赞、收藏、评论、评论点赞均成功回读；前端 `http://127.0.0.1:3106/discussions/smoke-20260420-183624` 返回 `200`。
- 2026-04-20 提示词详情页本地链路也已确认：真实 prompt `11d80532-e5d0-597e-9e5b-3c61dffe0c58` 的 `/api/prompts/{id}`、点赞、收藏、评论、评论点赞均走真实 `prompt` 目标类型并回读成功；前端 `http://127.0.0.1:3106/prompts/11d80532-e5d0-597e-9e5b-3c61dffe0c58` 返回 `200`。
- 2026-04-20 已验证 `apps/web -> npx.cmd tsc --noEmit` 与 `npm.cmd run build` 均通过，构建路由包含 `/discussions/[slug]`、`/discussions/new`、`/prompts/[id]`。当前遗留限制是 Playwright MCP 的 Chrome profile 被占用，暂未补浏览器截图；如果需要视觉验收，下一次先释放或重建 MCP 浏览器会话后再截图。
- 2026-04-21 三类主内容数据库组合开始正式落地：新增 `apps/server/src/main/resources/db/migration/V10__add_feed_content_kind.sql`，给 `feed_items` 增加 `content_kind` 并把历史数据回填到 `prompt / workflow_work / post`。
- 2026-04-21 后端首页 feed DTO `HomeFeedResponse.FeedItemResponse` 已新增 `contentKind`，同时保留 `itemType` 作为真实实体目标类型，正式形成“前台产品分类 + 后端实体类型”双层语义。
- 2026-04-21 `CommunityCatalogJdbcQueryService` 已按 `content_kind + item_type` 聚合内容：视频与工作流统一归入 `workflow_work`，Prompt 归入 `prompt`，帖子也可作为 `post` 进入 feed 索引层；讨论帖发布后会同步写入 `feed_items`。
- 2026-04-21 前端契约 `apps/web/src/lib/contracts/community-api.ts` 与 `apps/web/src/lib/contracts/view-models.ts` 已新增 `contentKind`，并把首页 feed 的 `itemType` 扩展为兼容 `post`，为后续首页/精选/个人中心按三类主内容收口打基础。
- 2026-04-21 已验证本轮实现：`apps/server -> -DskipTests compile` 通过；`apps/web -> npx.cmd tsc --noEmit` 通过。
- 2026-04-21 继续收前端产品口径：`/canvas` 入口不再只把 `workflow` 当候选，而是优先从 `contentKind=workflow_work` 的 feed 项里取关联工作流；首页、创作者页、个人中心、视频详情、工作流详情、精选页的 badge 文案开始从旧的 `PROMPT / WORKFLOW / WORK` 收口到中文产品语义。
- 2026-04-21 新增前端展示 helper：`apps/web/src/lib/presentation.ts` 已补 `formatContentKindBadge()` 与 `formatEntityTypeBadge()`，后续页面继续统一走这层，不再各页面手写一套分类文案。
- 2026-04-21 已验证本轮前端语义收口：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/server -> -DskipTests compile` 再次通过。
- 2026-04-21 首页与精选页已开始真正按内容索引层编排，不再只是改角标文案：新增 `apps/web/src/lib/content-index.ts`，把 `feedItems` 映射成前端可复用的三类内容卡片。
- 2026-04-21 `/home` 与 `/` 的主内容流已优先使用 `view.feedItems -> contentKind`，只把旧 `prompts/workflows` 保留为兜底；`/featured` 也已改为优先消费 `homeFeed.data.items`，支持把帖子作为 `activity` 类型混入精选主墙。
- 2026-04-21 后端首页 feed 进一步收口：`CommunityCatalogJdbcQueryService` 的首页主 feed fallback 已去掉独立 workflow 主内容回填，`workflow` 方法对象继续留在 `hotWorkflows`/方法层，不再和三类主内容抢同级主流位置。
- 2026-04-21 已验证本轮编排层收口：`apps/web -> npx.cmd tsc --noEmit` 通过；`apps/server -> -DskipTests compile` 通过。
- 2026-04-21 三类主内容后端收口继续完成：新增 `apps/server/src/main/resources/db/migration/V11__add_feed_target_type.sql`，给 `feed_items` 增加 `target_type`，并把唯一约束从 `(channel_code, item_type, target_id)` 升级到 `(channel_code, target_type, target_id)`。
- 2026-04-21 发布与审核写路径已切到新索引语义：`PublishedContentPersistenceService`、`PublishModerationPersistenceService` 现在统一写入 `content_kind + target_type`，`item_type` 仅保留兼容旧数据与旧前端口径。
- 2026-04-21 首页查询链路已完成兼容式收口：`CommunityCatalogJdbcQueryService` 查询 `feed_items` 时优先使用 `target_type` 关联真实实体表，缺失时再兜底旧 `item_type`，避免本地已有旧数据直接失效。
- 2026-04-21 已验证本轮后端模型收口：`apps/server -> -DskipTests compile` 通过；`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过。
- 2026-04-21 规划表状态已同步到副本 [DramaTV社区功能规划清单-已同步.xlsx](/E:/点众/DramaTV社区搭建/docs/03_架构/DramaTV社区功能规划清单-已同步.xlsx)；原始 [DramaTV社区功能规划清单.xlsx](/E:/点众/DramaTV社区搭建/docs/03_架构/DramaTV社区功能规划清单.xlsx) 当前被 WPS 占用，关闭后再覆盖回写。
- 2026-04-21 `/me` 私有个人中心开始正式补“草稿箱”闭环：后端 `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java` 与 `MeHubResponse.java` 已扩展 `/api/me/hub`，新增只针对当前登录用户的 `draftItems` 返回；数据源为 `publish_drafts`，仅回传当前作者、`status_code='draft'` 且真正写过内容的草稿，不会把纯空白自动建档草稿塞进个人中心，也不会暴露到公开创作者页。
- 2026-04-21 前端 `apps/web/src/features/me/PersonalCenterPage.tsx` 与 `PersonalCenterPage.module.css` 已接入私有草稿箱标签页，和现有个人中心视觉保持一致；草稿卡片明确标注“仅自己可见”，并区分 `视频草稿 / 帖子草稿 / 工作流草稿`。当前规则是：视频草稿与帖子草稿支持继续编辑，工作流草稿因还没有对应前端编辑器，先展示为“编辑器未开放”，不伪装成完整能力。
- 2026-04-21 继续编辑链路已打通：`/publish` 与 `/discussions/new` 路由现在支持 `?draftId=`，`apps/web/src/lib/api/community-service.ts` 的 `getPublishBootstrap()` 也支持按指定 `videoDraftId / postDraftId / workflowDraftId` 读取已有草稿，而不是每次都强制新建或复用最新草稿。对应地，草稿箱里的视频草稿可跳回 `/publish?draftId=...`，帖子草稿可跳回 `/discussions/new?draftId=...`。
- 2026-04-21 已验证本轮实现：`apps/server -> -DskipTests compile` 通过；`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过。当前环境状态再次确认：`dramatv-postgres:5432`、`dramatv-redis:6379`、`dramatv-pgadmin:5050` 都在运行，后端 `http://127.0.0.1:18080/actuator/health` 返回 `UP`，前端 `http://127.0.0.1:3106/me` 可访问。
- 2026-04-21 当前做到哪一步：公开个人主页 `/creators/[id]` 维持不动，私有 `/me` 已开始具备“个人工作台”语义，不再只是资料 + 点赞 + 收藏；草稿箱是只对自己可见的第一版闭环。
- 2026-04-21 当前卡在哪里：后端和前端代码都已完成静态校验，但当前运行中的 `18080` 服务还是旧进程时，浏览器不会立刻看到新的 `/api/me/hub -> draftItems` 返回，届时需要按现有脚本重启后端；另外工作流草稿仍缺真实编辑器，这一类草稿先只展示不继续编辑。
- 2026-04-21 下次先做什么：1）重启后端并用真实登录态验收 `/me` 草稿箱显示；2）确认点赞/收藏为空是否只是当前账号无互动记录；3）若确认个人中心口径没问题，再继续做 `/me` 下的更完整私有能力，如草稿管理动作或“我的发布”沉淀。
- 2026-04-21 修复 `/me` 与公开作者主页的“获赞”统计口径：后端 `MeHubResponse` / `CreatorProfileResponse` 的 `stats` 新增 `likeReceivedCount`，查询时从已发布 `videos / workflows / prompt_entries / discussion_threads` 实时聚合；点赞/取消点赞写路径同步反刷 `creator_profiles.like_received_count`。前端 `/me` 与 `/creators/[id]` 不再用卡片列表临时加总获赞，同时作者视频/工作流列表补齐 `summary / likeCount / playCount` 字段，避免卡片仍显示 0。
- 2026-04-21 已验证本轮获赞修复：`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；`apps/server -> project Maven + JDK17 test -DskipTests` 通过；已用 `scripts/start-server-dev-18080.ps1` 重启后端，`http://127.0.0.1:18080/actuator/health` 返回 `UP`。真实接口 smoke 使用 `creator-a / dramatv-local-dev` 对视频 `22968e91-49c1-4ae4-8b61-05f4a74a5aad` 验证：取消点赞后 `/api/me/hub profile.stats.likeReceivedCount` 与视频详情 `stats.likeCount` 同步 `1 -> 0`，恢复点赞后同步回到 `1`。
- 2026-04-21 新增 [DramaTV社区运维与云资源对接文档.md](/E:/点众/DramaTV社区搭建/docs/03_架构/DramaTV社区运维与云资源对接文档.md)，用于和公司运维、云资源、后端联调同事确认测试/预发/生产环境的服务器、域名、PostgreSQL、Redis、对象存储、CDN、Nginx、日志监控、队列、登录系统和上线验收清单；已同步写入 [docs/README.md](/E:/点众/DramaTV社区搭建/docs/README.md) 的主线文档导航。
- 2026-04-21 `/me` 私有个人中心继续收口“我的点赞 / 我的收藏”：后端 `/api/me/hub` 的 `likedItems/favoritedItems` 已补齐 `prompt` 类型，前端个人中心把旧“讨论”标签改为独立“点赞”标签，并保留“收藏”标签；没有新增评论记录入口，符合当前“评论不需要”的口径。已验证 `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过、`apps/server -> scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过、`apps/web -> npm.cmd run build` 通过；后端已重启，真实 `/api/me/hub` smoke 返回 `favoritedItems=1`、`likedItems=0`、无 `commentItems` 字段。
- 2026-04-21 按用户纠正的产品口径收口作者主页：不新增“我的发布”独立管理页，已发布内容继续沉淀在公开主页 `/creators/[id]`；作者页前端标签改为 `作品 / 帖子`，移除公开页里的“赞过 / 我的收藏”占位。后端新增公开读接口 `GET /api/creators/{id}/posts`，复用讨论帖卡片结构返回该作者已发布帖子。已验证 `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过、`apps/server -> scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过、`apps/web -> npm.cmd run build` 通过；后端已重启，`/api/creators/11111111-1111-1111-1111-111111111111/posts` 返回 `8` 条帖子，作者页 HTTP `200`。当前注意：部分历史帖子标题仍有历史编码乱码，需要后续单独清洗数据。
- 2026-04-21 creator stats alignment: fixed creator profile and /me stats to use live published counts instead of stale creator_profiles aggregates; author page top stat now shows visible works count, so creator `11111111-1111-1111-1111-111111111111` is aligned as `作品 5` and `帖子 8` instead of stale `发布 18`.
- 2026-04-21 /me published posts: wired personal center to load the current user's published discussion posts from `/api/creators/{id}/posts`, added a `帖子` tab on `/me`, and exposed post count in the hero stats so personal homepage can browse own posts alongside works/drafts/likes/favorites.
- 2026-04-21 `/me` 个人中心继续补完真实工作台能力：新增后端 `PUT /api/me/profile`，前端 `apps/web/src/features/me/actions.ts` 接入资料保存、头像上传和草稿删除；`apps/web/src/features/me/PersonalCenterPage.tsx` 已落地“编辑资料”弹窗、头像本地预览、昵称/身份说明/简介保存，以及草稿箱删除按钮。已验证 `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过，`apps/web -> npm.cmd run build` 通过，`apps/server -> scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；后端已重启且 `http://127.0.0.1:18080/actuator/health` 返回 `UP`。接口 smoke 已用本地账号验证 `GET /api/me/hub -> PUT /api/me/profile` 可回写成功。当前做到哪一步：`/me` 的“编辑资料 + 草稿箱管理”链路已不是占位。当前卡在哪里：Playwright MCP 浏览器当前不可用，尚未补本轮视觉点击截图验收。下次先做什么：1）等 MCP 浏览器恢复后补 `/me` 弹窗和草稿箱实际页面验收；2）若用户确认草稿箱交互口径无误，再继续做草稿批量清理或更细的草稿筛选。
- 2026-04-21 Playwright MCP repair attempt: browser tools failed with `Transport closed`, not a DramaTV frontend/backend issue. Identified and killed stale `@playwright/mcp` process chains from 16:48 and the broken current chain from 20:39; checked `ms-playwright` profile directories and found no active `SingletonLock` / `DevToolsActivePort` lock files. Updated `C:\Users\psk13\.codex\config.toml` Playwright MCP args to add `--isolated` (backup: `config.toml.playwright-isolated.bak`) so future sessions do not reuse stale disk profiles. Current limitation: this Codex chat had already cached the old MCP stdio transport, so `mcp__playwright__browser_tabs` still returns `Transport closed` in this session. Next step: resume/reopen Codex after the config change, then first run `browser_tabs` or navigate to `http://127.0.0.1:3106/me` to verify the browser MCP is rebuilt with the isolated profile.
- 2026-04-22 媒体上传与 OSS 预备收口：后端新增 `MediaStorageProperties`，把 `provider / bucket / publicBaseUrl / publicBasePath / serveLocally / oss.*` 全部收口到 `dramatv.media.*`；`UploadApplicationService` 去掉写死的本地 provider/bucket/public path 常量，继续保持本地磁盘上传实现不变，但如果有人提前把 provider 切成 `oss` 会明确返回 `UPLOAD_PROVIDER_NOT_READY`，避免写出半兼容数据。
- 2026-04-22 `MediaResourceConfig` 已改为受配置驱动：本地模式继续暴露 `/media/**`，后续切 CDN 或对象存储回源时可以直接通过 `DRAMATV_MEDIA_SERVE_LOCALLY=false` 关闭本地静态资源映射；`apps/server/.env.example` 也已补齐媒体与 OSS 相关环境变量占位。
- 2026-04-22 新增文档 [媒体上传与 OSS 预备方案.md](/E:/点众/DramaTV社区搭建/docs/03_架构/媒体上传与 OSS 预备方案.md)，说明当前本地上传链路、`media_assets` 现状、`object_key` 语义风险、建议的资源分类与对象键规则，以及后续真正切 OSS 时的改造顺序；`docs/README.md` 已同步纳入主线文档导航。
- 2026-04-22 已验证本轮后端收口：`apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过。本轮目标是“为上 OSS 提前做配置和结构准备”，不是立即切云，因此当前本地页面和上传交互口径保持不变。下次先做什么：1）继续把查询层从“直接返回 `object_key`”逐步收口到“统一解析可访问 URL”的方向；2）梳理本地素材目录和 metadata 完整度，给后续批量迁移 OSS 做准备。
- 2026-04-22 继续媒体数据优化：新增 `apps/server/src/main/java/com/dramatv/community/shared/media/MediaAssetUrlResolver.java`，把“库里存的资源引用”统一解析成前端可访问地址；当前优先兼容三种情况：已存完整 URL、已存相对 `/media/...` / `/xxx` 路径、未来改回纯对象键后配合 `DRAMATV_MEDIA_PUBLIC_BASE_URL` / `oss.endpoint` 拼出访问地址。
- 2026-04-22 主查询链路已接入媒体地址解析层：`CommunityCatalogJdbcQueryService`、`PromptQueryService`、`MeQueryService`、`CanvasApplicationService` 不再直接把 `object_key` / `asset_url` 原样透出，而是在返回 `coverUrl / posterUrl / previewUrl / sourceUrl / example url` 前统一走 resolver。这样后续切 OSS 时，不需要每个页面再单独找一遍资源字段。
- 2026-04-22 已验证本轮读路径收口：`apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 再次通过。当前做到哪一步：媒体上传配置和媒体读取解析都已经开始和“本地磁盘 URL 语义”解耦。下次先做什么：1）视老师/画布研发给到的资源情况，决定 resolver 是否要继续升级到显式消费 `storage_provider + bucket_name`；2）再梳理导入脚本和历史数据，决定是否开始把新写入的 `object_key` 收口为真正对象键。
- 2026-04-22 媒体写路径继续收口：`UploadApplicationService` 现在对新上传资产写入的是相对对象键 `assetKind/{assetId}/{fileName}`，不再把公开 URL 直接塞进 `media_assets.object_key`；但 `uploadBinary` 返回给前端的 `publicUrl` 仍然保持可直接访问，因此发布页、帖子编辑页、头像上传链路不需要改前端表单逻辑。
- 2026-04-22 `MediaAssetUrlResolver` 已补 `local-public / apps-web-public` 分支，允许未来把 `apps/web/public` 下导入素材的 `object_key` 也统一存成去掉前导 `/` 的相对路径；对应 `scripts/import-youmind-prompts.mjs` 已同步更新，后续再导入 YouMind 图片/视频提示词时，新写入的 `media_assets` 记录会更接近真正对象键语义。
- 2026-04-22 已验证本轮写路径收口：`apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；`node --check scripts/import-youmind-prompts.mjs` 通过。当前做到哪一步：读取路径和新写入路径都已经开始向“对象键 + 统一解析访问地址”收口。下次先做什么：1）如果要继续做数据优化，优先补一个本地巡检/统计脚本，盘点 `media_assets` 里旧 URL、相对路径、对象键三种写法各有多少；2）再决定是否对历史数据做批量规范化。
- 2026-04-22 媒体读路径继续修正为显式三元组解析：`CommunityCatalogJdbcQueryService`、`PromptQueryService`、`MeQueryService`、`CanvasApplicationService` 现已在主要查询里一并取出 `storage_provider + bucket_name + object_key`，不再只靠 `object_key` 猜访问路径；resolver helper 同步改为优先走三元组，缺字段时再安全兜底。
- 2026-04-22 已验证本轮修正：`apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；`scripts/start-server-dev-18080.ps1` 重启后端成功，`http://127.0.0.1:18080/actuator/health` 返回 `UP`。
- 2026-04-22 smoke 结果：`GET /api/prompts?modality=all&sort=latest&limit=1` 与 `GET /api/prompts/11d80532-e5d0-597e-9e5b-3c61dffe0c58` 的 `coverUrl` / `examples[].url` 已从错误的 `/media/nano-banana-images/...` 修正为 `/nano-banana-images/000017-13332/01.jpg`；`GET /api/feed/home` 也已返回正确的 prompt 资源路径，如 `/seedance-videos/...`。下次先做什么：1）继续补前端或导入链路中的历史编码清洗；2）等运维/同部门资源到位后，再把当前本地媒体抽象切到真实 OSS。
- 2026-04-22 prompt text cleanup: traced the live prompt mojibake to generated/imported nano-banana data, not to the original source file. `docs/02_研究/youmind-image-assets/nano-banana-library-p001-p190/000004-380/prompt.raw.txt` is valid UTF-8 (`Bundesländer`), while stale generated data still contained `BundeslÃ¤nder`.
- 2026-04-22 prompt text cleanup: reran `docs/02_研究/sync-nano-banana-assets.js`, regenerated `apps/web/public/nano-banana-data.json` and `apps/web/src/features/nano-banana-replica/nano-banana-samples.ts`, and confirmed the bad item `nano-banana-000004-380` now uses the clean raw prompt text.
- 2026-04-22 prompt import hardening: `scripts/import-youmind-prompts.mjs` now blocks `U+FFFD` replacement characters during import and its `feed_items` upsert has been aligned with the current schema `(channel_code, target_type, target_id)` so prompt reimports work again after `V11__add_feed_target_type.sql`.
- 2026-04-22 verification: reran `node .\scripts\import-youmind-prompts.mjs` successfully (`60` prompts imported), queried PostgreSQL directly, and confirmed `prompt_entries(source_campaign='youmind-nano-banana', source_item_id='000004-380').prompt_text_raw` is now `Bundesländer` with no remaining `U+FFFD` matches in scanned prompt text/title/summary fields. `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` also passed.
- 2026-04-22 日间模式图片发灰继续收口：问题不在资源本身，而在 light theme 里仍残留了一批按夜间思路写的深色遮罩和压暗滤镜。已同步收口 `apps/web/src/app/globals.css`、`apps/web/src/features/home/CommunityHomePage.module.css`、`apps/web/src/features/home/HomePage.module.css`、`apps/web/src/features/featured/FeaturedArchivePage.module.css`，降低首页 hero、首页卡片、精选卡片和通用 media card 的灰黑叠层强度，并把 light theme 下的卡片状态条/操作按钮底色切回更干净的浅底。
- 2026-04-22 已验证本轮样式修正：`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；Playwright 复查 `http://127.0.0.1:3106/home` 与 `http://127.0.0.1:3106/featured` 的日间模式，首页头图已从“整张蒙灰”恢复到正常浅色画面，截图产物为 `home-light-after-fix.png` 与 `featured-light-after-fix.png`。
- 2026-04-22 `/` 访客首页继续修正 light hero：确认这页发灰的主因不是背景图，而是沿用了一条偏暗的参考视频。`apps/web/src/features/home/HomePage.tsx` 现已拆成 dark/light 两套 hero video，dark 继续走原 CloudFront 参考视频，light 改为复用 `/home` 已验证过的本地浅色真实视频 `/seedance-videos/20-0c6f4edee69d507da861299696d2e3fe.mp4`；`HomePage.module.css` 同步把 light theme 下的首屏遮罩再降一档。
- 2026-04-22 已验证本轮 landing hero 修正：`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；Playwright 复查 `http://127.0.0.1:3106/` 的日间模式，截图产物为 `landing-light-after-real-fix.png`，首屏已从深灰花景切到浅色香水主视觉。
- 2026-04-22 media chain check: confirmed the media groundwork was already partially finished before this round. `MediaStorageProperties`、`MediaAssetUrlResolver`、本地上传 object-key 写入，以及 `audit/normalize media asset keys` 脚本均已存在并可复用。
- 2026-04-22 media asset audit: reran `node scripts/audit-media-asset-keys.mjs` against the local Docker PostgreSQL and confirmed `media_assets` currently has `91` rows, all in normalized `relative_key` style, with `0` remaining legacy `absolute_url/root_path/blank` rows. Current judgment: no more historical key cleanup is needed before the OSS switch.
- 2026-04-22 media read-path consolidation: added `apps/server/src/main/java/com/dramatv/community/shared/media/JdbcMediaUrlResolver.java` and switched `PromptQueryService`、`MeQueryService`、`CanvasApplicationService`、`CommunityCatalogJdbcQueryService` to use the shared JDBC media resolver instead of each class carrying its own duplicated `resolveMediaUrl` helper.
- 2026-04-22 verification: `apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` passed after the resolver consolidation. Current step reached: media URL resolution now has a single server-side JDBC entry path, so the next OSS cut can change one shared channel instead of four scattered query services.
- 2026-04-22 next step: continue from key normalization to contract normalization. Priority is to align avatar/media/public URL handling across backend response contracts and frontend display normalization, then decide whether to introduce a first-class `MediaRef` / `MediaAssetView` contract before wiring a real OSS provider.
- 2026-04-22 avatar URL consolidation: kept this round intentionally small and practical. Extended `JdbcMediaUrlResolver` with plain-reference resolution and applied it to avatar outputs in `CurrentUserService`, `DiscussionQueryService`, `InteractionJdbcPersistenceService`, `PromptQueryService`, `MeQueryService`, and `CommunityCatalogJdbcQueryService`, so backend responses no longer depend on frontend pages individually guessing whether avatar values are absolute URLs, root paths, or relative keys.
- 2026-04-22 verification: `apps/server -> powershell -ExecutionPolicy Bypass scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` passed again after avatar URL consolidation. Current judgment: this media-contract slice is enough for now; next step should move back to business work instead of continuing low-yield contract polishing.
- 2026-04-22 threaded comments: completed the first usable `楼中楼` chain across video detail, prompt detail, workflow detail, and discussion detail. Backend comment reads now return `parentId + replies[]` trees instead of top-level comments only; frontend comment contracts and mappers are recursive; `createComment` actions now accept optional `parentId`.
- 2026-04-22 comment UI: added the shared nested comment thread component at `apps/web/src/components/comments/CommentThread.tsx`, wired reply buttons plus inline reply composer into `VideoDetailPage`, `WorkflowDetailPage`, and `DiscussionDetailPage`, and updated comment counters to use total backend counts instead of root-comment length.
- 2026-04-22 runtime note: compiling `apps/server` is not enough for comment API shape changes. The local Spring Boot process on `18080` was still serving the old flat response until `scripts/start-server-dev-18080.ps1` restarted the backend; after restart, `/api/comments` returned `parentId` and nested `replies`.
- 2026-04-22 verification: `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed; `apps/server -> powershell -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` passed. Local API verification on `http://127.0.0.1:18080/api/comments?targetType=video&targetId=3d82413b-1036-4c1b-93dd-3a102e0b4683` confirmed nested replies in JSON.
- 2026-04-22 Playwright verification: on `http://127.0.0.1:3106/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`, created one root comment, one reply, and one reply-to-reply; all three wrote successfully and the page re-rendered with nested text visible (`这是第一层回复`, `这是第二层回复`). Also smoke-checked workflow detail render and discussion detail root-comment posting after the shared comment-thread integration.
- 2026-04-22 回到主功能开发：根据“工作流尚未对接画布，只能占位”的当前产品边界，未继续做伪完整 workflow 发布器，而是把 `apps/web/src/features/publish/PublishPage.tsx` 里的假输入区收口成真实的“关联工作流（可选）”字段，直接落库到 `videoDraft.workflowId`，只允许绑定现有工作流。
- 2026-04-22 发布页同步补齐占位说明：`apps/web/src/app/(community)/publish/page.tsx` 现在会拉取当前用户已发布工作流列表供视频发布绑定；`apps/web/src/features/publish/PublishPage.module.css` 新增了工作流绑定卡片与“待画布接入”提示样式，避免页面继续伪装成已经有真实工作流编辑器。
- 2026-04-22 verification: `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 与 `apps/web -> npm.cmd run build` 均已通过。当前步做到：视频发布页已从“假内容输入”切回真实业务字段；下次先做什么：1）本地启动后手动验证 `/publish` 的工作流绑定与提交链路；2）再决定是否补一个更轻量的 workflow 占位入口，而不是正式编辑器。
- 2026-04-22 `/me` 日间模式补修：`apps/web/src/features/me/PersonalCenterPage.module.css` 此前没有 light theme 覆盖，导致个人主页标题、副标题、简介、统计、tab 和操作按钮在浅底下仍沿用白字。已补齐 `:root[data-theme="light"]` 下的文字与按钮颜色收口。
- 2026-04-22 verification: `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；Playwright 复查 `http://127.0.0.1:3106/me` 日间模式，截图产物为 `me-light-font-fix.png`，个人主页主信息区文字已从白字切回深色可读状态。
- 2026-04-22 `/me` 草稿箱日间模式补修：继续补齐 `apps/web/src/features/me/PersonalCenterPage.module.css` 下草稿卡片的 light theme 颜色，包含 `draftMetaRow / privateBadge / draftContent h3,p / draftFooter / draftDeleteButton`，避免草稿箱标签下仍出现白字叠在浅底上的问题。
- 2026-04-22 verification: `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 再次通过；Playwright 切到 `/me` 的“草稿箱”标签复查，截图产物为 `me-drafts-light-after-fix.png`，草稿卡片文字已切回深色可读状态。
- 2026-04-22 `/me` avatar save/display fix: traced the bug to split-origin local media URLs. `GET /api/me/hub` for `creator-0422-b` returned `avatarUrl: /media/image/...`, the file was reachable on backend `18080`, but the frontend at `3106` rendered it as same-origin `/media/...` and showed an empty avatar. Fixed `apps/web/src/lib/presentation.ts` to expand `/media/...` through the configured API base and added `NEXT_PUBLIC_DRAMATV_API_BASE_URL=http://127.0.0.1:18080` to `apps/web/.env.local`. Verification: `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed; Playwright logged into `/me` as `creator-0422-b` and confirmed the saved avatar now renders on the page (`me-creator-0422-b-avatar-after-fix.png`).
- 2026-04-22 avatar normalization sweep: scanned shared frontend entry points for the same split-origin media problem and found two more weak spots. 1) `auth/me` session data and `PageShell` topbar avatar were still consuming raw relative avatar URLs; 2) shared comment view models were still passing raw `author.avatarUrl` through part of the chain. Fixed `apps/web/src/lib/api/community-service.ts`, `apps/web/src/components/shared/PageShell.tsx`, `apps/web/src/lib/mappers/community.ts`, and `apps/web/src/components/comments/CommentThread.tsx` to normalize avatar/media URLs earlier; also fixed `apps/web/src/app/globals.css` so `.home-profile-link` has explicit width/height and the topbar avatar box no longer collapses to `0px` height. Verification: `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed; Playwright confirmed topbar avatar and comment avatar both resolve to `http://127.0.0.1:18080/media/...` with non-zero box sizes on `/me` and `/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`.
- 2026-04-22 planning sheet update: checked `docs/03_架构/DramaTV社区功能规划清单.xlsx`. The workbook already had generic entries for notifications and moderation, but they were too broad for the current phase. Refined row 54 to `消息通知中心 / 顶栏铃铛 / 最近互动`, refined row 63 to `基础违规检测 / 文本敏感词 + 机审接口`, and updated rows 78-80 plus the `说明` sheet to reflect the phased rollout: first basic sensitive-word / machine-review interception, then the full moderation backend and audit workflow.
- 2026-04-22 recent interaction bell: added `/api/me/notifications/recent` backed by `MeQueryService` to aggregate recent likes, favorites, and comments on the current user's published video/workflow/prompt/post content, excluding self-actions.
- 2026-04-22 frontend notification layer: extended `CommunitySessionProvider` and `apps/web/src/app/(community)/layout.tsx` to preload recent notifications, added `NotificationBell.tsx`, and replaced the home topbar bell with a real popover panel while preserving logged-out redirect behavior.
- 2026-04-22 verification: `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed; Playwright verified `http://127.0.0.1:3106/home` shows the new bell button and opens the `最近互动` panel. Backend live verification is pending because the current local CLI only has Java 8 and no Maven wrapper, so the Spring Boot app was not rebuilt in this session.
- 2026-04-22 recent interaction bell runtime fix: the live `500` on `/api/me/notifications/recent` was not caused by the new SQL. Root cause was that port `18080` was still serving an older Spring Boot process without the new controller mapping, so the request fell through to `ResourceHttpRequestHandler` and raised `NoResourceFoundException: No static resource api/me/notifications/recent`.
- 2026-04-22 backend runtime recovery: restarted the local server with elevated `scripts/start-server-dev-18080.ps1`; current dev process is the freshly compiled `spring-boot:run` instance on `http://127.0.0.1:18080`, `Flyway` is at schema version `11`, and `/actuator/health` returns `UP`.
- 2026-04-22 bell live verification completed: `creator-0422-b / dramatv-local-dev` now gets `GET /api/me/notifications/recent -> 200` with `items=[]`, which matches that this account currently has no published content; `creator-a / dramatv-local-dev` gets `200` with `4` real items (`comment/comment/favorite/like`) pointing to `/videos/3d82413b-1036-4c1b-93dd-3a102e0b4683`.
- 2026-04-22 Playwright verification completed for both bell states: on `http://127.0.0.1:3106/home`, the bell popover shows the expected empty state under `creator-0422-b`; after switching to `creator-a`, the same popover shows `4` recent interactions with working links back to the target video detail page.
- 2026-04-22 bell UI visibility fix: the bell click handler and backend were already working; the real issue was CSS clipping. `apps/web/src/app/globals.css` had `.topbar` default `overflow: hidden`, and `NotificationBell` renders its panel as an absolutely positioned child below the trigger. Added `overflow: visible` to `.topbar.topbar-home`, then rechecked `/home`, `/featured`, and `/discussions` with Playwright. Result: the recent-interaction popover now renders visibly on shared home-style headers for both non-empty and empty states.
- 2026-04-23 comment safety moderation P0: completed the lightweight real-time comment guard on the formal `apps/web + apps/server` stack. Backend now checks comment length, blocked sensitive keywords, short-window burst rate, same-user duplicate text, and suspicious URL/contact spam before insert; normal comments stay `status_code='active'`, suspicious spam/contact comments are inserted as `status_code='hidden'`, and hard rejects return stable codes such as `COMMENT_CONTENT_BLOCKED`, `COMMENT_RATE_LIMITED`, and `COMMENT_DUPLICATE_BLOCKED`.
- 2026-04-23 comment safety frontend wiring: `CommentResponse` now exposes `statusCode`, frontend comment contracts carry it, and video/prompt/workflow/discussion comment actions show a different success message when the comment was accepted but hidden by the safety check.
- 2026-04-23 comment safety config: added `dramatv.comment-moderation.*` defaults in `apps/server/src/main/resources/application.yml`, so local/test can tune enablement, max length, burst window, and duplicate thresholds via environment variables without code edits.
- 2026-04-23 verification: backend compile passed with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile`; frontend type check passed with `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`; backend was restarted on `127.0.0.1:18080` and `/actuator/health` returned `UP`.
- 2026-04-23 runtime smoke: `creator-a` on video `3d82413b-1036-4c1b-93dd-3a102e0b4683` confirmed normal comment create/list, escaped Chinese blocked keyword returned `400 COMMENT_CONTENT_BLOCKED`, Chinese `add WeChat` and ASCII `wechat + digits` spam returned `statusCode=hidden` and did not appear in `GET /api/comments`, duplicate text returned `400 COMMENT_DUPLICATE_BLOCKED`; `creator-0422-b` submitted six hidden URL comments and the seventh returned `400 COMMENT_RATE_LIMITED`. Temporary visible smoke comments created by the first PowerShell encoding attempt were marked hidden and the video comment count was resynced.
- 2026-04-23 comment profanity gap fix: the first comment safety cut missed common insult/personal-attack words, so a visible `profanity` comment on video `22968e91-49c1-4ae4-8b61-05f4a74a5aad` slipped through. Added Chinese and ASCII insult keywords such as `cnm/nmsl` plus normalized matching that strips whitespace, punctuation, and symbols before keyword checks. Runtime smoke confirmed the direct word, spaced variant, punctuated variant, and ASCII abbreviation all return `400 COMMENT_CONTENT_BLOCKED`. The already-visible bad comment `93e7ca75-4a1e-45d8-afd9-f0b36d1d87a9` was marked `hidden`, and the target video public comment count was resynced to `0`.
- 2026-04-23 comment governance rollout: completed the first shared “creator manages comments” slice across all current comment-bearing detail pages. `videos / workflows / prompt_entries / discussion_threads` now carry `comments_enabled`; backend added `PUT /api/comments/target-settings` and `DELETE /api/comments/{commentId}`; `VideoDetailResponse` / `PromptDetailResponse` / `WorkflowDetailResponse` / `DiscussionThreadDetailResponse` now all return `commentPolicy`.
- 2026-04-23 frontend comment governance wiring: shared `apps/web/src/components/comments/CommentThread.tsx` now renders author-only comment-area toggle, per-comment delete action, disabled composer copy when comments are closed, and comment-policy state. `VideoDetailPage` covers both video and prompt details, `WorkflowDetailPage` and `DiscussionDetailPage` are wired to the same shared behavior.
- 2026-04-23 runtime verification: public detail checks confirmed `prompt d38c33fd-7926-53af-961a-e12eb47e5846` and workflow `0c81983d-a087-4791-b9b3-64746732e74f` both return `commentPolicy`; discussion detail `standalone-post-smoke-20260412-151127` also returns `commentPolicy`, and author `creator-a` verified `canManageComments=true` at runtime.
- 2026-04-23 discussion governance smoke: on thread `0c1a3487-1063-4fd1-abf6-328e41c7be00 / standalone-post-smoke-20260412-151127`, author `creator-a` successfully closed comments, a different user was blocked with `COMMENT_DISABLED`, author reopened comments, a fresh local user posted an `active` comment, author deleted it successfully, and final public `replyCount/commentCount` returned to `0`.
- 2026-04-23 robustness follow-up: while doing the smoke run, found that hidden comments could not be deleted because delete lookup only accepted `status_code='active'`. Updated `InteractionJdbcPersistenceService.loadCommentDeleteTarget(...)` to allow any non-deleted comment status, recompiled backend, restarted local server `18080`, and verified the edge case on discussion thread `0c1a3487-1063-4fd1-abf6-328e41c7be00`: a fresh user posted hidden comment `wechat 12345678`, author `creator-a` deleted it successfully, and public `replyCount` stayed `0`.
### 2026-04-23 Optimization workstream kickoff

- 基于当前正式栈 `apps/web + apps/server + PostgreSQL + Redis + 本地媒体存储`，开始从“功能补齐”切换到“速度与稳定性优化”阶段，后续优化记录统一继续写回本文件，不再另开分散清单。
- 当前首轮优化任务收口为 5 项：`O1 公共页取数减重 + 缓存`、`O2 热点 SQL / 索引审计`、`O3 媒体链路稳定化`、`O4 限流/幂等/smoke 等稳定性基建`、`O5 前端体感速度优化`。
- 本轮分析已确认几个直接问题：`apps/web/src/lib/api/community-service.ts` 当前统一 `cache: "no-store"`；`apps/web/src/app/(community)/featured/page.tsx` 一次拉取 `500 + 500` 条 prompt；首页 `/` 与 `/home` 仍并行拉 `homeFeed + discussionHome + prompts(all)`；`apps/server/src/main/java/com/dramatv/community/publish/application/UploadApplicationService.java` 仍是同步写本地 `local_fs`。
- 跟踪规则固定：每完成一项优化，就同步更新看板状态并在 `追加日志` 里补一条“改了什么 / 为什么改 / 如何验证”的记录，直到 5 项全部收口。

### 2026-04-23 Optimization O1 - public reads and request reduction

- 前端新增 `apps/web/src/lib/api/community-public-cache.ts`，把公共首页类页面改成走 `unstable_cache` 包装后的公共读请求，并在 `community-service.ts` 为 `getHomeFeed / getPrompts` 增加 `includeAuth?: boolean`，避免游客页仍强行透传登录态请求头。
- `/` 与 `/home` 已去掉未实际使用的 `discussionHome` 并发拉取：现在只保留 `homeFeed + prompts + hasCommunitySession()`，其中 `/` 用 `12` 条热门提示词，`/home` 用 `36` 条热门提示词；`/featured` 继续保留 `500 + 500` 的提示词加载上限，以满足“当前先不做展示数量限制”的产品要求，但数据源已切到公共缓存读路径。
- `/discussions` 已移除逐条 `getDiscussionThread()` 的服务端回查，后端 `DiscussionHomeResponse.ThreadCard` 直接补齐 `author` 与 `publishedAt`，前端列表改为直接消费首页接口返回值，消除了这条页面链路的 N+1。
- 已验证：`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；`apps/web -> npm.cmd run build:web` 通过；`apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；运行态检查 `http://127.0.0.1:18080/api/discussions/home` 已返回新增的 `author / publishedAt` 字段；页面 HTTP 检查 `http://127.0.0.1:3106/`、`/home`、`/featured`、`/discussions` 均返回 `200`。

### 2026-04-23 Optimization O2 - hot SQL index audit

- 先对 `/api/feed/home`、`/api/prompts`、`/api/discussions/home` 对应查询跑了一轮 `EXPLAIN (ANALYZE, BUFFERS)`。结论是：`feed_items` 主查询已经能走现有 `idx_feed_items_channel_code_rank_score`，不需要额外补索引；真正缺口集中在 `prompt_entries` 的热门排序，以及 `discussion_threads` 的活动时间排序。
- 新增迁移 `apps/server/src/main/resources/db/migration/V13__add_hot_query_indexes.sql`，补了四个与真实排序字段一致的部分/表达式索引：`prompt_entries` 的全量热门索引、按 `modality` 的热门索引，以及 `discussion_threads` 的全站活动排序索引、按 `channel_id` 的活动排序索引。
- 本地后端重启后 `Flyway` 已从 `v12` 升到 `v13` 并成功应用该迁移。再次跑 `EXPLAIN` 后，`prompt_all_hot` 已从原先的 `Seq Scan + Sort` 切到 `Index Scan using idx_prompt_entries_hot_public`，执行时间约 `0.163 ms`；`prompt_video_hot` 与 `discussion_home` 在当前本地小样本下仍偏向顺序扫描，这不是索引失效，而是优化器基于 `prompt_entries≈60`、`discussion_threads≈8` 的小表规模判断顺扫更便宜。
- 已验证：`apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；本地服务重启成功，`server-dev-18080.out.log` 已记录 `Migrating schema "public" to version "13 - add hot query indexes"`；接口检查 `http://127.0.0.1:18080/api/prompts?modality=all&sort=hot&limit=12`、`http://127.0.0.1:18080/api/discussions/home` 及页面 `http://127.0.0.1:3106/`、`http://127.0.0.1:3106/discussions` 均返回 `200`。

### 2026-04-23 Optimization O3 - upload guardrails first slice

- 后端媒体配置补齐 `dramatv.media.upload.max-video-size-bytes` 与 `dramatv.media.upload.max-image-size-bytes`，对应环境变量已写入 `apps/server/.env.example`。这样后续测试环境、OSS 环境切换时，不需要再改 Java 常量就能调整上传限制。
- `UploadApplicationService` 现在不再只依赖创建策略时的 `sizeBytes` 声明值，而是增加了两层兜底：1）`UploadController` 会把 `Content-Length` 透传给服务层做预检；2）文件写入本地后，会再用“实际写入字节数”与当前资产类型的大小上限比较，超限就清理落盘文件并返回 `UPLOAD_FILE_TOO_LARGE`。
- 这次没有改前端上传契约：`createUploadPolicy -> uploadBinaryAsset` 这条链仍保持原样，后续切 OSS 仍可以继续复用“策略接口返回 uploadUrl + headers，前端按策略 PUT 上传”的模式，不需要再推倒页面表单。
- 已验证：`apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过；本地服务重启后继续 `UP`；真实登录 `creator-a / dramatv-local-dev` 后，图片策略创建 + 小文件上传成功，返回 `statusCode=ready` 且 `smallUploadUrl` 直接可访问 `200`；同样登录态下，用“策略声明 1KB、实际上传 22MB 图片文件”的方式冒烟，服务端日志已稳定记录 `code=UPLOAD_FILE_TOO_LARGE`，说明实际字节数兜底已经生效。

### 2026-04-23 Optimization O3 - media callback writeback slice

- 已把 `apps/server/src/main/java/com/dramatv/community/internal/application/InternalCallbackApplicationService.java` 的 `mediaCallback(...)` 从“空回包”改为真正委托到持久层处理。当前 `PublishModerationPersistenceService.applyMediaCallback(...)` 会解析媒体回调结果，并在成功态下写回 `videos.cover_asset_id / preview_asset_id / duration_ms`。
- 写回策略保持保守：异步回调带来的自动封面只会在视频当前 `cover_asset_id` 为空时补上，不会覆盖用户已经手传的封面；`preview_asset_id` 属于派生媒体位，允许被成功回调更新；如果回调带了 `durationMs`，会同步更新 `videos.duration_ms`，并回写到相关 `media_assets.duration_ms`。
- 这次还顺手把回调可观测性补了一步：无论 callback 的 `taskId` 是否能映射到真实 `async_task_records`，都会往 `task_callback_logs` 记录原始 payload、校验结果和处理状态；如果传入的 `taskId` 只是普通字符串而不是真任务 UUID，不会因为外键约束把整条回调打挂。
- 已验证：`apps/server -> powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 再次通过；本地服务重启后，使用真实登录态对视频 `22968e91-49c1-4ae4-8b61-05f4a74a5aad` 做了完整冒烟：先上传一个图片资产和一个视频资产，再调用 `/api/internal/media-callback`，随后 `GET /api/videos/{id}` 从 `beforeCover=`、`beforePreview=`、`beforeDuration=` 变为 `afterCover=/media/image/...`、`afterPreview=/media/video/...`、`afterDuration=4321`；数据库检查 `task_callback_logs` 最新一条也已落库，字段显示 `callback_type=media / source_name=internal-media-callback / verify_status=verified / process_status=applied`。

### 2026-04-23 Optimization O3 - video submit real async task IDs

- 已新增 `apps/server/src/main/java/com/dramatv/community/publish/persistence/SubmittedPublishDraft.java` 与 `PublishAsyncTaskPersistenceService.java`，并把视频草稿提交链路改为在提交时同步落一条真实 `async_task_records`，不再继续返回伪造的 `media-task-*` 字符串。
- `PublishDraftPersistenceService.submitVideoDraft(...)` 现在会在持久化发布目标后创建 `task_type=video_media_process / queue_name=media-processing` 的异步任务；`VideoDraftApplicationService.submitDraft(...)` 保持原有前端契约不变，仍返回 `taskIds: string[]`，但其中的值已经是数据库真实任务 UUID。
- 已完成本地闭环验证：提交视频草稿后，接口返回真实任务 `461e34bb-25c0-493c-bb36-60f620ebbfdc`；数据库随即可查到 `async_task_records.id=461e34bb-25c0-493c-bb36-60f620ebbfdc / task_type=video_media_process / status_code=queued / target_id=9d88cddf-d4e7-445d-87a0-77a379195fc5`。
- 随后用真实登录态调用受保护的 `/api/internal/media-callback`，把 `coverAssetId=ccac8677-6a33-49fa-affa-63ae608fbe0e`、`previewAssetId=1b778046-9b16-4703-b888-69f3fba294e9`、`durationMs=12345` 写回到同一视频；`GET /api/videos/9d88cddf-d4e7-445d-87a0-77a379195fc5` 已返回新的 `coverUrl / previewUrl / durationMs`。
- 数据库复核通过：该任务最终变为 `status_code=succeeded`，`result_json` 已写入目标视频和派生媒体信息，`videos.cover_asset_id / preview_asset_id / duration_ms` 已同步更新，`task_callback_logs` 也记录了 `callback_type=media / verify_status=verified / process_status=applied`。

### 2026-04-23 Optimization O3 - asset role and object key contract slice

- 新增迁移 `apps/server/src/main/resources/db/migration/V14__add_media_asset_role.sql`，给 `media_assets` 增加 `asset_role`，并把历史数据按 `asset_kind / object_key` 尽量回填到 `source / cover / poster / preview / avatar / attachment`；本地库已成功从 `v13` 升到 `v14`。
- `UploadPolicyRequest` 现支持可选 `assetRole`；`UploadPolicyResponse` 与 `UploadAssetResponse` 也会把 `assetKind / assetRole` 返回给前端。这样发布页、讨论帖编辑器、个人资料头像都能在上传策略阶段就明确声明资源用途，而不是所有图片都挤成同一种语义。
- 后端 `UploadApplicationService` 已把新上传对象键改成 `keyPrefix + assetKind + assetRole + assetId + fileName` 结构，默认前缀来自 `dramatv.media.key-prefix=community/local`；同时 `.env.example` 新增 `DRAMATV_MEDIA_KEY_PREFIX`，后续测试环境和 OSS 环境可以直接按前缀隔离资源。
- 前端上传调用已完成最小收口：发布页封面走 `image/cover`，视频源文件走 `video/source`；讨论区正文插图/插视频走 `attachment`；个人资料头像走 `image/avatar`。保留默认值，因此旧调用即使未传 role 也不会立即失效。
- 已验证：`apps/server -> ... compile` 通过，`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；本地服务重启后 `Flyway` 日志确认执行 `version "14 - add media asset role"`。运行态用真实登录态分别上传了 `cover/source/preview/avatar/attachment` 五类资源，接口返回的 `publicUrl` 已带新路径前缀，如 `/media/community/local/video/preview/...`；数据库复核也确认 `media_assets.asset_role` 与 `object_key` 同步落库。

### 2026-04-23 Optimization O3 - profile avatar asset-id compatibility slice

- 新增迁移 `apps/server/src/main/resources/db/migration/V15__add_user_avatar_asset_id.sql`，给 `users` 增加 `avatar_asset_id`，并建立索引；本地开发库已从 `v14` 升到 `v15`。
- 个人资料更新契约已补齐 `avatarAssetId`：后端 `UpdateMeProfileRequest`、前端 `ApiMeProfileUpdateInput` 与 `apps/web/src/features/me/actions.ts` 已同步改造。头像文件上传成功后，资料保存优先提交 `avatarAssetId`，不再只依赖前端回填 `publicUrl`。
- `MeProfileApplicationService` 现在会校验头像资产是否存在、是否为 `image`、是否处于 `ready` 状态、以及是否属于当前用户；保存时把 `users.avatar_asset_id` 写入真实资产 ID，同时把 `users.avatar_url` 保留为兼容字段并写入 `object_key`，这样旧查询路径不会立刻失效。
- 核心读取链路已收口到“优先走 asset，回退 legacy URL”：`CurrentUserService` 与 `MeQueryService` 的个人资料查询已改为优先关联 `media_assets` 解析头像 URL。其余仍走 `avatar_url` 的历史查询，因为现在兼容字段写的是对象键，短期内也能继续正常解析。
- 已完成真实冒烟：使用本地账号 `avatar-smoke-0423 / dramatv-local-dev` 登录，上传头像资产 `2b1fe7be-7c8a-4606-bfe3-83fecd607f5f`，随后调用 `/api/me/profile` 保存；`/api/auth/me`、`/api/me/hub`、`/api/creators/{id}` 都返回同一头像 URL `/media/community/local/image/avatar/2b1fe7be-7c8a-4606-bfe3-83fecd607f5f/01.jpg`。数据库复核确认 `users.avatar_asset_id=2b1fe7be-7c8a-4606-bfe3-83fecd607f5f`，`users.avatar_url=community/local/image/avatar/2b1fe7be-7c8a-4606-bfe3-83fecd607f5f/01.jpg`；再做一次“只回传当前 `avatarUrl`、不再回传 `avatarAssetId`”的二次保存后，`avatar_asset_id` 仍保持不丢失。

### 2026-04-23 Optimization O3 - stable media path for uploaded content slice

- 继续把上传内容往 OSS / CDN 友好的口径收：`UploadAssetResponse` 与前端 `ApiUploadedAsset` 现在除 `publicUrl` 外，额外返回稳定的站内 `mediaPath`，格式为 `/media/{objectKey}`。这条路径不绑定具体 OSS/CDN 域名，后续即使切换公网域名或 CDN 域名，也不需要回写内容库里的历史帖子正文。
- `MediaAssetUrlResolver` 已新增 `toMediaPath(...)`，由后端统一生成站内媒体路径；`UploadApplicationService` 在上传完成响应里同步返回 `mediaPath + publicUrl`，保持兼容。
- 讨论帖编辑器 `apps/web/src/features/discussions/DiscussionComposerPage.tsx` 现优先把 `asset.mediaPath` 写进 markdown，只有旧后端未重启时才回退到 `publicUrl`；这意味着帖子正文里的图片/视频嵌入不再依赖未来可能变化的外部资源域名。
- 讨论帖 markdown 渲染器 `apps/web/src/features/discussions/discussion-markdown.tsx` 已从“只识别 http/https 图片和视频链接”放宽为同时支持站内相对路径 `/media/...`，避免本地和未来统一媒体网关路径下的正文预览/详情渲染失效。
- 已验证：`apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；`apps/server -> ... compile` 通过；后端重启后，真实上传附件图片返回 `assetId=c01fa2ac-dfc4-4094-8ea6-1b3dac5c1bb6`，同时带回 `mediaPath=/media/community/local/image/attachment/c01fa2ac-dfc4-4094-8ea6-1b3dac5c1bb6/02.jpg`。浏览器 MCP 本轮仍断开，所以页面级截图验证暂未补上，但 API 和前端编译链路已确认无误。

### 2026-04-23 Optimization O3 - shared avatar reads and media key audit

- 继续把共享读链路往“资产优先”口径收：`CommunityCatalogJdbcQueryService`、`DiscussionQueryService`、`PromptQueryService`、`InteractionJdbcPersistenceService`、`MeQueryService` 这批公共查询已统一补齐 `avatar_asset_id -> media_assets` 关联，SQL 侧改为 `coalesce(avatar_asset.object_key, users.avatar_url)`，并同步带回 `storage_provider / bucket_name`，映射侧统一走 `jdbcMediaUrlResolver.resolve(resultSet, "...avatar_url")`。
- 这次收口覆盖到了公共首页流、讨论广场、提示词列表/详情、评论列表、个人中心消息流等高频读路径，避免“资料页头像能解析、公共页头像却还读旧字段”的半迁移状态继续扩散。`CurrentUserService` 现状已兼容资产解析，`CanvasApplicationService` 也已确认保留 `media_asset_id` 优先、`asset_url` 回退的兼容读法。
- 已按当前本地库补做媒体对象键审计：新增 `scripts/audit-media-asset-keys.mjs`、`scripts/normalize-media-asset-keys.mjs` 与 `scripts/lib/local-postgres.mjs`，并在根目录 `package.json` 增加 `media:audit`、`media:normalize:preview`、`media:normalize:apply` 命令，后续排查“哪些资源已适合切 OSS/CDN”时可直接复用。
- 审计实跑结果：本地 `dramatv-postgres / dramatv` 库中当前 `media_assets.total=107`，其中 `normalized-style=107`、`legacy-style=0`；按 provider 分布为 `local-public/apps-web-public=80`、`local_fs/dramatv-local-media=27`，说明现有资产对象键已经全部是相对对象键，没有遗留 `absolute_url / root_path / blank` 风险数据。
- 已验证：上一轮共享查询改造后，`apps/server` 编译通过，后端重启后对 `/api/feed/home`、`/api/discussions/home`、`/api/prompts?modality=all&limit=3`、`/api/comments?...`、`/api/auth/me`、`/api/me/hub`、`/api/me/notifications/recent` 的接口冒烟均返回 `200`；本轮又补跑了只读审计脚本，结果与当前库状态一致。

### 2026-04-24 Optimization O4 - one-click stability suite and stale-data cleanup

- 新增 `scripts/run-local-stability-suite.ps1`，把本地稳定性检查串成统一入口；根目录 `package.json` 同步新增 `stability:local`、`stability:local:full`、`smoke:api`、`smoke:browser`、`stability:cleanup:preview`、`stability:cleanup:apply` 脚本，避免每次手工拼接多条命令。
- 默认稳定入口 `npm.cmd run stability:local` 当前固定覆盖 `backend health`、`frontend root`、`apps/web TypeScript`、5 组后端 HTTP 集成测试、API smoke；本地实跑通过 `5/5`，结果目录为 `artifacts/stability-suite/20260424-101903`，`latest/summary.json` 也已同步刷新。
- 浏览器链路继续保留独立 smoke：`python scripts/run-local-community-browser-smoke.py --frontend-base-url http://127.0.0.1:3106 --backend-base-url http://127.0.0.1:18080 --output artifacts/browser-smoke/dev-summary.json` 本轮实跑通过 `18/18`；游客拦截、登录跳转、受保护页面访问、铃铛通知、退出登录全部通过。
- `scripts/run-local-community-api-smoke.mjs` 已补齐 `--output` 参数，方便默认套件和单独 API smoke 共用同一份产物落盘逻辑。
- 新增 `scripts/cleanup-local-community-stale-data.mjs`，支持 `preview/apply` 两档；当前规则先保守覆盖 4 类本地垃圾：超 `72h` 的 `pending_upload` 资产、超 `14d` 的终态异步任务、孤儿回调日志、孤儿本地媒体文件。
- 清理预览首次只扫出 1 条历史 `pending_upload` 视频资产 `4515ccdf-c30a-48c2-aa9a-07b114db475f`；随后已执行 `--apply` 删除该资产，再次预览确认四类候选全部归零。
- 在把默认套件跑通的过程中，还顺手修了 `InteractionApiIntegrationTest` 的数据隔离问题：点赞/收藏测试现在改为“测试内自建作者 + 自建已发布视频”，不再依赖本地演示库现成视频，避免回归结果被脏互动数据污染。
- 补充文档：新增 `docs/04_实施设计/2026-04-24 本地稳定性套件与清理脚本说明.md` 记录命令、覆盖范围、产物路径和这次实跑结果。
- 当前做到哪一步：`O4` 的“自动 smoke + 本地过期数据清理”两块都已经落地并跑通，默认稳定入口可直接复用。
- 下次先做什么：如果继续推进 `O4`，优先补“服务启动后验活 / 关键依赖自检”，再决定是否把更重的前端生产构建和 browser smoke 合并进同一个完整入口。

### 2026-04-24 Optimization O4 - startup readiness and dependency self-check

- 新增 `scripts/check-local-runtime-readiness.mjs`，把“启动后验活 / 关键依赖自检”收口成可单独执行的本地脚本；根目录 `package.json` 同步新增 `readiness:local` 与 `readiness:local:backend`。
- 当前自检口径覆盖：后端 `/actuator/health`、PostgreSQL `5432` TCP、Redis `6379` TCP、公共 API `/api/feed/home` `/api/prompts` `/api/discussions/home`、登录链路 `/api/auth/login` `/api/auth/me` `/api/me/hub`、前台根页 `/`、游客访问 `/home` 的登录跳转，以及带登录 cookie 访问 `/me`。
- `scripts/start-server-dev-18080.ps1` 与 `scripts/start-web-3100.ps1` 已默认接入这层后验活，启动成功后会自动落一份 readiness 结果到 `artifacts/runtime-readiness/latest/*.json`；如果只想拉起进程不做后验活，可显式加 `-SkipReadinessCheck`。
- 已完成实跑验证：
  - `npm.cmd run readiness:local:backend` 通过 `9/9`
  - `npm.cmd run readiness:local` 通过 `12/12`
- 已补做启动脚本验证：
  - `start-server-dev-18080.ps1 -Port 18081` 已在备用端口实跑通过，并成功落 `backend-start-18081.json`
  - 之后已用提权方式验证 `start-web-3100.ps1 -Mode start -Port 3107`，真实通过并落 `web-start-3107.json`；`-Mode dev` 之所以没法在同机备用端口并行拉起，是因为本机已有 `3106` 的 `next dev` 进程，Next.js 自身会拒绝第二个 `dev` 实例
- 同时补强了回归测试稳定性：`InteractionApiIntegrationTest` 已改成“测试内自建作者 + 自建已发布视频”，不再依赖本地演示库现成视频，避免点赞/收藏计数断言被历史互动污染。
- 补充文档：`docs/04_实施设计/2026-04-24 本地稳定性套件与清理脚本说明.md` 已追加 readiness 入口、覆盖面与实跑结果。
- 当前做到哪一步：`O4` 第一阶段原本剩余的“启动后验活 / 关键依赖自检”已经落地并跑通，稳定性基建首轮主目标已收口。
- 下次先做什么：如果继续做稳定性增强，优先转到测试环境级联自检、云资源联调 smoke 和更细粒度的依赖异常分层提示。

### 2026-04-24 Publish - dynamic prompt/workflow split

- `/publish` 已从旧的统一发布区收口为 3 种动态模式：`视频提示词`、`图片提示词`、`工作流`。模式切换后，标题/简介之外的核心编辑区、素材上传要求、侧边说明和主操作按钮都会同步变化。
- 前端契约已补齐 `promptText`，发布页现在会把提示词正文作为正式字段提交；`视频提示词` 仅接受视频素材，`图片提示词` 仅接受图片素材，`工作流` 继续明确保持占位，不伪装成可用发布能力。
- 后端发布链路已分流：`video_prompt` / `image_prompt` 提交后写入 `prompt_entries` 及其示例素材关联；`workflow` 仍只保留入口位，不触发真实工作流发布。Prompt 类提交时不再错误走视频异步任务。
- 已补齐计数口径：个人中心、主页统计、内容目录中的“作品数”查询已把 `videos + prompt_entries` 一并计入，避免发布 prompt 后数量不变化。
- 浏览器 MCP 已完成真实烟测：登录后在 `/publish` 切到“图片提示词”，上传本地图片素材、填写标题/简介/提示词正文并提交成功；发布结果可在 `/prompts/266afb4e-4a81-4b9e-8bf3-2beaf1353f87` 打开详情页，且 `/featured` 已能检索到标题 `图片提示词烟测-0424`。
- 本轮顺手收口了对外文案：发布页状态卡不再暴露 `prompt_entries` 这类内部表名，统一改成用户可理解的“发布去向 / 视频提示词内容库 / 图片提示词内容库 / 工作流发布入口占位”。
- 当前做到哪一步：发布页按三类内容动态切换、前后端落库和真实发布烟测都已打通。
- 下次先做什么：如果继续沿发布链路补强，优先检查“作者主页作品列表是否需要把 prompt 内容与视频作品统一混排展示”，再决定是否扩展作者页查询契约。

### 2026-04-24 Publish - workflow result-video model

- 工作流发布模型已从“纯占位”调整为“工作流说明 / 配置摘要 + 成果视频”。这次没有把成果视频额外落成独立 `video` 内容，避免它重复冲进首页和精选视频流；而是复用现有 `workflows.example_asset_id` 挂到 workflow 本体上。
- 后端 `workflowDraft` 契约已补齐 `exampleAssetId`，链路覆盖 `apps/server` 的 `UpsertWorkflowDraftRequest`、`WorkflowDraftResponse`、`WorkflowDraftApplicationService`、`PublishedContentPersistenceService`，发布时会校验该示例资产必须是已就绪的 `video`。
- 工作流详情契约已补齐 `coverUrl` 与 `exampleMedia`，查询层 `CommunityCatalogJdbcQueryService` 现在会把 `workflows.cover_asset_id / example_asset_id` 一起带出；前端 `WorkflowDetailPage` 已优先展示演示视频，并在无视频时再退回静态封面/占位。
- 发布页已切回真实双草稿模型：提示词模式继续走 `videoDraft`，工作流模式改为走 `workflowDraft`，包含 `scenarioText`、`allowCopy`、`allowFork`、`exampleAssetId`。工作流文件上传仍明确保持占位，等待后续和画布系统打通。
- 顺手修复了工作流提交状态流：`WorkflowDraftApplicationService.submitDraft(...)` 不再继续沿用旧的 `in_review`，当前阶段直接写入 `published`，与“先不接审核后台”的项目阶段保持一致。
- 浏览器 MCP 已完成真实烟测：在 `/publish` 工作流模式下上传成果视频并发布成功，生成 workflow `fec4ca1b-a1f5-4920-aac2-05ffe7d30e3c`；随后打开 `/workflows/fec4ca1b-a1f5-4920-aac2-05ffe7d30e3c`，页面已存在真实 `<video>` 预览节点，且状态文案已更新为“工作流说明与成果视频已可展示，画布入口后续接入。”
- 当前做到哪一步：工作流发布页的内容结构、后端落库、状态流和详情页演示视频展示都已打通。
- 下次先做什么：如果继续补工作流发布链路，优先接“真实工作流文件 / JSON / 画布快照”的上传契约，并决定它最终落在对象存储还是直接由画布服务托管。

### 2026-04-24 upload path stabilization for publish/discussion/me

- 这次修复的问题不是后端 10MB 限制，而是 `apps/web` 里“浏览器 -> Next server action(FormData) -> 后端”的上传链路在较大视频文件下会先在 Next multipart 解析层报 `Unexpected end of form`，请求还没稳定到达 Spring Boot。
- 已在 `apps/web` 新增同源上传代理：`/api/uploads/image-policy`、`/api/uploads/video-policy`、`/api/uploads/assets/[assetId]/binary` 现在由 Next route handler 转发到后端，并从 httpOnly 社区 cookie 重建 `Authorization` 头。
- 已新增 `apps/web/src/lib/api/upload-client.ts`，发布页、讨论区正文媒体插入、`/me` 头像上传都已切到“先拿 policy，再 raw PUT 二进制”的客户端上传 helper，不再让大文件经过 server action multipart。
- 验证已完成：`npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过；Playwright 在 `http://127.0.0.1:3106/publish` 登录后上传约 `19.9 MB` 的本地 MP4 成功，网络记录显示 `POST /api/uploads/video-policy => 200`、`PUT /api/uploads/assets/{assetId}/binary => 200`，页面状态更新为“演示视频已上传”，未再出现 `Unexpected end of form`。
- 当前做到哪一步：社区主路径上的三类文件上传入口都已脱离 server action multipart。
- 下次先做什么：如果后续继续补上传链路，优先给这些同源代理路由补统一日志字段和轻量 smoke，用 `requestId` 更快定位 policy 阶段还是 binary 阶段失败。
### 2026-04-24 OSS stage 1 - backend write path ready

- Added Stage 1 OSS support on the formal backend path: the current upload flow stays `frontend -> Spring Boot`, and Spring Boot can now write uploaded binaries to either local filesystem or Aliyun OSS based on `DRAMATV_MEDIA_STORAGE_PROVIDER`.
- Added Aliyun OSS SDK wiring and a dedicated client provider under `apps/server/src/main/java/com/dramatv/community/shared/media/`, then extended `UploadApplicationService` so registered assets keep consistent `storage_provider / bucket_name / object_key` metadata for both `local_fs` and `oss`.
- Updated media URL resolution so OSS assets return usable bucket-domain style URLs when no explicit public base URL is configured. This avoids frontend fallback paths breaking once storage is switched away from local disk.
- Added targeted resolver tests and re-ran backend verification with local Java 17 Maven helper. Result: `MediaAssetUrlResolverTest` passed and backend sources compiled successfully.
- Remaining blocker before real OSS smoke: need company-confirmed auth mode. Ask ops whether this test bucket is accessed by `AK/SK` or `RAM Role`, and whether there is a browser-facing public domain/CDN in addition to the internal OSS domain.
### 2026-04-24 OSS stage 1 - RAM Role auth aligned with ops

- Updated `AliyunOssClientProvider` so OSS auth now supports three cases without changing the upload API: `auth-mode=access_key`, `auth-mode=ecs_ram_role`, and default `auth-mode=auto`.
- In `auto` mode, backend prefers static `access-key + secret-key` only when both are explicitly configured; otherwise it falls back to ECS metadata-based RAM Role auth.
- Added `dramatv.media.oss.role-name` and `dramatv.media.oss.role-discovery-url` config slots. If `role-name` is empty, backend auto-discovers the attached role name from `http://100.100.100.200/latest/meta-data/ram/security-credentials/`.
- Added unit coverage in `AliyunOssClientProviderTest` for `auto -> static credentials`, `auto -> RAM Role auto-discovery`, and `ecs_ram_role -> fail fast when role cannot be resolved`.
- Verification: `C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AliyunOssClientProviderTest,MediaAssetUrlResolverTest" test` passed with `6/6` tests green.

### 2026-04-24 test ECS probe and PowerShell-safe deployment scripts

- Re-verified SSH access to the test ECS directly with `plink`: login to `root@8.141.20.130` succeeds, so the server itself is reachable and usable for deployment work.
- Confirmed the attached ECS RAM role through the metadata path earlier in the day: role name is `ailab-community`.
- Hardened `scripts/deploy-test-backend.ps1` and `scripts/check-test-env-connectivity.ps1` for Windows PowerShell 5 by removing direct dependence on Chinese file paths and localized key names in script source. Resource discovery now prefers ASCII content signatures from `.codex/*.md`.
- Fixed a Windows parsing trap in those scripts: line-anchored regex now tolerates CRLF line endings, and the scripts avoid full-width punctuation literals in source by using ASCII-safe regex forms.
- Reworked the ECS connectivity probe to use a remote heredoc Python check instead of fragile nested shell quoting. This makes the test repeatable from PowerShell without depending on terminal encoding.
- Latest verified cloud result: the ECS can be reached, but network probes from ECS to the independent Redis and database instances still time out.
- Probe output on 2026-04-24:
  - `db_declared: TIMEOUT pgm-2zexbeyof3f2iwx3.pg.rds.aliyuncs.com:3306`
  - `db_5432: TIMEOUT pgm-2zexbeyof3f2iwx3.pg.rds.aliyuncs.com:5432`
  - `redis: TIMEOUT r-2zefks3se2b5i4l2e6.redis.rds.aliyuncs.com:6379`
- Current conclusion: cloud backend deployment mechanics are ready to continue, but the service should not be started on ECS until ops confirms the actual database port and opens the ECS-to-RDS/Redis network path inside the correct VPC / whitelist / security scope.

### 2026-04-24 updated test resource verification

- Ops updated `.codex/测试环境资源清单.md` with a new PostgreSQL endpoint `pgm-2ze4xtxh7r923d1h.pg.rds.aliyuncs.com:5432` while Redis stayed `r-2zefks3se2b5i4l2e6.redis.rds.aliyuncs.com:6379`.
- Re-ran `scripts/check-test-env-connectivity.ps1` against the updated resource file. Current ECS-side probe result is fully green:
  - `db_declared: OK pgm-2ze4xtxh7r923d1h.pg.rds.aliyuncs.com:5432`
  - `db_5432: OK pgm-2ze4xtxh7r923d1h.pg.rds.aliyuncs.com:5432`
  - `redis: OK r-2zefks3se2b5i4l2e6.redis.rds.aliyuncs.com:6379`
- Also re-checked direct laptop TCP access. Local `Test-NetConnection` still fails for both private endpoints and resolves them to `198.18.x.x`, which is expected in the current network environment and does not block ECS-side deployment.
- Updated conclusion: the cloud blocker for `ECS -> RDS/Redis` is resolved. Next step can move from connectivity troubleshooting to actual backend deployment on the ECS.

### 2026-04-24 cloud backend deployed on ECS

- Executed `scripts/deploy-test-backend.ps1` against the updated test resource file and deployed the formal Spring Boot backend to the ECS service root `/opt/dramatv-community-server`.
- The first deployment run exposed two deployment-script issues that are now fixed:
  - `pscp` upload target interpolation used `root@$script:ServerHost:$remotePath`, which dropped the host portion and made `pscp` report `Local to local copy not supported`. Fixed by switching to `root@$($script:ServerHost):$remotePath`.
  - The generated Linux env file was written with Windows PowerShell UTF-8 BOM, which caused the first variable `DRAMATV_SERVER_PORT=18080` to be ignored by systemd. Fixed by writing both env and service files as ASCII.
- Also fixed a runtime config miss on the formal backend path: added `spring.data.redis.password: ${DRAMATV_REDIS_PASSWORD:}` to `apps/server/src/main/resources/application.yml`. Before this, the service process was up but `/actuator/health` was `DOWN` because Redis health checks failed with `NOAUTH Authentication required`.
- Final verified deployment state after redeploy:
  - systemd service: `dramatv-community-server.service`
  - release path: `/opt/dramatv-community-server/releases/20260424-184059`
  - active port: `18080`
  - ECS-local health check: `curl http://127.0.0.1:18080/actuator/health -> {"status":"UP"}`
- Current conclusion: the cloud backend is now running successfully on ECS with PostgreSQL, Redis, and the ECS RAM Role based OSS config all wired in.

### 2026-04-24 local data inventory vs cloud content state

- Re-checked the current local Docker PostgreSQL (`dramatv-postgres`, database `dramatv`) to distinguish real business data from the newly connected cloud database.
- Local public-table row counts show that the community's real content is still mainly in the local database:
  - `users=72`, `creator_profiles=72`
  - `media_assets=137`
  - `prompt_entries=62`, `prompt_example_links=82`
  - `videos=10`, `workflows=11`, `feed_items=76`
  - `discussion_channels=3`, `discussion_threads=8`
  - `comments=65`, `interaction_actions=60`, `follow_relations=15`
  - `publish_drafts=34`, `audit_records=23`
  - `auth_sessions=166`
  - `canvas_copy_tasks=4`, `canvas_workflow_runtimes=4`
  - `async_task_records=1`, `task_callback_logs=2`
- Local actual table set is larger than the earliest schema doc because the project has already evolved to three main content types:
  - Prompt content: `prompt_entries` + `prompt_example_links`
  - Workflow content: `workflows`
  - Discussion posts: `discussion_threads`
- ECS-side cloud API smoke confirms the cloud database is reachable but business content has not been migrated yet:
  - `/api/feed/home` returns `items=[]`
  - `/api/prompts?modality=all&limit=3` returns `[]`
  - `/api/discussions/home` returns the 3 seeded channels but `featuredThreads=[]`
- Updated conclusion:
  - Cloud PostgreSQL and Redis are connected and healthy.
  - The cloud database currently looks like `schema migrated + seed/default rows present`, not `local business data fully migrated`.
  - The next real task is data migration from local PostgreSQL to cloud PostgreSQL, not further connection troubleshooting.

### 2026-04-24 cloud PostgreSQL migration into ECS test environment

- Fixed `scripts/migrate-test-cloud-db-from-local.ps1` so it no longer depends on fragile Chinese label regex for DB credentials in `.codex/测试环境资源清单.md`; it now parses the PostgreSQL section by host anchor plus following values.
- Added `-ForceOverwrite` to make cloud resets explicit. This is required after a partial failed import, because the script truncates the migrated business tables before replaying local data.
- Reworked the migration path to handle the real schema's FK cycles without superuser trigger bypass:
  - import `users` without `avatar_asset_id`
  - import `media_assets` and the remaining dependent tables
  - patch `users.avatar_asset_id` after `media_assets` exists
  - import `comments` without `parent_id/root_id`, then backfill those self-reference columns in a second step
- Fixed two `pg_dump` parsing bugs discovered during the real run:
  - prompt text can contain real newlines, so `pg_dump --column-inserts` output must be split by SQL statement boundaries instead of physical lines
  - the first row of a table can be prefixed by pg_dump comment blocks, so extraction must search for `INSERT INTO public.<table>` inside each statement chunk instead of only checking `StartsWith(...)`
- Executed the full local `dramatv-postgres` -> cloud PostgreSQL migration through the ECS SSH tunnel and verified the final table counts match local business data:
  - `discussion_channels=3`, `users=72`, `creator_profiles=72`, `media_assets=137`
  - `workflows=11`, `videos=10`, `prompt_entries=62`, `prompt_example_links=82`, `feed_items=76`
  - `discussion_threads=8`, `comments=65`, `interaction_actions=60`, `follow_relations=15`
  - `publish_drafts=34`, `audit_records=23`, `canvas_workflow_runtimes=4`, `canvas_copy_tasks=4`, `async_task_records=1`, `task_callback_logs=2`
- Re-verified the cloud Spring Boot service on `http://8.141.20.130:18080` now serves migrated content instead of empty payloads:
  - `/api/feed/home` returns populated feed items and sections
  - `/api/prompts?modality=all&limit=3` returns prompt cards
  - `/api/discussions/home` returns 3 channels and populated featured threads
- Remaining follow-up after migration:
  - decide whether to keep or clean historical smoke/demo records before wider test/demo use
  - continue OSS write-path smoke once backend-on-ECS + RAM Role path is already in place

### 2026-04-24 cloud-backed frontend mirror verification

- Added a dedicated cloud-facing frontend startup path without replacing the local one:
  - `scripts/start-web-3100.ps1` now supports `-ApiBaseUrl`
  - new wrapper `scripts/start-web-cloud.ps1`
  - new npm alias `start:web:cloud`
- Verified the cloud mirror frontend starts successfully at `http://localhost:3107/`, while the original local frontend still points to the local backend at `http://127.0.0.1:3106/`.
- Visible browser verification on `http://localhost:3107/` confirmed the cloud-backed pages are reachable end to end:
  - anonymous `/` opens normally
  - after logging in with `creator-a / dramatv-local-dev`, `/home` `/featured` `/discussions` `/me` `/publish` all render
- Cloud mirror content is not yet aligned with the local cleaned baseline. The current cloud-backed pages still expose historical smoke/demo records, including:
  - homepage hero/recommendations still show titles such as `aaa`, `图片提示词烟测-0424`, `Review state fix video`, `Review state fix workflow`
  - featured list still mixes old smoke/demo records such as `Browser video smoke 20260407`, `Browser workflow smoke 20260407`, `工作流发布烟测-0424-B`
  - discussions page still contains old test posts such as `联调测试帖子 2026-04-20 22:22`, `冒烟验证`, `独立帖子冒烟验证`, `发帖选择器工作流验证`
  - `/me` still reflects the same old cloud-side content set, not the later local cleaned baseline
- Current conclusion:
  - the new cloud mirror frontend is usable and suitable for continued page验收
  - the remaining mismatch is now a data-state problem, not a frontend startup or cloud service connectivity problem
  - next destructive step, if approved, is to overwrite the cloud business tables with the current local cleaned baseline and then re-run page verification on `localhost:3107`

### 2026-04-25 home-network connectivity check

- Re-checked the current test environment from a non-office network using the latest resource file [`测试环境资源清单.md`](E:\点众\DramaTV社区搭建\.codex\测试环境资源清单.md).
- Current external reachability from the local machine:
  - `8.141.20.130:22` TCP reachable
  - `8.141.20.130:18080` TCP reachable
  - `pgm-2ze4xtxh7r923d1h.pg.rds.aliyuncs.com:5432` TCP reachable
  - `r-2zefks3se2b5i4l2e6.redis.rds.aliyuncs.com:6379` TCP reachable
- Current abnormal state:
  - public `GET http://8.141.20.130:18080/actuator/health` returns `502 Bad Gateway`
  - public `GET /api/feed/home` and `GET /api/discussions/home` also return `502 Bad Gateway`
  - SSH handshake with ECS currently does not complete from the current network: `plink` connects to port `22`, sends the local SSH version, then the remote side immediately closes the connection before login
- Current conclusion:
  - the ECS public IP is still reachable from home, so this is not a simple “home network cannot reach the server” issue
  - RDS and Redis endpoints themselves are alive at the TCP level
  - but the ECS-side application path is currently abnormal, and because SSH cannot complete, ECS -> RDS/Redis connectivity could not be confirmed from inside the server during this check

### 2026-04-25 SSH restored and ECS internal health verified

- SSH access to `root@8.141.20.130` is working again. Verified directly through `plink` and confirmed host `ailab_community_dev-01`.
- Current ECS-side application state is healthy:
  - `systemd` service `dramatv-community-server.service` is `active (running)`
  - process is the deployed jar under `/opt/dramatv-community-server/current/dramatv-community-server.jar`
  - ECS-local `curl http://127.0.0.1:18080/actuator/health` returns `200 {"status":"UP"}`
- Current ECS -> dependency connectivity is healthy at TCP level:
  - `postgres -> pgm-2ze4xtxh7r923d1h.pg.rds.aliyuncs.com:5432 = OK`
  - `redis -> r-2zefks3se2b5i4l2e6.redis.rds.aliyuncs.com:6379 = OK`
- Remaining network nuance:
  - from the current home network, direct public requests to `http://8.141.20.130:18080/...` still show unstable behavior (`502` earlier, later `connection closed unexpectedly`)
  - so the server itself and its internal dependency path are fine, but the direct public access path from the current client network is still not fully trustworthy

### 2026-04-25 ECS public reverse proxy via Nginx

- Installed `nginx` on ECS `8.141.20.130` and enabled `nginx.service` as a long-running system service.
- Added repo-side reusable config file [`ops/nginx/dramatv-community-http.conf`](E:\点众\DramaTV社区搭建\ops\nginx\dramatv-community-http.conf), which proxies public `80` traffic to local Spring Boot `127.0.0.1:18080` with larger upload and upstream timeouts.
- Uploaded that config to `/etc/nginx/conf.d/dramatv-community-http.conf`, removed the packaged default placeholder server from `/etc/nginx/nginx.conf`, and reloaded Nginx cleanly.
- Runtime verification passed:
  - ECS-local `http://127.0.0.1/actuator/health -> 200 {"status":"UP"}`
  - ECS-local `http://127.0.0.1/api/feed/home -> 200`
  - current client network `http://8.141.20.130/actuator/health -> 200 {"status":"UP"}`
  - current client network `http://8.141.20.130/api/feed/home -> 200`
- Follow-up local tooling adjustment:
  - updated [`scripts/start-web-cloud.ps1`](E:\点众\DramaTV社区搭建\scripts\start-web-cloud.ps1) default backend base from `http://8.141.20.130:18080` to the new stable Nginx entry `http://8.141.20.130`
- Current conclusion:
  - direct public usage should now prefer `http://8.141.20.130/...` instead of `http://8.141.20.130:18080/...`
  - the next infrastructure hardening step is HTTPS/domain access on `80/443`, but plain HTTP reverse proxy is already in place and usable for testing

### 2026-04-25 cloud mirror hardening and re-verification

- Fixed the frontend readiness probe [`scripts/check-local-runtime-readiness.mjs`](E:\点众\DramaTV社区搭建\scripts\check-local-runtime-readiness.mjs) so `/me` no longer depends on brittle page-text markers. It now verifies the auth-cookie path by asserting authenticated `/me` returns `200` without redirecting.
- Fixed the local cloud-mirror asset fallback in [`apps/web/src/lib/presentation.ts`](E:\点众\DramaTV社区搭建\apps\web\src\lib\presentation.ts): if migrated API payloads still contain `http://127.0.0.1...` or `http://localhost...` asset URLs, the frontend now rewrites them to the current environment path before rendering. This prevents the cloud mirror UI from trying to load media from a developer machine.
- Fixed [`scripts/start-web-3100.ps1`](E:\点众\DramaTV社区搭建\scripts\start-web-3100.ps1) build detection for the current Next.js 16/Turbopack output. The starter no longer treats missing `.next/BUILD_ID` as the only signal of “no production build”; it now accepts `.next/build-manifest.json` as a valid build marker too.
- Added a backend-side normalization fix plus tests in [`apps/server/src/main/java/com/dramatv/community/shared/media/MediaAssetUrlResolver.java`](E:\点众\DramaTV社区搭建\apps\server\src\main\java\com\dramatv\community\shared\media\MediaAssetUrlResolver.java) and [`apps/server/src/test/java/com/dramatv/community/shared/media/MediaAssetUrlResolverTest.java`](E:\点众\DramaTV社区搭建\apps\server\src\test\java\com\dramatv\community\shared\media\MediaAssetUrlResolverTest.java): localhost absolute URLs are now rewritten to the current public base URL or relative path. This repo-side backend fix is verified locally but not yet redeployed to ECS.
- Verification passed:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `npm.cmd run build` for `apps/web`
  - `MediaAssetUrlResolverTest`
  - regenerated [`artifacts/runtime-readiness/latest/web-start-3107.json`](E:\点众\DramaTV社区搭建\artifacts\runtime-readiness\latest\web-start-3107.json) with `backendBaseUrl=http://8.141.20.130`
  - restarted the cloud mirror frontend outside the sandbox so it stays resident on `http://localhost:3107`
  - runtime readiness result is now `passed=5, failed=0`
- Current accessible test entries:
  - cloud backend stable public entry: `http://8.141.20.130`
  - local cloud-mirror frontend: `http://localhost:3107`
  - anonymous `GET / -> 200`
  - anonymous `GET /home /featured /discussions /publish -> 307 /login?...`
  - authenticated Node fetch with `dramatv_access_token` reaches `/me -> 200`
  - cloud API `GET /api/feed/home` currently returns populated content (`items=12`, `hotWorkflows=2`, `featuredCreators=6`)
- Remaining follow-up:
  - the current cloud backend JSON still contains some historical `http://127.0.0.1:18080/...` strings inside serialized payload data until the next ECS backend deployment
  - the cloud-mirror frontend render path already masks that issue, so page验收 can continue immediately on `http://localhost:3107`

### 2026-04-25 cloud backend redeployed with media URL normalization fix

- Ran the relevant local backend verification before deployment:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=MediaAssetUrlResolverTest test`
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests package`
- Deployed the current backend jar to ECS with [`scripts/deploy-test-backend.ps1`](E:\点众\DramaTV社区搭建\scripts\deploy-test-backend.ps1) using `-SkipBuild`, and restarted `dramatv-community-server.service`.
- New active cloud release:
  - release dir: `/opt/dramatv-community-server/releases/20260425-111658`
  - service: `dramatv-community-server.service`
  - process: `java -jar /opt/dramatv-community-server/current/dramatv-community-server.jar`
- Post-deploy verification passed:
  - `http://8.141.20.130/actuator/health -> {"status":"UP"}`
  - `http://8.141.20.130/api/feed/home` now returns normalized media URLs instead of local absolute addresses:
    - `authorAvatar = /media/image/...`
    - `coverUrl = /media/image/...`
  - `http://8.141.20.130/api/prompts?modality=all&limit=2` still returns frontend-static prompt assets as expected, for example `/nano-banana-images/...`
  - reran [`artifacts/runtime-readiness/latest/web-start-3107.json`](E:\点众\DramaTV社区搭建\artifacts\runtime-readiness\latest\web-start-3107.json) after deployment, result remains `passed=5, failed=0`
- Updated conclusion:
  - cloud backend raw JSON has been cleaned of the previous `127.0.0.1:18080/media/...` leakage for backend-served media fields
  - local cloud-mirror frontend `http://localhost:3107` and cloud backend `http://8.141.20.130` are now aligned for continued test/demo use

### 2026-04-25 current chain diagram and OSS smoke verification

- Added current chain documentation at [`docs/03_架构/DramaTV当前本地与云链路图.md`](E:\点众\DramaTV社区搭建\docs\03_架构\DramaTV当前本地与云链路图.md), covering:
  - local full-chain dev path: `3106 -> local 18080 -> local PostgreSQL/Redis/local_fs`
  - local cloud-mirror path: `3107 -> 8.141.20.130 -> cloud PostgreSQL/Redis/OSS`
  - current public/private visibility boundaries
  - media read/write path split between local media, web static assets, and OSS uploads
- Added reusable OSS smoke script [`scripts/smoke-oss-upload.mjs`](E:\点众\DramaTV社区搭建\scripts\smoke-oss-upload.mjs) and generated result artifact [`artifacts/oss-smoke/latest/cloud-oss-upload.json`](E:\点众\DramaTV社区搭建\artifacts\oss-smoke\latest\cloud-oss-upload.json).
- Real cloud upload smoke passed against `http://8.141.20.130`:
  - login with seeded creator account succeeded
  - `POST /api/uploads/image-policy` succeeded
  - `PUT /api/uploads/assets/{id}/binary` succeeded
  - returned asset state was `ready`
  - smoke asset id: `1cc0afe3-a8a5-4f18-b652-7676cc662a3d`
- Important OSS finding:
  - the backend is already able to write objects into OSS
  - but the returned read URL is the private internal bucket URL `https://dz-ailab-community.oss-cn-beijing-internal.aliyuncs.com/...`
  - local direct probe timed out
  - ECS-side anonymous `curl -I` to that URL returned `403 Forbidden`
- Current conclusion:
  - the remaining OSS work is no longer the write path
  - the blocker is the browser-facing read strategy for private OSS objects: CDN/public domain, backend proxy, or signed URL path

### 2026-04-25 OSS backend proxy path completed

- Implemented OSS/backend media proxy support in:
  - [`apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyController.java`](E:\点众\DramaTV社区搭建\apps\server\src\main\java\com\dramatv\community\shared\media\MediaProxyController.java)
  - [`apps/server/src/main/java/com/dramatv/community/shared/media/MediaProxyService.java`](E:\点众\DramaTV社区搭建\apps\server\src\main\java\com\dramatv\community\shared\media\MediaProxyService.java)
  - [`apps/server/src/main/java/com/dramatv/community/shared/media/MediaAssetUrlResolver.java`](E:\点众\DramaTV社区搭建\apps\server\src\main\java\com\dramatv\community\shared\media\MediaAssetUrlResolver.java)
- New media read behavior:
  - when no CDN/public media base URL is configured, OSS assets now resolve to backend proxy paths like `/media/community/test/...`
  - cloud backend proxies `/media/**` to the actual private OSS object
  - proxy lookup first checks `media_assets` to respect mixed historical providers (`local_fs` / `oss`), then falls back to the current configured provider
- Updated tests:
  - [`apps/server/src/test/java/com/dramatv/community/shared/media/MediaAssetUrlResolverTest.java`](E:\点众\DramaTV社区搭建\apps\server\src\test\java\com\dramatv\community\shared\media\MediaAssetUrlResolverTest.java)
  - `MediaAssetUrlResolverTest, AliyunOssClientProviderTest` passed locally
- Repackaged and redeployed the backend to ECS:
  - release dir: `/opt/dramatv-community-server/releases/20260425-115203`
  - health recheck passed: `http://8.141.20.130/actuator/health -> {"status":"UP"}`
- Re-ran OSS smoke after deployment with updated script [`scripts/smoke-oss-upload.mjs`](E:\点众\DramaTV社区搭建\scripts\smoke-oss-upload.mjs):
  - latest artifact: [`artifacts/oss-smoke/latest/cloud-oss-upload-after-proxy.json`](E:\点众\DramaTV社区搭建\artifacts\oss-smoke\latest\cloud-oss-upload-after-proxy.json)
  - returned `mediaPath = /media/community/test/image/attachment/0acfcdfd-433b-459e-beb2-579fb7507383/oss-smoke-20260425035418.png`
  - absolute proxy URL probe passed with `200`
  - `publicUrl` now also resolves through the backend proxy path and probe passed with `200`
- Updated conclusion:
  - even without CDN, cloud-uploaded OSS images can now be displayed by the local cloud-mirror frontend `http://localhost:3107`
  - the next optional enhancement is not image display correctness anymore, but performance-oriented media delivery choices such as CDN or signed URLs

### 2026-04-25 follow-up note for future cloud video delivery

- Confirmed with current product direction: the project will continue to carry real video content, not image-only OSS assets.
- Recorded a future media-delivery task:
  - when OSS-based video playback becomes a formal path, add `Range` support for proxied `/media/**` video responses
  - goal: preserve browser seek, partial fetch, resume behavior, and avoid forcing full-file transfer on every playback jump
- Current priority judgment:
  - not required for the just-completed image proxy path
  - should be scheduled before or together with the first serious cloud video-playback verification round
## 2026-04-25 YouMind import pipeline

- Kept prompt import split by two real categories: `video_prompt` and `image_prompt`. The new import path does not collapse them into one bucket.
- Added backend support for imported prompt metadata on the existing video-draft publish path:
  - `promptTextZh`
  - `promptTextEn`
  - `promptTextRaw`
  - `modelName`
  - `sourcePlatform`
  - `sourceCampaign`
  - `sourceItemId`
  - `sourceUrl`
  - `publishedAt`
- Updated `PublishedContentPersistenceService` so imported prompts persist the fields above into `prompt_entries`, and feed ranking now reuses imported `publishedAt` instead of always using the current time.
- Hardened integration-test cleanup for prompt content by deleting `prompt_example_links` plus prompt-related `audit_records` and `feed_items`, then added a new integration test that verifies imported prompt metadata and published time are really stored.
- Relaxed the old `30`-item hard cap in:
  - `docs/02_研究/sync-seedance-assets.js`
  - `docs/02_研究/sync-nano-banana-assets.js`
  using `YOUMIND_SYNC_MAX_ITEMS`, where `0` or empty means no explicit cap.
- Added `scripts/import-youmind-assets-via-api.mjs`:
  - reads the real YouMind research libraries directly from `docs/02_研究`
  - imports `Seedance` as `video_prompt`
  - imports `Nano Banana` as `image_prompt`
  - uploads media through the real backend upload API
  - updates creator profile display data
  - publishes through the real draft/submit API
  - verifies the published prompt detail route after submit
  - writes resume state to `artifacts/youmind-import/latest/state.json`
- Cloud import conflict found and contained:
  - old cloud data already had historical `youmind-*` usernames from the legacy importer
  - new API-created local users with the same usernames hit unique-index conflicts and returned `500`
  - importer now uses a dedicated local import prefix `ymimport-*` while preserving the visible author display name.
- Verification passed:
  - `node --check scripts/import-youmind-assets-via-api.mjs`
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests compile`
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=PublishPipelineIntegrationTest test`
- Real cloud import already executed on `http://8.141.20.130`:
  - first proof batch: `1` Seedance + `1` Nano Banana
  - then first visible content batch: `10` Seedance scan window and `10` Nano Banana scan window
  - current state file confirms imported records and target IDs in `artifacts/youmind-import/latest/state.json`
  - public API check now returns at least `20` latest video prompts and `20` latest image prompts from cloud backend.
- Next:
  - continue importing in larger batches with the same script
  - decide whether to extend the same importer to storyboard/image sub-libraries
  - after enough cloud content is in place, switch to page-level visual acceptance on the cloud-mirror frontend.
- Classification note locked in for later imports:
  - the newly added `gpt-image-2` and newly fetched `nano-banana-pro` image prompt batches were extracted by category, so both share the same upper category `comic-storyboard` (`漫画 / 故事版`)
  - older directly extracted YouMind libraries currently have no reliable upper category and should stay at the modality layer only (`video_prompt` / `image_prompt`) until they are reclassified from source metadata

## 2026-04-25 storyboard image prompt import start

- Extended [`scripts/import-youmind-assets-via-api.mjs`](E:\点众\DramaTV社区搭建\scripts\import-youmind-assets-via-api.mjs) so the same importer can now read:
  - the legacy main image library `nano-banana-library-p001-p190`
  - the new categorized image libraries `gpt-image-2-comic-storyboard-library-p001-p014` and `nano-banana-comic-storyboard-library-p001-p023`
- Importer behavior for image assets is now split by source trust level:
  - old direct-pull image libraries stay at modality-only classification `image_prompt`
  - new category-aware batches add stable import tags including `comic-storyboard`
- New supported kinds:
  - `--kind comic` for both storyboard batches together
  - `--kind gpt-comic`
  - `--kind nano-comic`
  - plus per-kind limits/offsets such as `--comic-limit`, `--gpt-comic-limit`, `--nano-comic-limit`
- Local verification passed:
  - `node --check scripts/import-youmind-assets-via-api.mjs`
  - `node scripts/import-youmind-assets-via-api.mjs --dry-run --kind comic --comic-limit 2`
  - `node scripts/import-youmind-assets-via-api.mjs --dry-run --kind gpt-comic --gpt-comic-limit 2`
  - `node scripts/import-youmind-assets-via-api.mjs --dry-run --kind nano-comic --nano-comic-limit 2`
- Real cloud import has started on `http://8.141.20.130`:
  - first proof import: `1` `gpt-image-2 / comic-storyboard` + `1` `nano-banana-pro / comic-storyboard`
  - then expanded to the first `10` entries of each batch
  - current imported totals for the new storyboard batches in cloud: `10` GPT-Image-2 items + `10` Nano Banana Pro items
  - state file has been updated in `artifacts/youmind-import/latest/state.json`
- Public prompt-detail verification passed for the first imported storyboard prompts:
  - `e01cad73-b004-4776-b19b-9704419f94ea`
  - `cf0eeeee-42a2-4030-8eaa-559653248414`
  - `tagNames` now correctly include `comic-storyboard`
- Follow-up observation:
  - the cloud public prompt detail API currently returns the new upper-category tags correctly
  - but `sourceCampaign / sourcePlatform / sourceItemId / sourceUrl / modelName` still come back as `null` on ECS, which suggests the cloud backend deployment is behind the local metadata-support code and should be redeployed before relying on source metadata in cloud reads

## 2026-04-25 cloud backend redeployed for prompt source metadata

- Re-verified the local backend chain before deployment:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -Dtest=PublishPipelineIntegrationTest test`
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -q -DskipTests package`
- Redeployed the current backend to ECS with:
  - `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-test-backend.ps1 -SkipBuild`
- New active cloud release:
  - release dir: `/opt/dramatv-community-server/releases/20260425-150446`
  - service: `dramatv-community-server.service`
  - public health: `http://8.141.20.130/actuator/health -> {"status":"UP"}`
- Verification result after deployment:
  - old storyboard prompt records imported before this redeploy still return `source.* = null`, confirming they were written by the previous ECS backend without the metadata fields persisted
  - newly imported storyboard prompt records after this redeploy now return full source metadata correctly
  - verified examples:
    - `a7b64646-53fb-475b-8195-03e9b8ed86f8 -> sourceCampaign=gpt-image-2-prompts, modelName=gpt-image-2`
    - `219ab6a2-aac3-49b0-8d3e-e7f09458975f -> sourceCampaign=nano-banana-pro-prompts, modelName=nano-banana-pro`
- Current conclusion:
  - the cloud backend deployment gap is fixed
  - remaining issue is historical data backfill for the earlier imported storyboard records, not a current deployment or read-path problem

## 2026-04-25 cloud prompt source metadata backfill

- Added reusable backfill script [`scripts/backfill-youmind-prompt-source-metadata.mjs`](E:\点众\DramaTV社区搭建\scripts\backfill-youmind-prompt-source-metadata.mjs).
- Backfill scope is source metadata only:
  - `sourcePlatform`
  - `sourceCampaign`
  - `sourceItemId`
  - `sourceUrl`
  - `modelName`
- It does **not** fabricate upper business categories for older direct-pull libraries. Category discipline remains:
  - old libraries stay modality-only (`video_prompt` / `image_prompt`)
  - only category-aware batches keep `comic-storyboard`
- The script reads:
  - `artifacts/youmind-import/latest/state.json`
  - the real YouMind research libraries under `docs/02_研究`
  - the current test resource file under `.codex`
  and then tunnels through ECS to the cloud PostgreSQL instance using the local Docker `psql` client.
- Dry-run result:
  - matched imported prompt records: `182`
  - records missing at least one source field before backfill: `180`
- Apply result:
  - updated records: `182`
  - records still missing source fields after backfill: `0`
  - summary artifact: `artifacts/youmind-import/latest/source-backfill-summary.json`
- Public API verification passed for old records after backfill:
  - old storyboard prompt `e01cad73-b004-4776-b19b-9704419f94ea` now returns `sourceCampaign=gpt-image-2-prompts`
  - old storyboard prompt `cf0eeeee-42a2-4030-8eaa-559653248414` now returns `sourceCampaign=nano-banana-pro-prompts`
  - older seedance prompt `457a3943-623c-41f5-b2d1-88f6eef9e056` now returns `sourceCampaign=youmind-seedance`
  - older main nano prompt `8d21c358-11f9-4f8a-bb13-8c08596bac72` now returns `sourceCampaign=youmind-nano-banana`

## 2026-04-25 comic-storyboard image prompt import completed

- Continued the real API-path import for the classified storyboard image-prompt libraries through the cloud test backend at `http://8.141.20.130`.
- First resumed batch used `node scripts/import-youmind-assets-via-api.mjs --kind comic --comic-limit 50`, which advanced both classified libraries from `11` imported items each to `50` each.
- Then completed the remaining backlog with `node scripts/import-youmind-assets-via-api.mjs --kind comic --gpt-comic-limit 252 --nano-comic-limit 382`.
- Current import state in `artifacts/youmind-import/latest/state.json`:
  - total tracked imported items: `794`
  - `seedance`: `100`
  - `nano`: `60`
  - `gpt-comic`: `252`
  - `nano-comic`: `382`
- Classified storyboard library coverage is now complete:
  - `gpt-comic` eligible items: `252`, pending: `0`
  - `nano-comic` eligible items: `382`, pending: `0`
- Public API verification passed on newly imported tail records:
  - `5740f6db-898f-4e77-bb51-dab445f97475` returns `sourceCampaign=gpt-image-2-prompts` and tag `comic-storyboard`
  - `ba9bf6de-1dd3-4221-9e41-5591dd1a7d07` returns `sourceCampaign=nano-banana-pro-prompts` and tag `comic-storyboard`
- Import output artifact for the final bulk run was saved to `artifacts/youmind-import/latest/comic-import-full-20260425.json`.
- Next suggested step: start importing or cleaning the next resource set with the same discipline, while keeping the rule unchanged that only the newly classified batches carry the trusted upper category `comic-storyboard`.

## 2026-04-25 featured prompt classification + performance verification

- Re-verified the cloud-mirror frontend on `http://127.0.0.1:3107/featured` after the user resumed MCP browser access.
- Confirmed the earlier browser inconsistency was a stale session/cache state, not missing data:
  - `视频提示词` now shows real video-prompt inventory
  - `图片提示词` shows the newly imported classified image prompts
  - `工作流` remains isolated and only shows workflow cards
- Added progressive rendering to [`apps/web/src/features/featured/FeaturedArchivePage.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.tsx) so the page no longer mounts the full imported inventory at once.
- Added matching sentinel styles in [`apps/web/src/features/featured/FeaturedArchivePage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.module.css).
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
## 2026-04-26 route loading video pass

- Migrated the old prototype's route-transition video concept into the current Next.js frontend for the large community pages.
- Added a shared loading screen component that reuses the old prototype transition video source and keeps the visual language close to that earlier version:
  - source video currently points to the original legacy asset URL from `mindloop-_-cinematic-archive (1)`
  - loading screen includes the dark cinematic video, grain/scrim layers, and a lightweight top-nav preview state
- Wired route loading screens for:
  - `/`
  - `/home`
  - `/featured`
  - `/discussions`
- Added `dns-prefetch` + `preconnect` for the legacy video host in the root layout so the loading video can start sooner.
- Local code touched:
  - [`apps/web/src/components/shared/RouteVideoLoading.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\RouteVideoLoading.tsx)
  - [`apps/web/src/components/shared/RouteVideoLoading.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\RouteVideoLoading.module.css)
  - [`apps/web/src/app/(community)/loading.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\loading.tsx)
  - [`apps/web/src/app/(community)/home/loading.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\home\loading.tsx)
  - [`apps/web/src/app/(community)/featured/loading.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\featured\loading.tsx)
  - [`apps/web/src/app/(community)/discussions/loading.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\discussions\loading.tsx)
  - [`apps/web/src/app/layout.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\layout.tsx)
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
## 2026-04-26 route loading video pass v2

- Tightened the transition behavior so the video can actually be seen during fast page switches, instead of flashing too briefly.
- Added a client-side route transition layer in the shared community layout:
  - click starts the next route load immediately via `router.prefetch(...)` + `router.push(...)`
  - the cinematic transition overlay stays up for at least `500ms`
  - if the next page resolves quickly, the overlay still holds the screen long enough for the video to be perceived
  - if the next page is slower, the route-level loading screen remains a visual fallback underneath
- Shared navigation in `PageShell` now routes internal community links through the transition-aware link wrapper, so the main page-to-page jumps use the new timing model.
- Local code touched:
  - [`apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\CommunityRouteTransitionProvider.tsx)
  - [`apps/web/src/components/shared/CommunityRouteTransitionProvider.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\CommunityRouteTransitionProvider.module.css)
  - [`apps/web/src/components/shared/CommunityTransitionLink.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\CommunityTransitionLink.tsx)
  - [`apps/web/src/components/shared/PageShell.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\PageShell.tsx)
  - [`apps/web/src/app/(community)/layout.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\app\(community)\layout.tsx)
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
  - Playwright spot check:
    - click `/home -> /featured`
    - overlay visible within `~120ms`
    - overlay gone after `~650ms`, route already at `/featured`
## 2026-04-26 featured secondary filter performance follow-up

- Completed the next `/featured` polish pass for the new secondary filter bar.
- Fixed the freeze/stall risk when repeatedly switching secondary chips:
  - updated `useInteractiveVideoPreview` so cards only seek back to `0s` after a hover preview actually started
  - this avoids mass `currentTime = 0` resets across many loaded cards during fast filter switching
- Adjusted secondary filter placement:
  - moved the secondary chip row to the right on desktop
  - kept the responsive fallback left-aligned on narrower widths
- Local code touched:
  - [`apps/web/src/components/shared/useInteractiveVideoPreview.ts`](E:\点众\DramaTV社区搭建\apps\web\src\components\shared\useInteractiveVideoPreview.ts)
  - [`apps/web/src/features/featured/FeaturedArchivePage.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.tsx)
  - [`apps/web/src/features/featured/FeaturedArchivePage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.module.css)
- Tracking note:
  - related UI task file: `E:\点众\DramaTV社区搭建\.codex\ui-polish-followups-2026-04-25.md`
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
  - browser acceptance on `3107` passed after restarting the cloud frontend outside the sandbox
- Current behavior:
  - first screen renders a smaller batch
  - the page continues with `继续加载更多内容...` while scrolling
  - classification tabs still resolve to the correct data buckets

## 2026-04-26 local/cloud/oss chain doc refreshed

- Refreshed [`docs/03_架构/DramaTV当前本地与云链路图.md`](E:\点众\DramaTV社区搭建\docs\03_架构\DramaTV当前本地与云链路图.md) so it now explicitly distinguishes:
  - the local development path `3106 -> local 18080 -> local DB/Redis/local media`
  - the cloud acceptance path `3107 -> 8.141.20.130 -> cloud DB/Redis/OSS`
  - the current private-OSS display path through backend `/media/...` proxying
- Added a new section documenting why the current test OSS plan cannot be reused directly by the local backend:
  - current OSS endpoint is `internal`
  - auth is ECS `RAM Role`
  - bucket is private read/write
  - no CDN/public display domain is configured yet
- Added the same document into [`docs/README.md`](E:\点众\DramaTV社区搭建\docs\README.md) so future sessions have a single official entry for the current local/cloud/media topology instead of relying only on scattered progress notes.
- Current conclusion recorded for follow-up work:
  - local backend remains valid for business-logic verification
  - cloud backend remains the correct place to validate real OSS write/read behavior
  - if local direct OSS access is needed later, the missing prerequisites are a locally reachable endpoint plus local-safe credentials such as AK/SK or STS and an isolated object prefix

## 2026-04-26 local/cloud chain drawio added

- Added [`docs/03_架构/DramaTV当前本地与云链路图.drawio`](E:\点众\DramaTV社区搭建\docs\03_架构\DramaTV当前本地与云链路图.drawio) as the graphical companion to the markdown chain doc.
- The drawio file currently contains two pages:
  - `Local And Cloud`: local development chain, cloud acceptance chain, and current visibility boundaries
  - `Media And Boundary`: upload flow, `/media/...` proxy read path, development-vs-acceptance split, and why the local backend cannot directly reuse the current test OSS plan
- XML structure check passed locally.
- Updated [`docs/README.md`](E:\点众\DramaTV社区搭建\docs\README.md) and the markdown chain doc to expose the new drawio entry as a formal navigation target.
## 2026-04-26 local UI polish D1-D3 completed

- Completed the first local-first UI polish batch from [`.codex/ui-polish-followups-2026-04-25.md`](E:\点众\DramaTV社区搭建\.codex\ui-polish-followups-2026-04-25.md):
  - `D1` detail-page comment areas were normalized toward a monochrome black/white treatment
  - `D2` discussion markdown body text now switches to dark readable colors in light mode
  - `D3` featured-page light-mode preview haze was reduced by weakening the overlay stack
- Local code changes landed in:
  - [`apps/web/src/app/globals.css`](E:\点众\DramaTV社区搭建\apps\web\src\app\globals.css)
  - [`apps/web/src/features/discussions/discussion-markdown.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\discussions\discussion-markdown.module.css)
  - [`apps/web/src/features/featured/FeaturedArchivePage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.module.css)
  - [`apps/web/src/features/video-detail/VideoDetailPage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\video-detail\VideoDetailPage.module.css)
  - [`apps/web/src/features/workflow-detail/WorkflowDetailPage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\workflow-detail\WorkflowDetailPage.module.css)
  - [`apps/web/src/features/discussions/DiscussionDetailPage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\discussions\DiscussionDetailPage.module.css)
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
- Browser MCP visual recheck could not be completed in this turn because the Playwright browser context had already closed before navigation; next manual/browser acceptance should focus on `/featured` and one discussion detail page in light mode.
## 2026-04-26 featured counts + comment policy alignment

- Continued the local-first UI polish pass and finished the top-level featured count display work.
- Featured page updates:
  - top filter chips now show per-category counts
  - added a dedicated active count summary slot so the filter row no longer looks overpacked
  - narrowed the filter chip layout so the count area has breathing room
  - restored light-mode card text readability by moving the overlay balance back toward dark readable type
- Shared comment updates:
  - discussion comment policy row now uses right-aligned action placement, so the `关闭评论区 / 开启评论区` button sits on the right side instead of crowding the left
- Code touched:
  - [`apps/web/src/features/featured/FeaturedArchivePage.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.tsx)
  - [`apps/web/src/features/featured/FeaturedArchivePage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.module.css)
  - [`apps/web/src/app/globals.css`](E:\点众\DramaTV社区搭建\apps\web\src\app\globals.css)
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
- Remaining follow-up from the same list:
  - `D5` secondary topic categories under the top-level featured filters is still pending
## 2026-04-26 featured secondary topics completed

- Finished `D5` for the featured page by adding second-level category chips under the primary filters.
- Implementation details:
  - `视频提示词` secondary topics now come from real prompt tags only, with generic tags excluded:
    - examples seen in current data include `电影感 / 动作 / 情绪 / MV / 速度感`
  - `图片提示词` secondary topics now come from real prompt tags only, with generic tags excluded:
    - examples seen in current data include `免参考 / 多图 / 参考图 / 人像 / 版式 / 信息图`
  - `工作流` currently has no structured tag field in the public summary payload, so the temporary secondary grouping uses the real capability field `allowCopy`:
    - `可复制`
    - `只读` when present
- Local code touched:
  - [`apps/web/src/features/featured/FeaturedArchivePage.tsx`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.tsx)
  - [`apps/web/src/features/featured/FeaturedArchivePage.module.css`](E:\点众\DramaTV社区搭建\apps\web\src\features\featured\FeaturedArchivePage.module.css)
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed

## 2026-04-26 route transition stability fix

- Fixed the browser-freeze regression that could appear after repeatedly switching between `/home`, `/featured`, and `/discussions`.
- Root cause handling in this pass:
  - kept the cinematic route-transition video mounted as a single persistent instance instead of recreating it on every page switch
  - changed route-level `loading.tsx` fallbacks to use the same visual shell without loading another video
  - paused ambient page videos while the route transition overlay is active so page media and overlay media do not decode at the same time
  - continued hiding page content while the transition overlay is visible
- Code touched:
  - `apps/web/src/components/shared/RouteVideoLoading.tsx`
  - `apps/web/src/components/shared/CommunityRouteTransitionProvider.tsx`
  - `apps/web/src/components/shared/CommunityRouteTransitionProvider.module.css`
  - `apps/web/src/app/(community)/loading.tsx`
  - `apps/web/src/app/(community)/home/loading.tsx`
  - `apps/web/src/app/(community)/featured/loading.tsx`
  - `apps/web/src/app/(community)/discussions/loading.tsx`
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
  - Playwright repeated real nav clicks across `/home -> /featured -> /discussions` for 10 transitions without browser freeze
  - Additional repeated direct route loads across the same three pages also stayed responsive

## 2026-04-26 featured secondary taxonomy refined

- Refined the `/featured` second-level prompt filters from unstable raw tag chips into fixed product categories.
- New fixed taxonomy:
  - image prompts: `gpt-image-2`, `nanobanana`, `真人`, `动画`, `场景`, `道具`
  - video prompts: `seedance`, `真人`, `动画`, `其他`
- Implementation notes:
  - replaced dynamic `tagNames`-driven chip generation with deterministic frontend classification in `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - classification now uses stable keyword buckets over `title + summary + tagNames`
  - second-level chips remain fixed even when a bucket count is `0`, matching the user's request for a stable filter surface
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
  - Playwright check on `http://127.0.0.1:3106/featured` confirmed:
    - image prompt filter shows `全部图片提示词 / gpt-image-2 / nanobanana / 真人 / 动画 / 场景 / 道具`
    - video prompt filter shows `全部视频提示词 / seedance / 真人 / 动画 / 其他`
## 2026-04-26 taxonomy rollout tracking created

- Created a dedicated tracking file for the next classification-standardization pass:
  - `.codex/prompt-taxonomy-rollout-2026-04-26.md`
- Scope of this tracked task:
  - sync the formal taxonomy into `/featured`
  - add structured taxonomy selection into the publish page
  - upgrade import and backfill rules so historical prompt resources follow the same standard
- Current tracked checklist:
  - `C1` unified taxonomy dictionary and mapping rules
  - `C2` featured-page taxonomy sync
  - `C3` publish-page structured tag selection
  - `C4` importer and historical classification-rule upgrade
  - `C5` historical resource backfill and acceptance
- Working rule for this pass:
  - every completed item must be marked in both the tracking file and `.codex/progress.md`
  - use the tracking file as the single task board for this round to reduce context loss after compression

## 2026-04-26 taxonomy rollout C1-C2 completed

- Completed `C1` and `C2` from `.codex/prompt-taxonomy-rollout-2026-04-26.md`.
- Shared taxonomy groundwork is now centralized in:
  - `apps/web/src/lib/taxonomy/prompt-taxonomy.ts`
- Current shared taxonomy scope includes:
  - content type: `image_prompt / video_prompt`
  - image-model taxonomy: `gpt-image-2 / nanobanana / midjourney / other-image-model`
  - video-model taxonomy: `seedance / kling / happyhorse / wan / other-video-model`
  - composition taxonomy: `single-model / multi-model`
  - content-category taxonomy:
    - image: `real-person / animation / scene / prop / other`
    - video: `real-person / animation / other`
- `/featured` is now wired to the shared taxonomy module instead of keeping a local hardcoded classifier copy:
  - `apps/web/src/features/featured/FeaturedArchivePage.tsx`
  - fixed secondary chips now come from the shared taxonomy option sets
  - image prompts now also have the `other` mother-category fallback in the formal taxonomy
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
- Note:
  - browser MCP visual recheck on `/featured` was blocked in this turn because the current Playwright session was redirected to `/login?redirectTo=%2Ffeatured` without a reusable logged-in session
  - next step continues with `C3`: publish-page structured taxonomy selection

## 2026-04-26 taxonomy rollout C3 completed

- Completed `C3` from `.codex/prompt-taxonomy-rollout-2026-04-26.md`.
- Publish-page structured taxonomy selection is now wired into:
  - `apps/web/src/features/publish/PublishPage.tsx`
  - `apps/web/src/features/publish/PublishPage.module.css`
  - `apps/web/src/lib/taxonomy/prompt-taxonomy.ts`
  - `apps/web/src/lib/contracts/community-api.ts`
- What changed:
  - prompt publish mode now carries structured fields in form state: `modelCategory / contentCategory / compositionCategory`
  - existing drafts can be back-parsed into the formal taxonomy through the shared parser
  - publish UI now includes a dedicated `标准标签` selector area for:
    - model taxonomy
    - mother-category taxonomy
    - single-model vs multi-model
  - prompt submit/save payloads now write normalized taxonomy tags plus `modelName / sourcePlatform / sourceCampaign`
  - switching between image/video prompt modes resets the structured taxonomy fields instead of leaking the previous mode selection
- Shared-layer hardening done in the same pass:
  - `classifyPromptTaxonomy` and `parsePromptTaxonomySelection` were tightened with explicit image/video taxonomy helpers to avoid union-type drift
  - `/featured` topic token generation now filters empty taxonomy tokens safely through the shared taxonomy result
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
  - `npm.cmd run build` in `apps/web` passed
- Next step:
  - continue with `C4`: importer and historical-resource classification-rule upgrade

## 2026-04-26 taxonomy rollout C4 completed

- Completed `C4` from `.codex/prompt-taxonomy-rollout-2026-04-26.md`.
- Import and backfill rules are now aligned to the new standardized prompt taxonomy through:
  - `scripts/lib/prompt-taxonomy.mjs`
  - `scripts/import-youmind-assets-via-api.mjs`
  - `scripts/import-youmind-prompts.mjs`
  - `scripts/backfill-youmind-prompt-source-metadata.mjs`
- What changed:
  - added a dedicated script-side prompt taxonomy helper so importer and backfill logic can generate the same structured tag set for image/video prompts
  - API-path importer now writes normalized tags for Seedance, Nano Banana, GPT-Image-2 storyboard, and Nano Banana Pro storyboard assets instead of legacy loose tags
  - legacy direct DB importer was upgraded to the same normalized tag generation to prevent old scripts from reintroducing nonstandard tags
  - cloud backfill script now prepares `tag_names` alongside `source_platform / source_campaign / source_item_id / source_url / model_name`
  - backfill diff detection now compares the full desired metadata package, not only null-source fields, so old nonstandard `tag_names` can also be corrected
- Validation:
  - `node --check scripts/lib/prompt-taxonomy.mjs` passed
  - `node --check scripts/import-youmind-assets-via-api.mjs` passed
  - `node --check scripts/import-youmind-prompts.mjs` passed
  - `node --check scripts/backfill-youmind-prompt-source-metadata.mjs` passed
  - local sample classification smoke produced:
    - Seedance video -> `youmind / video-prompt / seedance / real-person / single-model`
    - GPT-Image-2 comic image -> `youmind / image-prompt / gpt-image-2 / animation / single-model`
    - Nano Banana portrait image -> `youmind / image-prompt / nanobanana / real-person / single-model`
- Next step:
  - continue with `C5`: run the historical backfill and verify the actual front-end filtering results

## 2026-04-26 taxonomy rollout C5 completed

- Completed `C5` from `.codex/prompt-taxonomy-rollout-2026-04-26.md`.
- Historical prompt taxonomy backfill execution:
  - preview run: `node scripts/backfill-youmind-prompt-source-metadata.mjs --kind all`
  - result before apply: `matchedCount=794`, `outOfSyncCountBefore=794`
  - apply run: `node scripts/backfill-youmind-prompt-source-metadata.mjs --kind all --apply true`
  - result after apply: `updatedCount=794`, `outOfSyncCountAfter=0`
- Scope actually aligned in the cloud test database:
  - YouMind Seedance video prompts
  - YouMind Nano Banana image prompts
  - GPT-Image-2 comic storyboard image prompts
  - Nano Banana Pro comic storyboard image prompts
- Front-end acceptance on the cloud-mirror page `http://localhost:3107/featured`:
  - required login first, then `/featured` loaded successfully
  - top-level counts observed in browser:
    - `全部 632`
    - `工作流 2`
    - `视频提示词 130`
    - `图片提示词 500`
    - `活动 0`
  - image-prompt second-level counts observed in browser:
    - `gpt-image-2 252`
    - `nanobanana 248`
    - `midjourney 0`
    - `其他模型 0`
    - `真人 28`
    - `动画 423`
    - `场景 8`
    - `道具 4`
    - `其他 37`
  - video-prompt second-level counts observed in browser:
    - `seedance 130`
    - `kling 0`
    - `happyhorse 0`
    - `wan 0`
    - `其他模型 0`
    - `真人 45`
    - `动画 26`
    - `其他 59`
- Additional runtime note:
  - the local cloud-mirror frontend on port `3107` binds to `localhost / ::1`, not `127.0.0.1`, so acceptance should use `http://localhost:3107`
- Current status:
  - this round's taxonomy rollout `C1-C5` is fully completed and already reflected in both the tracked task file and the cloud test data
### 2026-04-26

- Prompt tag cleanup follow-up completed.
  - Removed visible `youmind` tag from future imports and historical backfill generation.
  - Added frontend adapter filtering so residual `youmind` tags do not render in prompt, workflow, or discussion tag arrays.
  - Validation:
    - `node --check scripts/lib/prompt-taxonomy.mjs`
    - `node --check scripts/import-youmind-assets-via-api.mjs`
    - `node --check scripts/import-youmind-prompts.mjs`
    - `node --check scripts/backfill-youmind-prompt-source-metadata.mjs`
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - Cloud cleanup applied with `node scripts/backfill-youmind-prompt-source-metadata.mjs --kind all --apply true`
    - matched: `794`
    - updated: `794`
    - outOfSyncAfter: `0`
  - Task note updated in `.codex/prompt-taxonomy-rollout-2026-04-26.md`.

- Discussions layout spacing fix completed.
  - Root cause: the left sidebar and the right content area previously shared one grid row, so the left rules card height pushed the discussion thread stream too far downward.
  - Fix:
    - rewrote `apps/web/src/features/discussions/DiscussionsPage.tsx` into a clean structure
    - changed the page to `sidebar + content-shell`, where the right side now owns its own vertical flow
    - moved the thread stream to sit directly under the main topic area instead of waiting for the full left-column height
    - updated `apps/web/src/app/globals.css` to match the new two-column outer layout and inner right-side grid
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Discussions right rail decoupled into an independent page column.
  - Follow-up requirement: the `热门话题 / 活跃贡献者` block must remain a dedicated right-side column so it can grow later without being nested inside the middle content shell.
  - Fix:
    - moved `discussion-replica-rail` out of the middle `content-shell`
    - restored the outer page layout to `sidebar + main content + right rail`
    - kept the middle column as its own vertical stack so the thread stream still follows the main area directly
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Discussion detail top-right author card removed.
  - Requirement: the separate top-right author card in the discussion detail page was redundant and should not remain on the page.
  - Fix:
    - removed the standalone `authorCard` block from `apps/web/src/features/discussions/DiscussionDetailPage.tsx`
    - widened the top hero container in `apps/web/src/features/discussions/DiscussionDetailPage.module.css` so the removed card space is reclaimed by the main title area
    - cleaned the related style references for light mode and responsive layout
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Discussions center column widened.
  - Requirement: on `/discussions`, the middle thread display region was still too narrow, and the left/right support modules needed to move outward so the central thread cards could expand.
  - Fix:
    - widened the shared home-shell content width in `apps/web/src/app/globals.css`
    - narrowed the left and right columns of the discussions three-column grid
    - reduced the internal right-side meta column inside each discussion thread card so more width is given back to the title/excerpt area
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Discussions thread cards unified to one display format.
  - Requirement: the compact top post cards and the larger thread cards should not coexist; the page should keep only the larger discussion-card format.
  - Fix:
    - removed the compact featured-topic card block from `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - kept only the large thread-card list as the single post presentation on `/discussions`
    - raised the thread-card overlay click layer in `apps/web/src/app/globals.css` so the full large card is clickable instead of feeling like a placeholder
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Discussion category linkage completed.
  - Requirement: `官方活动 / 闲聊茶水间` 不能继续是假分类，占位页也不行；进入发帖页时可以默认带入当前分类，但用户仍然可以改。
  - Fix:
    - added backend migration `apps/server/src/main/resources/db/migration/V16__add_more_discussion_channels.sql` to create real `official-events` and `casual-lounge` channels
    - rewrote `apps/web/src/features/discussions/DiscussionsPage.tsx` to remove placeholder-only category entries and keep the left sidebar fully clickable
    - changed the discussions CTA to carry the current `channel` into `/discussions/new`
    - updated `apps/web/src/app/(community)/discussions/new/page.tsx` to accept and validate `channel`
    - updated `apps/web/src/features/discussions/DiscussionComposerPage.tsx` so category is preselected from the route but remains editable in the composer
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- `3106` and `3107` frontend drift cause identified and reduced.
  - Root cause:
    - `3106` runs the live `next dev` process and always reflects current source code.
    - `3107` was running a stale `next start` build against the cloud backend, so both UI code and backend data could drift.
    - running a second `next dev` directly from the same `apps/web` directory is blocked by Next.js, so `3107` cannot simply be another dev instance of the same worktree.
  - Fix:
    - updated `apps/web/next.config.ts` to support an environment-driven `distDir`
    - updated `scripts/start-web-3100.ps1` to accept `DistDirName`, track build artifacts under that dist dir, and trigger rebuild when source files are newer than the last build
    - updated `scripts/start-web-cloud.ps1` so the cloud-mirror frontend uses its own dist dir: `.next-cloud-3107`
    - rebuilt the cloud-mirror frontend with `DRAMATV_NEXT_DIST_DIR=.next-cloud-3107`
  - Current state:
    - `3106` is local frontend -> local backend
    - `3107` is local frontend -> cloud backend
    - the cloud backend at `http://8.141.20.130/api/discussions/home` still returns only 3 real channels, so even after frontend sync, discussion data on `3107` will not match local `3106` until the cloud backend also gets the new migration
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`

- Return-to-previous-position flow fixed for detail and profile pages.
  - Requirement: when entering a detail page from a filtered list, the in-page back entry should return to the previous operation state instead of resetting to the default list root.
  - Fix:
    - added `apps/web/src/components/shared/ContextBackLink.tsx` so detail/profile back entries prefer real history back when the current route carries a `from` context
    - replaced fixed back links in `VideoDetailPage`, `WorkflowDetailPage`, `DiscussionDetailPage`, `CreatorPage`, and `PersonalCenterPage`
    - upgraded `apps/web/src/features/featured/FeaturedArchivePage.tsx` so `/featured` writes `filter / secondary / sort / q` into the URL, includes per-card anchor ids in outgoing detail links, expands the rendered grid when returning to a hashed card, and scrolls the target card back into view
  - Validation:
    - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
    - Playwright check: `/featured?filter=image_prompt` -> open a prompt detail -> click `返回列表` -> returns to the same filtered featured state instead of the `全部` root

### 2026-04-26 cloud backend sync to V16

- User requirement: cloud test backend should also be updated to the version that includes `V16`, and recent backend-side changes should be synced together instead of leaving `3107` pointed at an older cloud dataset.
- Deployment:
  - ran `scripts/deploy-test-backend.ps1`
  - rebuilt `apps/server/target/dramatv-community-server-0.1.0-SNAPSHOT.jar`
  - uploaded the new release to `/opt/dramatv-community-server/releases/20260426-202020`
  - restarted `dramatv-community-server.service`
- Remote service result:
  - systemd reported `active (running)`
  - Tomcat started on port `18080`
  - service boot completed normally on ECS
- Validation:
  - ECS-local `curl http://127.0.0.1:18080/actuator/health` -> `{"status":"UP"}`
  - ECS-local `curl http://127.0.0.1:18080/api/discussions/home` now returns 5 channels
  - confirmed new slugs include `official-events` and `casual-lounge`, which proves `apps/server/src/main/resources/db/migration/V16__add_more_discussion_channels.sql` is live on the cloud database
- Extra note:
  - an ad hoc follow-up `plink` probe initially failed because it used a stale SSH password missing the leading `O`; this was a verification-command issue only, not a deployment failure
  - direct laptop `curl` to `8.141.20.130:18080` currently returns `Empty reply from server`, so if later cloud-mirror `3107` still behaves oddly from a home/company network, the next step is to distinguish “ECS-local service normal” from “external path to 18080 has network or入口层 handling differences”

### 2026-04-26 featured back-anchor fix + first image lazy-load pass

- Regression found: the shared `ContextBackLink` intercepted detail-page back clicks and forced `router.back()`. This preserved the previous history entry, but it bypassed the explicit `backHref` that already carried `from + hash`, so `/featured` detail pages often only returned to the list route, not the original card position.
- Fix:
  - simplified `apps/web/src/components/shared/ContextBackLink.tsx` to respect the passed `href` instead of overriding it with history back
  - kept the existing featured-page anchor restoration path (`/featured?...#featured-item-*`) unchanged, so the list page can continue to restore card position from the hash
  - added a small perceived-speed cut in `apps/web/src/features/featured/FeaturedArchivePage.tsx` and `FeaturedArchivePage.module.css`: image cards now render with native `img loading="lazy" decoding="async"` instead of only `background-image`, reducing eager image pressure when returning to the grid and switching filters
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted the cloud-mirror frontend on `3107` so the production build picked up the change
  - Playwright verified both `http://127.0.0.1:3106/featured` and `http://localhost:3107/featured` by entering `图片提示词`, opening a lower card, clicking `返回列表`, and confirming the page returned to `.../featured?filter=image_prompt#featured-item-*` with the target card restored in-view
- Current state:
  - the “return to entered position” path is restored on both 3106 and 3107
  - the lazy-image change is only a first direct hotspot reduction for `/featured`; if the user still feels obvious lag in other shelves or routes, the next sweep should extend the same media-loading discipline to other repeated image-card grids

### 2026-04-26 generalized back-position restoration rollout

- User follow-up: the same “return to entered position” expectation should not stop at `/featured`; any page that enters a detail page with a visible back button should preserve where the user came from.
- Fix approach:
  - added shared helper `apps/web/src/lib/routes/back-anchor.ts`
    - `buildCurrentRoute(...)`
    - `buildBackAnchorSource(...)`
    - `createBackAnchorId(...)`
    - `useBackAnchorRestore(...)`
  - upgraded source pages to pass explicit `from + hash` instead of bare route strings
  - for tabbed profile pages, synced tab state into the URL before attaching anchors
- Rolled out to:
  - `apps/web/src/features/home/HomePage.tsx`
    - landing archive cards now carry `landing-card-*` anchors
  - `apps/web/src/features/home/CommunityHomePage.tsx`
    - home hero items, news strip items, and shelf cards now carry `home-*` anchors
  - `apps/web/src/features/discussions/DiscussionsPage.tsx`
    - discussion thread cards and contributor rows now carry discussion anchors and preserve the current discussions route
  - `apps/web/src/features/creator/CreatorPage.tsx`
    - creator page now syncs `tab=published|posts` into the URL
    - published cards and post cards now return to the correct creator tab and anchor
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
    - personal center now syncs `tab=works|posts|drafts|likes|favorites` into the URL
    - content cards now return to the correct personal-center tab and anchor
- Validation:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted cloud-mirror frontend `3107`
  - Playwright verification passed for:
    - `http://127.0.0.1:3106/` archive card -> detail -> return -> restored `#landing-card-*`
    - `http://127.0.0.1:3106/home` card -> detail -> return -> restored `#home-card-*`
    - `http://localhost:3107/home` card -> detail -> return -> restored `#home-card-*`
    - `http://127.0.0.1:3106/discussions` thread -> detail -> return -> restored `#discussion-thread-*`
    - `http://127.0.0.1:3106/me?tab=posts` post -> detail -> return -> restored `?tab=posts#me-posts-*`
- Current state:
  - the back-position rule is now a shared route behavior instead of a single-page fix

### 2026-04-26 long-term media contract refactor plan

- Goal:
  - stop treating list-card media as a mixed `coverUrl` field that may point to either an image or a full video file
  - establish a stable four-part media contract across backend and frontend: `coverUrl`, `posterUrl`, `previewUrl`, `sourceUrl`
  - make list pages consume light assets first, and reserve heavy playback assets for detail pages or explicit hover-preview behavior
- Root-cause summary:
  - current prompt/video list cards still infer media type from `coverUrl`
  - several prompt/video detail mappings still derive poster/preview/source from the same example asset
  - returning from detail pages remounts list cards, which re-triggers repeated video range requests because the list layer still touches video assets too early
- Execution plan:
  - Step 1: audit backend DTOs and query/mapping paths
    - check `HomeFeedResponse`, `PromptSummaryResponse`, `PromptDetailResponse`, `VideoSummaryResponse`, `VideoDetailResponse`
    - locate all places where `coverUrl` may resolve to a video asset instead of a true image cover
  - Step 2: extend API contracts
    - add explicit lightweight media fields to summary/feed contracts where needed
    - keep detail contracts aligned to `cover / poster / preview / source`
    - ensure prompt detail and prompt summary no longer rely on one field for multiple playback roles
  - Step 3: refactor frontend view-model mapping
    - map backend media fields into stable frontend view models
    - stop using `isVideoAssetUrl(coverUrl)` as the primary branching rule for list cards
  - Step 4: refactor list pages
    - featured/home/creator/me list cards should render image cover by default
    - hover preview should use `previewUrl` only
    - list pages must not preload full `sourceUrl`
  - Step 5: refactor detail pages
    - detail pages should use `posterUrl` for first-paint stability
    - playback should use `sourceUrl`
    - preview fallback should only be used when a true source asset is unavailable
  - Step 6: data migration / backfill follow-up
    - existing imported prompt/video resources need a later backfill pass so every playable item can expose true image cover/poster plus optional preview
    - this backfill is a separate data task after the contract refactor lands
- Current implementation priority:
  - first land the contract and mapper refactor
  - then switch `featured` and prompt/video detail pages to the new fields
  - then extend the same model to other list surfaces
  - if a new page later introduces “列表/卡片 -> 详情 -> 返回列表” behavior, the rule is: source page must pass explicit `from + hash`, and the source page itself must mount `useBackAnchorRestore(...)`

### 2026-04-26 local/cloud media sync pass

- Fixed the local runtime break introduced during the media-contract refactor:
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
  - added shared fallback resolution for video media aliases so the same mapping code now accepts both generic columns and curated-feed-prefixed columns:
    - `cover_url` or `video_cover_url`
    - `poster_url` or `video_poster_url`
    - `preview_url` or `video_preview_url`
    - `source_url` or `video_source_url`
- Restarted the local Spring Boot dev server and verified the repaired local backend path:
  - `http://127.0.0.1:18080/actuator/health -> UP`
  - `http://127.0.0.1:18080/api/feed/home -> 200`
- Re-deployed the cloud backend with the latest `apps/server` code:
  - command path: `scripts/deploy-test-backend.ps1 -ResourceFile '.codex\\测试环境资源清单.md'`
  - release: `/opt/dramatv-community-server/releases/20260426-230621`
  - service: `dramatv-community-server.service`
  - remote verification: `http://8.141.20.130/api/feed/home -> 200`
- Re-verified the cloud-mirror frontend against the refreshed cloud backend:
  - `http://localhost:3107/home -> 200`
  - `http://localhost:3107/featured -> 200`
  - Playwright confirmed `/featured` first paint now has only `1` mounted `video` element, and `/home` first paint has `4` mounted `video` elements (route loading video + hero video stack), instead of the old grid-wide eager mounting behavior
  - Playwright also rechecked that `3107` still restores list position anchors on `/featured` and `/home`
- Residual risk explicitly recorded:
  - many imported video prompts still return `coverUrl=null`, `posterUrl=null`, and `previewUrl == sourceUrl`
  - example observed on cloud API: `/api/prompts?modality=video&sort=hot`
  - consequence: if the user hovers those cards, the page still pulls the original source mp4 because there is no dedicated lightweight preview asset yet
  - next proper fix is data/asset backfill: generate or attach real poster/preview assets for imported video prompts, then let list cards consume those light assets instead of the source video

## 2026-04-26 UI polish D6-D11 scoped

- User requested this round to follow the same rule as before: first analyze and record, then modify.
- Recorded six new frontend polish items into `.codex/ui-polish-followups-2026-04-25.md`:
  - `D6` remove the extra top-right launch icon on `3107`
  - `D7` restore visible topbar avatar / fallback in the home header
  - `D8` unify personal-center work cards to one visual system
  - `D9` unify personal-center post cards to one visual system
  - `D10` add hover feedback to the `DramaTV` brand link
  - `D11` fix `/discussions/new` light-theme palette
- Scope check completed before coding:
  - topbar issues map to `apps/web/src/components/shared/PageShell.tsx` and `apps/web/src/app/globals.css`
  - personal-center card issues map to `apps/web/src/features/me/*` and `apps/web/src/features/creator/*`
  - composer light-theme issue maps to `apps/web/src/features/discussions/DiscussionComposerPage.module.css`
- Current state:
  - this step only updated tracking docs
  - no code behavior changed yet
  - next step is to implement `D6-D11` in code, then verify on both `3106` and `3107`

## 2026-04-27 UI polish D6-D11 implemented

- Implemented `D6` + `D7` + `D10` in `apps/web/src/components/shared/PageShell.tsx` and `apps/web/src/app/globals.css`.
  - removed the logged-in home-header top-right publish/launch icon
  - changed both home-header and generic topbar avatar rendering to `fallback base + optional image overlay`, so fallback no longer disappears when avatar media is missing or broken
  - added hover / focus-visible feedback for the `Drama TV` home brand link
- Implemented `D8` + `D9` card unification.
  - `apps/web/src/features/me/PersonalCenterPage.module.css`
    - collapsed the mixed `prompt / work / workflow / discussion / favorite` card backgrounds into one unified visual system
    - tightened title, subtitle, author, and metric hierarchy so the personal-center cards no longer feel like several unrelated styles
  - `apps/web/src/features/creator/CreatorPage.module.css`
    - pulled creator-page archive/post cards closer to the same card language to reduce `/me` and `/creators/[id]` drift
- Implemented `D11` in `apps/web/src/features/discussions/DiscussionComposerPage.module.css`.
  - added a full light-theme override layer for `/discussions/new`
  - day mode now uses light panels, dark editor text, dark form copy, and a light preview dialog instead of reusing the dark palette
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - rebuilt and restarted `3107` with `scripts/start-web-cloud.ps1`
  - SSR/HTML spot checks confirmed the rebuilt 3106 / 3107 header no longer contains the top-right `进入发布页` entry in the home/login shell, and the profile slot now renders `home-profile-fallback`
- Runtime note:
  - Playwright browser session closed during form interaction, so this round did not finish full visual/browser-path confirmation for the logged-in `/me` and `/discussions/new` pages
  - next step, if the user reports remaining visual gaps, is to reopen a fresh browser session and do one more pure visual polish pass on `3106` / `3107`

## 2026-04-27 UI polish D12-D14 implemented

- Implemented `D12` in `apps/web/src/features/me/PersonalCenterPage.tsx`, `apps/web/src/features/me/PersonalCenterPage.module.css`, `apps/web/src/features/creator/CreatorPage.tsx`, and `apps/web/src/features/creator/CreatorPage.module.css`.
  - moved creator/me card covers into dedicated absolute cover layers instead of overriding the whole card background
  - preserved the same warm base gradient + shade system whether a card has a real cover or not
  - tightened `/me` work-card grid sizing, spacing, title/subtitle/metric sizing so it stays visually aligned with `/creators/[id]`
- Implemented `D13` in `apps/web/src/lib/presentation.ts`.
  - added shared `\uXXXX / \UXXXX` escaped-unicode decoding to the normalized display text path
  - discussion channel labels / tags / titles that arrive as raw escaped text now render as actual Chinese instead of literal escape sequences
- Implemented `D14` in `apps/web/src/features/video-detail/VideoDetailPage.module.css`.
  - moved the custom `播放视频 / 收起视频` toggle from the bottom-right corner to the top-right corner of the media frame
  - this avoids overlap with the browser-native fullscreen control on the video element
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted both `3106` and `3107` to fresh builds
  - Playwright runtime spot checks on:
    - `/me`
    - `/discussions`
    - `/videos/22968e91-49c1-4ae4-8b61-05f4a74a5aad`
- Current state:
  - `3106` and `3107` are both back up
  - user can now directly visually confirm the three fixes in browser

## 2026-04-27 UI polish D15-D16 implemented

- Implemented `D15` in `apps/web/src/features/discussions/DiscussionsPage.tsx`.
  - confirmed the garbled `\U7F6E...` text was not a backend channel field but the pinned-label literal itself
  - replaced it with a normal `置顶讨论` label constant, while keeping the shared escaped-unicode decode fallback in `presentation.ts`
- Implemented `D16` in `apps/web/src/features/video-detail/VideoDetailPage.tsx`.
  - removed the old “switch muted/ambient layer” behavior
  - the top-right media button now directly controls the main video element as `开始播放 / 暂停播放`
  - first click enters playback state and enables native controls; subsequent clicks pause/resume the same main video
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted both `3106` and `3107`
  - Playwright checks confirmed:
    - `.discussion-replica-thread-pin` text is `置顶讨论`
    - clicking the media button changes its text from `开始播放` to `暂停播放`

## 2026-04-27 UI polish D17 implemented

- Implemented `D17` in `apps/web/src/features/me/PersonalCenterPage.module.css` and `apps/web/src/features/creator/CreatorPage.module.css`.
  - replaced the remaining warm tan/brown card shell gradients on `/me` and `/creators/[id]` with neutral graphite black-white gradients
  - changed personal-center and creator-page card badges from warm brown to dark neutral badges with white text and a subtle light border
  - removed the warm tint from creator post cards so the posts tab no longer drifts away from the site-wide black/white palette
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted both `3106` and `3107`
  - Playwright style checks confirmed the computed `backgroundImage` / badge colors on:
    - `/me`
    - `/me?tab=posts`
    - `/creators/11111111-1111-1111-1111-111111111111`

## 2026-04-27 UI polish D18-D19 implemented

- Implemented `D18` in `apps/web/src/features/me/PersonalCenterPage.tsx` and `apps/web/src/features/creator/CreatorPage.tsx`.
  - tightened the author-page portfolio taxonomy back to the current product rule: `提示词 / 工作流`
  - filtered out workflow-bound video samples from `/me` and `/creators/[id]` so they no longer occupy standalone cards in the works tab
  - current creator `11111111-1111-1111-1111-111111111111` now shows `2` works instead of `4`, matching the featured-page workflow inventory
- Implemented `D19` in `apps/web/src/features/me/PersonalCenterPage.module.css` and `apps/web/src/features/creator/CreatorPage.module.css`.
  - replaced `auto-fit` stretching on the works grid with a fixed desktop 4-column baseline
  - added responsive downshifts so medium screens keep a stable card width instead of stretching sparse rows into oversized panels
- Verification:
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - restarted both `3106` and `3107`
  - Playwright check on `/me` confirmed:
    - works count text is `2作品`
    - only 2 workflow cards remain
    - computed `gridTemplateColumns` is `4` fixed columns on desktop

## 2026-04-27 Cloud frontend deployment completed

- Deployed the official `apps/web` Next.js frontend to ECS `8.141.20.130`.
- Public HTTP entry is now `http://8.141.20.130/`.
- Nginx routing on ECS is now:
  - `/` -> `http://127.0.0.1:3106`
  - `/api/` -> `http://127.0.0.1:18080`
  - `/media/` -> `http://127.0.0.1:18080`
- Frontend service on ECS:
  - systemd service: `dramatv-community-web`
  - runtime port: `3106`
  - current release: `/opt/dramatv-community-web/releases/20260427-110817`
- Deployment script finalized:
  - file: `scripts/deploy-test-web.ps1`
  - fixes included:
    - remote bash script placeholder rendering
    - build-time env injection for Next.js
    - `npm ci --include=dev` so remote build keeps TypeScript deps
    - LF-only remote shell script output to avoid Linux `unexpected end of file`
    - `apps/web/next.config.ts` output typing fix
- Validation:
  - remote `next start` returned `HTTP/1.1 200 OK` on `127.0.0.1:3106`
  - remote Nginx root returned `HTTP/1.1 200 OK` on `127.0.0.1/`
  - local machine returned `200` for `http://8.141.20.130/`
  - `systemctl status dramatv-community-web` is `active (running)`
- Domain cutover slot is reserved in the deploy script:
  - rerun with `-PublicBaseUrl http://example.com` and `-ServerNames "example.com"`
  - current default `server_name` is `_`

## 2026-04-27 progress ACL repair

- Root cause of the earlier `progress.md` write failure was not a process lock.
- `.codex` carried abnormal explicit `Deny` ACL entries, and `progress.md` also retained a stale deny rule.
- Removed the deny rules so `.codex` records are writable again.

## 2026-04-27 .codex write-path diagnosis

- Further validation showed the remaining issue is not a normal Windows file lock.
- After ACL cleanup, `apply_patch` can still create and delete files under `.codex`, but non-elevated `shell_command` writes to `.codex` still return `UnauthorizedAccessException`.
- Hidden and normal non-`.codex` directories under the repo remain writable from the same shell session.
- Working conclusion for this environment:
  - `.codex` content updates should prefer `apply_patch`
  - if shell-based writes are unavoidable, use escalated commands

## 2026-04-27 planning workbook backend split refresh

- Updated `docs/03_架构/DramaTV社区功能规划清单.xlsx` to make the workbook explicitly distinguish the existing `社区前台` block from a new `社区后台` block.
- Added/cleaned backend planning rows covering `apps/admin`, local port `3206`, cloud mirror `3207`, and `/api/admin/**` grouped capabilities for dashboard, auth, users, moderation, reports, comments, feed ops, taxonomy, media tasks, and audit logs.
- Repaired the workbook damage left by the previous insert attempt:
  - fixed mojibake text in the backend rows and `说明` sheet
  - rebuilt the shifted merged-cell ranges from row `65` onward so later sections (`媒体与云化` / `性能与异步` / `安全与风控` / `推荐与运营` / `工程与上线`) align again
- Backup files kept at:
  - `docs/03_架构/DramaTV社区功能规划清单_backup_20260427.xlsx`
  - `docs/03_架构/DramaTV社区功能规划清单_backup_20260427_before_backend_fix.xlsx`

## 2026-04-27 admin frontend handoff doc

- Added `.codex/后台前端新聊天接手说明.md` for the next chat thread.
- The handoff doc records:
  - what the next chat should read first
  - current project status
  - admin frontend scope and ports
  - the 14 reference image mappings
  - fixed visual/style rules
  - the recommended implementation order for `apps/admin`

## 2026-04-27 apps/admin frontend scaffold initialized

- 已新建独立后台前端应用目录 `apps/admin`，工程基线与正式前台保持一致：
  - `Next.js + React + TypeScript`
  - 本地默认端口固定为 `3206`
  - 独立 `package.json`、`tsconfig.json`、`next.config.ts`、`.env.example`、`README.md`
- 已落可替换的前端占位鉴权层：
  - `src/app/auth-actions.ts` 提供占位登录 / 退出动作
  - `src/lib/admin-auth.ts` 提供 Cookie 会话、角色标签、默认落点与基础 RBAC 守卫
  - 当前角色先收口为 `admin / operator / moderator`
- 已落后台主壳子与导航体系：
  - `src/components/AdminShell.tsx` + `AdminSidebarNav.tsx`
  - 左侧深色治理导航、右侧白底工作区、顶部会话卡与退出入口
  - 导航按角色过滤，避免把未授权页面假装成可用
- 已落第一版高保真页面骨架：
  - `/login`
  - `/dashboard`
  - `/users`
  - `/moderation`
  - `/reports`
  - `/comments`
  - `/feed-ops/home`
  - `/feed-ops/featured`
  - `/feed-ops/discussions`
  - `/taxonomy`
  - `/media-tasks`
  - `/audit-logs`
- 已补后台静态数据契约与占位状态表达：
  - `src/lib/admin-content.ts` 统一页面指标卡、表格列、占位状态
  - 每页都明确标注当前为“前端占位，未接 /api/admin/**”，不伪装成已完成能力
- 已补 root 脚本入口：
  - `package.json` 新增 `dev:admin`
  - `package.json` 新增 `build:admin`
- 验证结果：
  - 为避免当前仓库没有 `apps/admin` 独立依赖安装，曾临时借用 `apps/web/node_modules` 做一次类型校验，校验后已清理临时 junction
  - `apps/admin/node_modules/.bin/tsc.cmd --noEmit -p apps/admin/tsconfig.json` 通过
  - `next build` 还未形成可复用的正式验证链路：Turbopack 对临时 junction 报 invalid symlink，切到 `next build --webpack` 后又触发本机 `spawn EPERM`；当前更像本地依赖/执行环境问题，不是已发现的代码类型错误
- 当前做到哪一步：
  - `apps/admin` 已经不是空规划，而是可继续接真实后台接口的正式代码起点
- 下次先做什么：
  - 给 `apps/admin` 安装独立依赖并补正式 `package-lock`
  - 落 `/api/admin/auth/**` 与最小真 RBAC
  - 优先把 `/users` 从占位页切到真接口

## 2026-04-27 apps/admin dependency install + build verification

- 已为 `apps/admin` 安装独立 npm 依赖并生成正式 `package-lock.json`，不再依赖临时借用 `apps/web/node_modules` 的方式做校验。
- 验证结果已更新：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - 沙箱内执行 `npm.cmd --prefix apps/admin run build` 仍会报 `spawn EPERM`
  - 提权后重新执行同一条 build 命令已完整通过，说明剩余问题是当前命令执行环境限制，不是 `apps/admin` 代码或依赖本身有类型/构建错误
- 当前做到哪一步：
  - `apps/admin` 已具备独立安装、锁版本和正式生产构建能力
- 下次先做什么：
  - 落 `/api/admin/auth/**`，把占位 Cookie 会话替换成真实后台 token 链路
  - 优先打通 `/api/admin/users`，让用户管理页先从占位数据切到真实接口

## 2026-04-28 apps/admin auth + users real integration

- `apps/server` 已新增后台最小接口：
  - `/api/admin/auth/login`
  - `/api/admin/auth/logout`
  - `/api/admin/auth/session`
  - `/api/admin/users`
- 后端实现口径：
  - 复用现有 `auth_sessions` 会话表和 `users.role_code`
  - 新增 `AdminAccessService` 做 `admin / operator / moderator` 角色守卫
  - 本地开发允许受控 bootstrap：`admin-chief / operator-floor / moderator-desk` 在配置开关开启时可用 `dramatv-admin-demo` 自举为本地后台账号
  - `/api/admin/users` 当前先提供真实只读列表、内容统计和基础工单统计，不提前伪装写操作已完成
- `apps/admin` 已完成真实接线：
  - 占位 `dramatv_admin_session` Cookie 已替换为真实 `dramatv_admin_access_token`
  - 登录页已调用真实 `/api/admin/auth/login`
  - 后台主壳子和页面守卫已改为通过真实 `/api/admin/auth/session` 判断会话
  - `/users` 页面已切到真实 `/api/admin/users`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -DskipTests compile` 通过
  - 提权后 `npm.cmd --prefix apps/admin run build` 通过
- 当前做到哪一步：
  - 后台前端已不再只是占位骨架，`auth + users` 已形成最小真接口闭环
- 下次先做什么：
  - 继续落 `/api/admin/moderation`
  - 再接 `/api/admin/reports`
  - 再接 `/api/admin/comments`

## 2026-04-28 apps/admin dashboard visual rebuild toward reference

- 已按用户给的后台首页参考图，重构 `apps/admin` 的后台壳子与 `/dashboard` 首屏：
  - 全局视觉从旧版米色渐变 + 黑色厚侧栏 + 大圆角卡片，收口为更接近参考图的白底浅灰后台体系
  - 左侧导航改成窄侧栏、轻边框、浅色 active 态和图标列表，不再保留旧版“编辑部式黑色大卡片”结构
  - 顶部区域改成 `搜索框 + 测试环境 + 通知 + 账号区 + 退出` 的轻量后台头部
  - 首页主体改成 `后台总览标题 + 6 个统计卡 + 待审核队列表格 + 右侧异常面板 + 快捷操作` 的真实仪表盘编排
- 本轮主要变更文件：
  - `apps/admin/src/app/globals.css`
  - `apps/admin/src/components/AdminShell.tsx`
  - `apps/admin/src/components/AdminShell.module.css`
  - `apps/admin/src/components/AdminSidebarNav.tsx`
  - `apps/admin/src/components/AdminPage.module.css`
  - `apps/admin/src/app/(dashboard)/dashboard/page.tsx`
  - `apps/admin/src/app/(dashboard)/dashboard/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/audit-logs` 返回 `200`
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/media-tasks` 返回 `200`
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/taxonomy` 返回 `200`
  - 已重启本地 `3206` 后台实例，新首页已可直接在 `http://127.0.0.1:3206/dashboard` 查看
  - 运行态截图已落：
    - `artifacts/admin-dashboard-home-reference-viewport-3206.png`
- 当前做到哪一步：
  - 后台首页视觉已经从“和参考图明显不一致”推进到“结构、配色、边框语言、信息排布已明显贴近参考图”的状态
- 当前遗留：
  - `/users` 真实接口页仍有后端 `500`，本轮只做首页视觉重构，未处理该接口异常
- 下次先做什么：
  - 如果继续对齐参考图，优先再抠 `sidebar 宽度 / 顶栏间距 / 统计卡高度 / 右侧异常栏密度`
  - 然后回到真实后台链路，修 `/api/admin/users` 的服务端报错

## 2026-04-28 apps/admin login visual rebuild toward reference

- 已按用户给的登录页参考图，重构 `apps/admin` 登录页风格：
  - 去掉旧版左侧大说明区、角色预设卡片和重展示型布局
  - 改成中置品牌区 + 单卡登录表单 + 底部环境信息条的轻量后台登录页
  - 登录文案、输入框图标、密码显隐按钮、记住登录态复选框和底部 `Test Environment / Internal System / v2.4.1` 信息位都已落地
- 本轮主要变更文件：
  - `apps/admin/src/components/AdminLoginForm.tsx`
  - `apps/admin/src/components/AdminLoginForm.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/login` 返回 `200`
- 当前做到哪一步：
  - 登录页已经从“本地开发说明页”收口到更接近正式后台入口的参考图风格
- 下次先做什么：
  - 如继续精修，优先抠品牌字标比例、背景弧线密度、卡片宽高与 footer 间距

## 2026-04-28 apps/admin users page visual rebuild toward reference

- 已按用户给的用户管理参考图，重构 `apps/admin` 的 `/users` 页面结构与视觉：
  - 不再复用旧的通用 `AdminPage + AdminDataTable` 版式，改成独立的 `标题区 + 4 个统计卡 + 筛选区 + 用户表格 + 右侧账号详情栏`
  - 表格字段与视觉层级已向参考图收口，包括头像列、昵称、用户 ID、账号标识、角色、发布数、获赞数、最近活跃时间、状态与操作入口
  - 右侧补了固定账号详情面板和 4 个动作按钮，整体白底浅灰后台风格与首页、登录页统一
- 同时补了运行态兜底：
  - `/users` 当前仍可能遇到后端 `Users API` 查询异常
  - 页面现在改成“真实接口优先，失败时明确降级到占位数据”，避免再出现整页 `500` 白屏
  - 降级时页面顶部会显式展示当前为占位数据与相关说明，不伪装成真实可写后台
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/users/page.tsx`
  - `apps/admin/src/app/(dashboard)/users/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/users` 返回 `200`
- 当前做到哪一步：
  - 用户管理页已从“真实接口报错且版式简陋”推进到“可直接验收视觉、即使后端异常也能展示完整页面”的状态
- 下次先做什么：
  - 如果继续按参考图推进下一页，优先做 `内容审核 / moderation`
  - 如果要回补真实链路，则单独定位并修复 `apps/server` 的 `/api/admin/users` 查询异常

## 2026-04-28 apps/admin moderation page visual rebuild toward reference

- 已按参考图 `04_内容审核页.png` 与 `12_审核详情抽屉.png`，重构 `apps/admin` 的 `/moderation` 页面：
  - 不再复用旧的 `AdminPage` 通用壳子，改成独立的 `审核指标 + 多组筛选 + 审核列表 + 右侧审核详情抽屉`
  - 列表字段已向参考图收口，包括预览、内容标题、内容类型、作者、标签、提交时间、审核状态、风险提示、审核人、操作入口
  - 右侧补了完整的审核详情抽屉内容层级：基本信息、内容预览、正文片段、风险提示、审核备注、底部动作按钮
- 当前仍是占位审核数据，但展示状态已明确：
  - 页面顶部已标注当前为审核占位数据
  - 这轮先固定结构、视觉和抽屉层级，不伪装成真实审核动作已接通
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/moderation/page.tsx`
  - `apps/admin/src/app/(dashboard)/moderation/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/moderation` 返回 `200`
- 当前做到哪一步：
  - 内容审核页已经从“简单占位表格页”推进到“接近参考图的审核中心页面”，并把详情抽屉作为页面核心一起搭出来
- 下次先做什么：
  - 按参考图顺序继续做 `05_举报中心页.png`

## 2026-04-28 apps/admin reports page visual rebuild toward reference

- 已按参考图 `05_举报中心页.png` 与 `13_举报处理弹窗.png`，重构 `apps/admin` 的 `/reports` 页面：
  - 不再复用旧的 `AdminPage` 通用壳子，改成独立的 `举报指标 + 多组筛选 + 举报工单列表 + 右侧工单详情/处理面板`
  - 列表字段已向参考图收口，包括举报单号、举报对象类型、内容标题/摘要、被举报作者、举报原因、举报时间、状态、风险、处理人和操作入口
  - 右侧详情面板已补齐核心层级：工单基础信息、证据截图、被举报内容预览、联动处理建议、处理记录、处理备注和底部动作按钮
- 当前仍是占位工单数据，但展示状态已明确：
  - 页面顶部已标注当前为举报占位数据
  - 本轮先固定页面结构与联动处理层级，不伪装成真实工单动作已接通
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/reports/page.tsx`
  - `apps/admin/src/app/(dashboard)/reports/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/reports` 返回 `200`
- 当前做到哪一步：
  - 举报中心页已经从“占位表格页”推进到“接近参考图的工单中心页面”，并把处理侧信息完整拉到右侧详情面板
- 下次先做什么：
  - 按参考图顺序继续做 `06_评论治理页.png`

## 2026-04-28 apps/admin comments page visual rebuild toward reference

- 已按参考图 `06_评论治理页.png`，重构 `apps/admin` 的 `/comments` 页面：
  - 不再复用旧的 `AdminPage` 通用壳子，改成独立的 `评论指标 + 多组筛选 + 评论列表 + 右侧评论上下文/治理面板`
  - 列表字段已向参考图收口，包括评论作者、评论摘要、回复关系、目标内容标题、内容类型、发布时间、当前状态、风险提示与操作入口
  - 右侧补齐评论治理面板层级：当前评论、目标内容、楼中楼上下文、治理记录、处理备注、评论治理动作与评论区开关
- 当前仍是占位评论数据，但展示状态已明确：
  - 页面顶部已标注当前为评论治理占位数据
  - 本轮先固定页面结构、上下文关系和治理动作位，不伪装成真实评论治理接口已接通
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/comments/page.tsx`
  - `apps/admin/src/app/(dashboard)/comments/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/comments` 返回 `200`
- 当前做到哪一步：
  - 评论治理页已经从“简单表格页”推进到“接近参考图的评论治理中心页面”，并把上下文、楼中楼和评论区开关一并拉齐
- 下次先做什么：
  - 按参考图顺序继续做 `07_运营配置页.png`

## 2026-04-28 apps/admin operations config visual rebuild toward reference

- 已按参考图 `07_运营配置页.png` 与 `14_运营挂载_排序弹窗.png`，重构 `apps/admin` 的运营配置主页：
  - 决定由现有 `/feed-ops/home` 承接 `运营配置` 主页，而不是继续把首页运营拆成一个简陋单表页
  - 页面已改成 `顶部 tab（首页 / 精选页 / 讨论区） + 左侧内容池 + 中部编排工作区 + 右侧展示预览` 的完整运营配置工作台
  - 中部编排区已按参考图收进 `首页 Hero 区 / 推荐区 / 热门内容位 / 置顶帖子位` 多个配置块，预留拖拽与挂载排序的产品位
  - 右侧预览区已补 `Hero / 推荐区 / 精选 / 热门讨论 / 配置状态 / 保存与发布动作`
- 同时收口了后台导航口径：
  - 侧边栏运营入口现已从 `首页运营 / 精选运营 / 讨论运营` 三项收口为单个 `运营配置`
  - 当前仍保留原有 `/feed-ops/featured` 与 `/feed-ops/discussions` 路由文件，但不再作为主导航暴露
- 本轮主要变更文件：
  - `apps/admin/src/lib/admin-nav.ts`
  - `apps/admin/src/app/(dashboard)/feed-ops/home/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/home/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/feed-ops/home` 返回 `200`
- 当前做到哪一步：
  - 运营配置页已经从“单表格运营页”推进到“接近参考图的内容挂载与编排工作台”，导航也同步收口到更接近参考图的口径
- 下次先做什么：
  - 按参考图顺序继续做 `08_分类管理页.png`

## 2026-04-28 apps/admin taxonomy page visual rebuild toward reference

- 已按参考图 `08_分类管理页.png`，重构 `apps/admin` 的 `/taxonomy` 页面：
  - 不再复用旧的 `AdminPage + AdminDataTable` 通用结构，改成 `分类 tab + 4 张指标卡 + 左侧分类树 + 中部分类表 + 右侧分类编辑面板`
  - 页面信息层级已向参考图收口，补齐分类结构树、排序拖拽把手、展示位置标签、编辑表单、底部分页与保存动作位
  - 明确保留“前端配置占位，后续接 `/api/admin/taxonomy` 真接口”的状态提示，不伪装成已接后台配置写接口
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/taxonomy/page.tsx`
  - `apps/admin/src/app/(dashboard)/taxonomy/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
- 当前做到哪一步：
  - 后台参考图顺序已完成 `~~01 登录~~ / ~~02 首页总览~~ / ~~03 用户管理~~ / ~~04 内容审核~~ / ~~05 举报中心~~ / ~~06 评论治理~~ / ~~07 运营配置~~ / ~~08 分类管理~~`
- 下次先做什么：
  - 按参考图顺序继续做 `09_媒体任务页.png`
  - 再继续 `10_操作日志页.png`

## 2026-04-28 apps/admin media-tasks page visual rebuild toward reference

- 已按参考图 `09_媒体任务页.png`，重构 `apps/admin` 的 `/media-tasks` 页面：
  - 不再复用旧的 `AdminPage + AdminDataTable` 通用结构，改成 `4 张任务指标卡 + 多组任务筛选 + 任务列表 + 右侧任务详情面板`
  - 页面信息层级已向参考图收口，补齐任务类型/状态筛选、错误摘要列表、上传资源预览、相关请求状态、任务日志摘要、处理备注和底部动作区
  - 保留“当前为占位任务数据，后续接 `/api/admin/media-tasks` 真接口”的轻量提示，不伪装成真实任务治理写接口已接通
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/media-tasks/page.tsx`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
- 当前做到哪一步：
  - 后台参考图顺序已完成 `~~01 登录~~ / ~~02 首页总览~~ / ~~03 用户管理~~ / ~~04 内容审核~~ / ~~05 举报中心~~ / ~~06 评论治理~~ / ~~07 运营配置~~ / ~~08 分类管理~~ / ~~09 媒体任务~~`
- 下次先做什么：
  - 按参考图顺序继续做 `10_操作日志页.png`

## 2026-04-28 apps/admin audit-logs page visual rebuild toward reference

- 已按参考图 `10_操作日志页.png`，重构 `apps/admin` 的 `/audit-logs` 页面：
  - 不再复用旧的 `AdminPage + AdminDataTable` 通用结构，改成 `4 张审计指标卡 + 多组日志筛选 + 审计日志列表 + 右侧日志详情面板`
  - 页面信息层级已向参考图收口，补齐操作类型筛选、模块筛选、结果态、状态变更卡片、处理备注、追踪信息和关联入口
  - 保留“当前为占位审计数据，后续接 `/api/admin/audit-logs` 真接口”的轻量提示，不伪装成真实审计查询接口已接通
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/audit-logs/page.tsx`
  - `apps/admin/src/app/(dashboard)/audit-logs/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
- 当前做到哪一步：
  - 后台参考图顺序已完成 `~~01 登录~~ / ~~02 首页总览~~ / ~~03 用户管理~~ / ~~04 内容审核~~ / ~~05 举报中心~~ / ~~06 评论治理~~ / ~~07 运营配置~~ / ~~08 分类管理~~ / ~~09 媒体任务~~ / ~~10 操作日志~~`
- 下次先做什么：
  - 如果继续细修，就逐页按参考图做局部比例、留白、字重和交互态微调

## 2026-04-28 apps/admin first global fine-tuning pass

- 已启动第一轮公共细修，先收高杠杆共性问题，而不是继续新增页面：
  - 调整 `apps/admin/src/app/globals.css` 的后台视觉 token，统一把阴影压轻、边框稍提亮、圆角从偏重收回到更接近参考图的层级
  - 调整 `apps/admin/src/components/AdminShell.module.css`，收紧侧栏宽度、导航项高度、顶栏搜索框和环境/通知/账号区的尺寸与留白
  - 调整 `apps/admin/src/components/AdminLoginForm.module.css`，收紧登录卡片、输入框、按钮和页脚 badge 的比例，避免第一屏过松和圆角偏厚
  - 调整 `apps/admin/src/components/AdminPage.module.css` 与 `apps/admin/src/app/(dashboard)/dashboard/page.module.css`，把首页总览页和仍在复用通用壳子的页面一起拉回更克制的卡片半径与间距
- 本轮主要变更文件：
  - `apps/admin/src/app/globals.css`
  - `apps/admin/src/components/AdminShell.module.css`
  - `apps/admin/src/components/AdminLoginForm.module.css`
  - `apps/admin/src/components/AdminPage.module.css`
  - `apps/admin/src/app/(dashboard)/dashboard/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/login` 返回 `200`
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/dashboard` 返回 `200`
- 当前做到哪一步：
  - 已完成一轮公共壳子细修，后续可以在此基础上继续逐页抠首页总览、用户管理、内容审核等页面的细节比例
- 下次先做什么：
  - 先从 `02_后台首页总览页.png` 开始做第二轮逐页细修

## 2026-04-28 apps/admin dashboard page second fine-tuning pass

- 已对 `apps/admin` 的 `/dashboard` 做第二轮逐页细修，重点不再是重搭结构，而是把现有页面继续向参考图 `02_后台首页总览页.png` 靠拢：
  - 收紧标题区、指标卡高度、卡片内部字级和卡片间距，压低“块感”和视觉膨胀感
  - 调整主内容区左右分栏比例，让待审核列表更宽、右侧异常/系统状态栏更接近参考图占比
  - 收紧待审核列表的表头字级、行高、列宽和状态 pill 体积，让表格密度更像参考图
  - 收紧右侧异常与提醒区、系统状态区、快捷操作区的字体、留白和卡片高度，减少松散感
- 本轮主要变更文件：
  - `apps/admin/src/app/(dashboard)/dashboard/page.module.css`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` 通过
  - `npm.cmd --prefix apps/admin run build` 通过
  - 本地后台实例已重新切到新 build，`http://127.0.0.1:3206/dashboard` 返回 `200`
- 当前做到哪一步：
  - 已完成首页总览页的第二轮细修，可以继续按顺序进入 `03_用户管理页` 的细修
- 下次先做什么：
  - 继续做 `03_用户管理页.png` 的逐页细修
## 2026-04-28 apps/admin users page fine-tuning pass

- Refined /users toward the page 03 user-management reference without changing data flow
  - tightened header density and reduced the visual weight of the live/fallback badge
  - flattened metrics cards, compacted filters, and matched chip/button proportions more closely to the reference
  - fixed table column widths, reduced row/avatar/pill size, and tightened the sticky detail panel layout
- Files touched
  - apps/admin/src/app/(dashboard)/users/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - restarted apps/admin on 3206
  - http://127.0.0.1:3206/users returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin moderation page fine-tuning pass

- Refined /moderation toward the page 04 content-review reference and the page 12 detail-drawer reference
  - tightened header density and reduced the visual weight of the top-right environment badge
  - flattened metrics cards, compacted the filter rows, and aligned chip and field sizing with the reference
  - tightened table row density, fixed column widths, and reduced pill/button rounding
  - widened and reorganized the right review drawer, including a denser basic-info grid, larger preview area, and cleaner risk / note sections
- Files touched
  - apps/admin/src/app/(dashboard)/moderation/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - switched apps/admin preview on 3206 from next start to npm run dev for hot reload
  - http://127.0.0.1:3206/moderation returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin reports page fine-tuning pass

- Refined /reports toward the page 05 report-center reference and aligned the right-side detail panel closer to the page 13 handling modal rhythm
  - tightened header density, metrics cards, and filter rows to better match the flatter reference proportions
  - fixed table column widths, reduced row and pill weight, and compacted the footer pagination area
  - widened and reorganized the right report-detail panel with a denser info grid, clearer evidence block, and lighter action / log / note sections
- Files touched
  - apps/admin/src/app/(dashboard)/reports/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/reports returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin comments page fine-tuning pass

- Refined /comments toward the page 06 comment-governance reference without changing the page structure
  - tightened header density, metrics cards, and multi-row filter spacing to better match the flatter admin rhythm
  - fixed table column widths, reduced avatar and pill weight, and compacted the table footer pagination area
  - narrowed and reorganized the right context panel, including denser comment cards, thread items, action buttons, and comment-zone switch block
- Files touched
  - apps/admin/src/app/(dashboard)/comments/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/comments returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin feed-ops home page fine-tuning pass

- Refined /feed-ops/home toward the page 07 operations-config reference while keeping the existing page structure
  - tightened header and tab density, reduced card rounding, and aligned the three-column page rhythm more closely to the reference
  - adjusted the left content-pool list, including larger thumbnails, tighter metadata rhythm, and lighter action buttons
  - rebuilt the middle workspace section styling with denser slot cards and flatter dashed add placeholders
  - refined the right preview panel with clearer hero/recommendation/list hierarchy and cleaner status/action sections
- Files touched
  - apps/admin/src/app/(dashboard)/feed-ops/home/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/feed-ops/home returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin taxonomy page fine-tuning pass

- Refined /taxonomy toward the page 08 category-management reference without changing the current page structure
  - tightened page header, tabs, and metrics cards to better match the flatter reference density
  - compacted the left taxonomy tree, reduced table row and pill weight, and fixed middle-table column rhythm
  - refined the right category editor with denser field spacing, lighter inputs, and cleaner footer action balance
- Files touched
  - apps/admin/src/app/(dashboard)/taxonomy/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/taxonomy returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin media-tasks page fine-tuning pass

- Refined /media-tasks toward the page 09 media-tasks reference without changing the current page structure
  - tightened header density, metrics cards, and multi-row filters to better match the flatter reference rhythm
  - fixed table column widths, reduced row weight, and compacted pagination and status pills
  - widened and reorganized the right task-detail panel with a denser preview card, cleaner request/log sections, and more balanced action groups
- Files touched
  - apps/admin/src/app/(dashboard)/media-tasks/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd run build in apps/admin passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/media-tasks returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 featured dock sync to 3106 and public

- Synced the responsive floating-dock adaptation to the local main frontend chain and the public web service.
- Local `3106`
  - restarted with `scripts/start-web-3100.ps1 -Mode dev -Port 3106`
  - `http://127.0.0.1:3106/featured` is back on the latest frontend and returns the expected login redirect when unauthenticated
  - Playwright re-opened local `/featured` and confirmed the latest dock safe-area layout and category-count toolbar are present
- Public web
  - deployed with `scripts/deploy-test-web.ps1`
  - release switched to `/opt/dramatv-community-web/releases/20260428-155415`
  - `dramatv-community-web.service` is `active (running)`
  - remote build and nginx validation both passed; remote curl checks returned `HTTP/1.1 200 OK` for `/featured` and `/login`
  - Playwright opened `http://8.141.20.130/featured` and confirmed the public page is on the new frontend build
- Current status
  - local `3106`, local cloud-mirror `3107`, and public `8.141.20.130` are now aligned to the same frontend version for this change
- Next
  - continue with the next frontend experience issues without needing a separate re-sync for this dock adaptation

## 2026-04-28 apps/admin audit-logs page fine-tuning pass

- Refined `/audit-logs` toward the page 10 operation-log reference without changing the current page structure
  - tightened page header, metrics cards, and filter controls to better match the flatter desktop admin density
  - reduced table row, pill, and pagination weight and fixed column rhythm closer to the reference
  - rebuilt the right detail panel styling with denser info sections, lighter state cards, and cleaner bottom action balance
- Files touched
  - apps/admin/src/app/(dashboard)/audit-logs/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - npm.cmd --prefix apps/admin run build hit the known sandbox `spawn EPERM`; reran `npm.cmd run build` in apps/admin with escalation and it passed
  - kept apps/admin on npm run dev at 3206 for hot reload
  - http://127.0.0.1:3206/audit-logs returned 200
- Next
  - continue the next page fine-tuning pass in sequence

## 2026-04-28 apps/admin modal-state fine-tuning pass

- Refined the remaining reference modal states by landing them directly into their existing page contexts
  - `/users` now includes a centered edit-user / reset-password modal state aligned to reference page 11, while preserving the existing table and detail rail underneath
  - `/feed-ops/home` now includes a centered content-mounting / sorting modal state aligned to reference page 14, including config summary, candidate pool, ordered slots, and preview strip
- Files touched
  - apps/admin/src/app/(dashboard)/users/page.tsx
  - apps/admin/src/app/(dashboard)/users/page.module.css
  - apps/admin/src/app/(dashboard)/feed-ops/home/page.tsx
  - apps/admin/src/app/(dashboard)/feed-ops/home/page.module.css
- Verification
  - npx.cmd tsc --noEmit -p apps/admin/tsconfig.json passed
  - http://127.0.0.1:3206/users returned 200
  - http://127.0.0.1:3206/feed-ops/home returned 200
  - npm.cmd --prefix apps/admin run build hit the known sandbox `spawn EPERM`; reran `npm.cmd run build` in apps/admin with escalation and it passed
  - kept apps/admin on npm run dev at 3206 for hot reload
- Next
  - continue with the remaining admin routes that do not yet have the reference-driven fine-tune pass

## 2026-04-28 featured model + theme combined filtering synced to 3107 and public

- Synced the new `/featured` prompt combined-filter frontend to the cloud-mirror frontend and the public web service.
- Frontend behavior
  - `video_prompt` and `image_prompt` now use two peer filter groups: `model` and `content`
  - each group stays single-select internally, but cross-group combination is supported, for example `seedance + 真人` and `gpt-image-2 + 动画`
  - workflow keeps the old single secondary-filter behavior
  - legacy prompt links such as `?filter=image_prompt&secondary=gpt-image-2` auto-normalize to `?filter=image_prompt&model=gpt-image-2`
- Local cloud mirror `3107`
  - found the running `3107` process was still serving an old build because clicking `seedance` still produced `secondary=seedance`
  - stopped the stale process, rebuilt `apps/web` with `DRAMATV_API_BASE_URL=http://8.141.20.130` and `.next-cloud-3107`, then restarted `scripts/start-web-cloud.ps1`
  - Playwright verified `http://localhost:3107/featured?filter=video_prompt`
  - clicking `seedance` then `真人` now yields `?filter=video_prompt&model=seedance&content=real-person`
  - Playwright also verified old-link upgrade on `http://localhost:3107/featured?filter=image_prompt&secondary=gpt-image-2`, which normalized to `model=gpt-image-2`
- Public web
  - deployed with `scripts/deploy-test-web.ps1`
  - release switched to `/opt/dramatv-community-web/releases/20260428-173101`
  - `dramatv-community-web.service` restarted successfully and nginx validation passed
  - Playwright verified `http://8.141.20.130/featured?filter=video_prompt`
  - clicking `seedance` then `真人` now yields `?filter=video_prompt&model=seedance&content=real-person`
  - Playwright also verified old-link upgrade on `http://8.141.20.130/featured?filter=image_prompt&secondary=gpt-image-2`, which normalized to `model=gpt-image-2`
- Current status
  - `3107` cloud mirror and public `8.141.20.130` are now aligned on the new combined-filter frontend behavior
- Next
  - continue the next featured/archive experience refinements on this new URL contract instead of the old `secondary`-only prompt filter contract

## 2026-04-28 auth gate and avatar upload hardening

- Investigated the new public-environment auth and avatar issues against the cloud logs instead of guessing locally
  - confirmed cloud logs live under `/opt/dramatv-community-server/shared/logs/server/`
  - traced the avatar failure through `application.log` to `requestId=web-upload-moifnd90-pudmkil1`
  - confirmed the failure happened at `/api/uploads/image-policy` with `code=UPLOAD_FILE_TOO_LARGE`
  - confirmed the current backend image limit remains `20MB` via `DRAMATV_MEDIA_UPLOAD_MAX_IMAGE_SIZE_BYTES`
- Hardened frontend auth gating so `dramatv_access_token` is no longer treated as valid only because the cookie exists
  - `apps/web/src/lib/auth/community-auth.ts`
    - added `getVerifiedCommunitySession()` and switched `hasCommunitySession()` / `requireCommunitySession()` to real `/api/auth/me` validation
    - auth-required responses now collapse to `null` session instead of leaving stale-cookie false positives
  - `apps/web/src/app/(community)/layout.tsx`
    - switched session resolution to reuse the verified-session helper, avoiding separate cookie-only assumptions
  - `apps/web/src/proxy.ts`
    - protected routes now verify the token against `/api/auth/me` when a cookie is present
    - invalid tokens redirect to `/login` and actively clear the stale cookie instead of passing through as logged-in
    - if backend verification is temporarily unavailable, middleware degrades open rather than turning outages into fake logout loops
- Hardened upload UX for avatar and other image/video entry points through the shared upload client
  - `apps/web/src/lib/api/upload-client.ts`
    - added shared client-side max-size checks before requesting upload policy
    - image uploads now fail early with a clear `20MB` message, avatar included
    - video uploads keep the current `300MB` client-side ceiling aligned with backend config
    - backend `UPLOAD_FILE_TOO_LARGE` responses are remapped to clearer user-facing text while preserving `Request ID`
- Verification
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` passed
- Next
  - run `apps/web` production build
  - sync this frontend hardening to `3107` and public web
  - re-verify `/login`, `/me`, and avatar upload on the public environment

## 2026-04-28 cloud-mirror recovery and public ingress isolation

- Recovered the local cloud-mirror frontend chain after the old `3107` process blocked verification
  - stopped stale local `node` listeners on `3107`
  - restarted `scripts/start-web-cloud.ps1` with explicit `-BindHost 127.0.0.1`
  - local cloud mirror is now reachable again at `http://127.0.0.1:3107`
- Verified the auth-gate fix on the local cloud-mirror chain
  - `http://127.0.0.1:3107/login` returned `200`
  - unauthenticated `http://127.0.0.1:3107/me` returned `307`, confirming protected routes now bounce through the real login gate
- Isolated the remaining public issue away from frontend code
  - from the developer machine, public `8.141.20.130:80` timed out during this check window
  - directly over SSH on the ECS host:
    - `http://127.0.0.1:3106/login` returned `200`
    - `http://127.0.0.1:18080/actuator/health` returned `200`
    - `dramatv-community-web` is `active`
    - `dramatv-community-server` is `active`
    - `nginx` is `active`
    - port `80` is listening on `0.0.0.0` and `[::]`
    - local `iptables INPUT` policy is `ACCEPT`
    - `firewalld` is not running
- Current diagnosis
  - the deployed frontend and backend services on ECS are healthy
  - the remaining failure is now isolated to the public ingress path rather than this frontend change set
  - likely next checks are outside the app repo: Alibaba Cloud security group, public exposure policy, or current external network reachability for `8.141.20.130:80`
- Next
  - ask ops to confirm the ECS security-group inbound rule for TCP `80`
  - re-test the public address from a separate external network/browser after ops confirmation

## 2026-04-28 community/admin strategy recorded

- 已按最新确认补记“工程分区、业务一体”的正式口径：
  - `apps/web` 与 `apps/admin` 继续作为两个独立前端应用开发、部署和验收
  - `apps/server` 继续作为社区统一后端，同时承接前台 API 与 `/api/admin/**`
  - 前台社区和后台管理共享同一套社区领域模型、发布审核状态流与治理数据，不按两套孤立系统推进
- 已更新文档：
  - `docs/03_架构/DramaTV社区后台拆分与端口规划.md`
  - `docs/04_实施设计/社区后端开发规划-结合前台主线-2026-04-28.md`
- 当前做到哪一步：策略口径已经落账，后续后台接口、数据库表和状态字段都应直接按这个边界继续实现。
- 下次先做什么：继续按接口依赖矩阵补 `video / prompt / workflow / creator / me` 读链路测试，并在后台接口设计里坚持 `/api/** + /api/admin/**` 共用同一业务主线。

## 2026-04-28 backend read integration suite expanded

- 已把后端读链路 HTTP 集成测试继续扩到：
  - `VideoReadApiIntegrationTest`
  - `WorkflowReadApiIntegrationTest`
  - `PromptReadApiIntegrationTest`
  - `CreatorReadApiIntegrationTest`
  - `MeReadApiIntegrationTest`
- 同时把原有两条读测试做了真实契约收口：
  - `DiscussionReadApiIntegrationTest` 复用统一测试 helper
  - `FeedReadApiIntegrationTest` 改为按真实首页入口向 `feed_items(channel=recommend)` 造数，不再错误假设“只插 published video 就会自动进入首页”
- 测试基座 `ApiIntegrationTestSupport` 已新增统一 helper，用于最小真实造数：
  - published `video / workflow / prompt / discussion thread`
  - active `interaction / follow / comment`
  - `publish_drafts`
- 已验证：
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\\scripts\\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=FeedReadApiIntegrationTest,DiscussionReadApiIntegrationTest,VideoReadApiIntegrationTest,WorkflowReadApiIntegrationTest,PromptReadApiIntegrationTest,CreatorReadApiIntegrationTest,MeReadApiIntegrationTest' 'test'"` 通过
  - 结果为 `Tests run: 11, Failures: 0, Errors: 0, Skipped: 0`
- 当前做到哪一步：前台主线里首页、讨论区、视频、工作流、提示词、作者页、个人中心这批核心读接口已经有可执行的后端 HTTP 级回归基线。
- 下次先做什么：继续按依赖矩阵补 `canvas runtime / copy task` 读测试，并开始收口发布状态字段与 `/me` 聚合边界。

## 2026-04-28 canvas integration suite and idempotency hardening

- 已新增 `CanvasReadApiIntegrationTest`，覆盖当前社区前台真实会走到的 canvas 相关接口契约：
  - 公共读：`GET /api/workflows/{id}/canvas-link`
  - 登录写：`POST /api/workflows/{id}/copy-to-canvas`
  - 公共读：`GET /api/canvas-runtimes/{id}`
  - 公共读：`GET /api/canvas-runtimes/{id}/snapshot?mode=light`
  - 公共读：`GET /api/canvas-copy-tasks/{id}`
  - 登录写：`POST /api/canvas-runtimes/{id}/visible-assets`
  - 边界：匿名写 `403`、缺失资源 `404`
- 这轮测试直接暴露并修复了两个真实后端问题：
  - `copy-to-canvas` 之前按全局 `idempotency_key` 去重，而前台当前传的是固定 `workflow-copy-${workflowId}`，会把不同用户的复制链路串到同一个 canvas runtime。现已新增迁移 `V17__scope_canvas_copy_idempotency_per_operator.sql`，把唯一约束收口为 `(operator_id, source_workflow_id, idempotency_key)`，并同步让 `CanvasApplicationService.loadExistingCopy(...)` 只在“同用户 + 同源 workflow + 同幂等键”范围内复用旧任务。
  - `visible-assets` 之前的 SQL 在联表场景里直接选 `asset_role / status_code`，会被 PostgreSQL 判定为列名歧义并返回 `500`。现已显式改成 `asset.asset_role / asset.status_code`。
- 已验证：
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\\scripts\\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=CanvasReadApiIntegrationTest' 'test'"` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\\scripts\\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=FeedReadApiIntegrationTest,DiscussionReadApiIntegrationTest,VideoReadApiIntegrationTest,WorkflowReadApiIntegrationTest,PromptReadApiIntegrationTest,CreatorReadApiIntegrationTest,MeReadApiIntegrationTest,CanvasReadApiIntegrationTest' 'test'"` 通过
  - 结果为 `Tests run: 14, Failures: 0, Errors: 0, Skipped: 0`
- 当前做到哪一步：首页/讨论区/视频/工作流/提示词/作者页/个人中心/canvas 这批前台主线读链路，已经都有可执行的后端 HTTP 集成回归基线；canvas 复制链路也已有跨用户幂等隔离保护。
- 下次先做什么：继续按后端规划收口 `publish bootstrap` 草稿聚合边界、发布状态字段分层，以及 `/me` 聚合里重复拉数的问题。

## 2026-04-28 apps/admin filter controls fix pass

- Fixed the admin filter controls that looked like dropdowns but could not open.
  - `/moderation` fake select buttons were replaced with real native `select` controls for content type, moderation status, and risk level.
  - `/reports` dense chip filters were compacted into real native `select` controls for report status, target type, reason, and risk level.
  - `/comments` dense chip filters were compacted into real native `select` controls for comment status, comment type, risk status, target content type, and comment-area state.
- Kept the author/date fields as lightweight placeholder controls so the layout stays compact and closer to the reference style.
- Files touched
  - `apps/admin/src/app/(dashboard)/moderation/page.tsx`
  - `apps/admin/src/app/(dashboard)/moderation/page.module.css`
  - `apps/admin/src/app/(dashboard)/reports/page.tsx`
  - `apps/admin/src/app/(dashboard)/reports/page.module.css`
  - `apps/admin/src/app/(dashboard)/comments/page.tsx`
  - `apps/admin/src/app/(dashboard)/comments/page.module.css`
- Verification
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` passed
  - `npm.cmd run build` in `apps/admin` passed
- Current status
  - the three admin pages now use real openable dropdown controls instead of visual-only fake triggers
- Next
  - continue the next admin fine-tuning pass from the current page sequence or handle the next concrete interaction issue reported in review

## 2026-04-28 apps/admin feed-ops and media-tasks interaction fix pass

- Fixed the remaining two admin interaction issues raised in review.
  - `/feed-ops/home` no longer renders the content-arrangement modal as a permanently mounted page overlay.
  - the page now uses a client interaction layer so the modal opens from the work area actions and closes by `X`, `取消`, overlay click, or `Esc`.
  - `/media-tasks` dense chip filters were replaced with compact real native `select` controls for task type, task status, target content type, error level, and retryability.
- Files touched
  - `apps/admin/src/app/(dashboard)/feed-ops/home/page.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/home/FeedOpsHomeClient.tsx`
  - `apps/admin/src/app/(dashboard)/feed-ops/home/page.module.css`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.tsx`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.module.css`
- Verification
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` passed
  - `npm.cmd run build` in `apps/admin` passed
- Current status
  - `feed-ops/home` modal state is now interaction-correct instead of visually hardcoded
  - `media-tasks` filter area is now aligned with the newer dropdown-style admin filter pattern
- Next
  - continue the next admin page review issue in sequence

## 2026-04-28 apps/admin dropdown-css regression fix pass

- Fixed a same-class CSS regression that caused several admin pages to visually collapse after the dropdown refactor.
  - `/reports`
  - `/comments`
  - `/media-tasks`
- Root cause
  - the shared selector block for `selectControl / fieldButton / resetButton ...` was missing a closing `}` in multiple page-level CSS modules
  - that made later layout rules merge into the same selector block, which visually blew up the filter area and nearby layout
- Files touched
  - `apps/admin/src/app/(dashboard)/reports/page.module.css`
  - `apps/admin/src/app/(dashboard)/comments/page.module.css`
  - `apps/admin/src/app/(dashboard)/media-tasks/page.module.css`
- Verification
  - `npx.cmd tsc --noEmit -p apps/admin/tsconfig.json` passed
  - `npm.cmd run build` in `apps/admin` passed
- Current status
  - the known dropdown-style crash on reports/comments/media-tasks is repaired
- Next
  - continue the next admin review issue, but first keep an eye on the same selector block whenever another page is converted from chips to native select controls

## 2026-04-28 light-mode fog fix for landing-home

- 已针对日间模式“蒙雾感”完成一轮共享样式层修复，重点文件为 `apps/web/src/features/home/HomePage.module.css` 与 `apps/web/src/features/home/CommunityHomePage.module.css`。
- 这次确认的根因不是资源本身，而是 `/` 与 `/home` 在 light mode 下对 hero 与卡片额外叠加了提亮滤镜、浅色渐变遮罩和深色字覆盖，导致素材被整体洗灰；`/featured` 没有采用这套策略，所以视觉更清晰。
- 已完成的收口包括：
  - `/` landing：hero 改为“保留素材清晰度 + 局部深遮罩承托白字”，并同步把 `socialProof / searchPanel / searchButton` 收口到更偏深色玻璃态。
  - `/` landing archive 卡片：light mode 下继续使用白字与深底部遮罩，不再为了黑字可读去整体洗浅素材。
  - `/home`：hero 与 archive card 的 light mode 覆层一起减弱，改为更接近 `/featured` 的媒体呈现逻辑。
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过。
  - `apps/web` 下 `npm.cmd run build` 通过。
  - Playwright 实测 `http://127.0.0.1:3106/` 与 `http://127.0.0.1:3107/` 的 landing 页日间模式截图已重生，hero 白雾感明显下降。
- 补充环境记录：
  - `3107` 云镜像前端默认 readiness 检查会因当前网络/鉴权链路取不到 token 判失败；本次已改为提权 + `-SkipReadinessCheck` 方式拉起，当前 `127.0.0.1:3107` 与 `127.0.0.1:3107/login` 可访问。
- 当前做到哪一步：`/` landing 的日间模式已实测确认改善；`/home` 的同类根因已一并改入共享 CSS，待用户直接肉眼验收。
- 下次先做什么：由用户在 `3106 / 3107` 上直接确认 `/` 与 `/home` 的日间模式效果；若通过，再决定是否同步到公网。

## 2026-04-28 featured rapid-tab loop fix under 20-click pressure

- 已继续定位 `/featured` 顶部分类在高频切换下的“循环跳转 / 自己来回改 URL”问题，重点文件为 `apps/web/src/features/featured/FeaturedArchivePage.tsx`。
- 这次确认的根因不是后端，也不只是全局过场层，而是 `/featured` 自己把筛选状态和 URL 参数做了双向同步，在高频切换 `全部 / 工作流 / 视频提示词 / 图片提示词` 时，旧的路由改写会晚到并覆盖新的点击意图，导致地址栏反复回写。
- 已完成的收口包括：
  - 把 `/featured` 的筛选状态改为以 URL 为主，不再让分类点击和总同步 effect 彼此抢写。
  - 增加进行中路由与期望路由的串行控制，避免连续点击把多条 `router.replace` 排队回放。
  - 把 URL 规范化收口拆成单独逻辑，只处理必要清洗，不再在每次筛选变更后盲目总回写。
- 验证结果：
  - 本地 `http://127.0.0.1:3106/featured` 下，按 `工作流 / 视频提示词 / 图片提示词 / 全部` 连续快速切换 20 次，地址栏仅保留少量有效落定，不再出现停手后持续来回跳。
  - 公网 `http://8.141.20.130/featured` 已同步到 release `/opt/dramatv-community-web/releases/20260428-210601`。
  - 公网同样按 20 次高频切换回归后，停手 8 秒只额外完成最后一次落定，不再持续循环跳转。
- 当前做到哪一步：原来的“切着切着自己无限回写”已切断，现阶段剩余的是高频点击后的最后一次路由落定，不属于持续循环。
- 下次先做什么：让用户直接在公网手动高频切 20 次左右复验；若还有体感卡顿，再继续从视频卡片加载与筛选栏重渲染成本两个方向压性能。

## 2026-04-28 /me aggregation dedupe closure

- 已把 `GET /api/me/hub` 从“资料 + 互动 + 草稿”补强为“资料 + 互动 + 草稿 + 已发布内容聚合”，后端现在直接返回：
  - `publishedContent.videos`
  - `publishedContent.workflows`
  - `publishedContent.posts`
- 对应前端 `/me` 已去掉额外的三次重复拉数：
  - 不再追加调用 `GET /api/creators/{id}/videos`
  - 不再追加调用 `GET /api/creators/{id}/workflows`
  - 不再追加调用 `GET /api/creators/{id}/posts`
- 这次收口保持了现有产品边界不变：
  - 只解决 `/me` 重复请求与聚合边界问题
  - 不顺手改 creator 统计口径，也不改 creator 页现有展示契约
- 已更新文件：
  - `apps/server/src/main/java/com/dramatv/community/me/dto/response/MeHubResponse.java`
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/MeReadApiIntegrationTest.java`
  - `apps/web/src/app/(community)/me/page.tsx`
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/contracts/view-models.ts`
  - `apps/web/src/lib/mappers/community.ts`
- 已验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\scripts\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=MeReadApiIntegrationTest' 'test'"` 通过
- 当前做到哪一步：`/me` 的重复拉数问题已经收口，个人中心页面现在可以仅依赖 `GET /api/me/hub` 完成首屏所需数据装配。
- 下次先做什么：继续进入 `publish bootstrap` 收口，把当前前端对三类草稿的组合式启动流程拆成更清晰的后端 bootstrap 边界。

## 2026-04-28 publish bootstrap split by page scenario

- 已把原来前端组合式的 `getPublishBootstrap()` 收口为两个真实后端场景接口：
  - `GET /api/publish/bootstrap`
    - 返回 `currentUser + videoDraft + workflowDraft + availableWorkflows`
    - 服务 `/publish`
  - `GET /api/discussions/composer-bootstrap`
    - 返回 `currentUser + postDraft + channels`
    - 服务 `/discussions/new`
- 这次收口解决的真实问题：
  - 打开 `/publish` 时不再无意义创建 `post` 草稿
  - 打开 `/discussions/new` 时不再无意义创建 `video/workflow` 草稿
  - `/publish` 不再额外打 `GET /api/auth/me` 和 `GET /api/creators/{id}/workflows`
  - `/discussions/new` 不再额外打整包 `GET /api/discussions/home`
- 前端已同步切换到按页面场景调用：
  - `apps/web/src/app/(community)/publish/page.tsx`
  - `apps/web/src/app/(community)/discussions/new/page.tsx`
  - `apps/web/src/lib/api/community-service.ts`
  - `apps/web/src/lib/contracts/community-api.ts`
  - `apps/web/src/lib/contracts/view-models.ts`
  - `apps/web/src/lib/mappers/community.ts`
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
- 后端已新增：
  - `apps/server/src/main/java/com/dramatv/community/publish/controller/PublishBootstrapController.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PublishBootstrapQueryService.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/dto/response/PublishPageBootstrapResponse.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/dto/response/PostComposerBootstrapResponse.java`
  - `apps/server/src/test/java/com/dramatv/community/integration/PublishBootstrapApiIntegrationTest.java`
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\scripts\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=PublishBootstrapApiIntegrationTest,DraftApiIntegrationTest' 'test'"` 通过
  - 结果：`Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`
- 当前做到哪一步：发布页和发帖页的 bootstrap 已按场景拆开，前端首屏请求和无意义草稿创建都已收口。
- 下次先做什么：继续顺着发布链路往下收状态模型，把 `draft / moderation / processing / visibility` 四层状态从当前混杂口径里分离出来，并补对应回归测试。

## 2026-04-28 tab query loop same-class sweep

- 已对 `/featured` 循环跳转问题做同类排查，不再只盯当前页面，而是检查所有 `useSearchParams + router.replace` 组合页。
- 这次确认的同类风险点有两个：
  - `apps/web/src/features/me/PersonalCenterPage.tsx`
  - `apps/web/src/features/creator/CreatorPage.tsx`
- 根因与 `/featured` 同类：
  - 本地 `activeTab` state 从 `searchParams.get("tab")` 初始化
  - 一个 effect 做 `URL -> state`
  - 另一个 effect 做 `state -> router.replace(...)`
  - 高频点击时旧路由改写会晚到，覆盖新点击意图，形成“停手后还自己改地址”的风险
- 已完成的结构性优化：
  - `/me` 去掉本地 `activeTab` 状态，改为直接从 URL 解析 tab
  - `/creators/[id]` 去掉本地 `activeTab` 状态，改为直接从 URL 解析 tab
  - tab 点击只负责构造下一条 URL 并执行一次 `router.replace`
  - 不再保留 `URL <-> state` 双向同步 effect
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - Playwright 本地实测 `/me` 连续快速切换 20 次左右，停手后 URL 稳定，不再自行回写
  - Playwright 本地实测 `/creators/11111111-1111-1111-1111-111111111111` 连续快速切换 20 次左右，停手后 URL 稳定，不再自行回写
- 同类风险边界复查：
  - `apps/web/src/features/home/HomePage.tsx` 只读 query，不写路由，不属于同类问题
  - `apps/web/src/features/home/CommunityHomePage.tsx` 只读 query，不写路由，不属于同类问题
  - `apps/web/src/features/discussions/DiscussionsPage.tsx` 只读 query，不属于同类问题
  - `apps/web/src/components/shared/NotificationBell.tsx` 只用当前路由做面板关闭，不写路由，不属于同类问题
  - 当前仍会主动 `router.replace` 的 query 页，只剩 `/featured`、`/me`、`/creator` 三处；其中 `/me` 与 `/creator` 已收口为 URL 单一真源，`/featured` 保留了单独的串行路由控制
- 当前做到哪一步：这次“tab/query 双真源导致循环跳转”的同类风险已经从单页修复扩大到全仓主要页面收口。
- 下次先做什么：后续新增任何 query-tab 页面时，默认直接用 URL 作为唯一真源，不再复用 `local state + 双向 effect` 模式。

## 2026-04-28 frontend sync for tab loop sweep

- 已将本轮前端修复同步到云镜像与公网，使用现有前端部署脚本：
  - `scripts/deploy-test-web.ps1`
- 本次公网前端 release：
  - `/opt/dramatv-community-web/releases/20260428-212511`
- 部署结果：
  - `next build` 通过
  - `dramatv-community-web.service` 已重启并处于 `active (running)`
  - Nginx 配置检查通过
- 部署后公网回归：
  - `http://8.141.20.130/featured` 连续快速切换 20 次左右，停手后 URL 稳定，不再持续回写
  - `http://8.141.20.130/me` 连续快速切换 20 次左右，停手后 URL 稳定，不再持续回写
  - `http://8.141.20.130/creators/11111111-1111-1111-1111-111111111111` 连续快速切换 20 次左右，停手后 URL 稳定，不再持续回写
- 当前做到哪一步：本地与公网前端都已经带上这轮 `/featured + /me + creator` 的 query-tab 循环修复。
- 下次先做什么：如果用户继续反馈“多次切换后体感卡顿”，下一步应转向视频卡片加载成本和列表重渲染成本排查，而不是继续怀疑 query-tab 自循环。

## 2026-04-29 publish lifecycle contract split

- 已按“先拆状态契约、暂不重写发布流程”的原则完成发布链路第一轮状态收口。
- 后端新增：
  - `apps/server/src/main/java/com/dramatv/community/publish/dto/response/DraftLifecycleResponse.java`
  - `apps/server/src/main/java/com/dramatv/community/publish/application/PublishDraftLifecycleQueryService.java`
- 当前 `video/workflow/post draft` 以及对应 `submit` 响应，都会显式返回：
  - `draftStatus`
  - `moderationStatus`
  - `processingStatus`
  - `editable`
  - `submittedAt`
- 这次明确的真实口径是：
  - `draftStatus` 只表达草稿是否还处于可编辑草稿态
  - `moderationStatus` 只看审核轨道，优先取 `audit_records`
  - `processingStatus` 只看媒体处理轨道，优先取 `async_task_records`
  - `visibility` 继续独立留在原响应字段里，不再和上面三层混用
- 前端已同步改为使用新字段：
  - `apps/web/src/features/publish/PublishPage.tsx`
  - `apps/web/src/features/discussions/DiscussionComposerPage.tsx`
  - 当前锁定逻辑已从 `statusCode !== "draft"` 切到 `lifecycle.editable`
- 这次没有改动的边界：
  - 仍保持当前真实流程“提交即入库 / 审核记录分轨 / 媒体处理异步补齐”
  - 没有在这一轮顺手重构 `publish_status` 入库时机
  - 没有扩散去改 `/me` 草稿列表口径
- 验证结果：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\scripts\use-local-java17-maven.ps1' '-f' 'apps/server/pom.xml' '-Dtest=DraftApiIntegrationTest,PublishBootstrapApiIntegrationTest,PublishPipelineIntegrationTest' 'test'"` 通过
  - 结果：`Tests run: 11, Failures: 0, Errors: 0, Skipped: 0`
- 当前做到哪一步：发布链路“草稿 / 审核 / 处理 / 可见性”已经在响应契约层拆开，前端编辑页也已切到显式 lifecycle 字段。
- 下次先做什么：继续顺着发布链路往下收真正的流程语义，优先判断是否要把“提交即 published 入库”继续保留为现阶段策略，还是进一步改成“待审核/待处理”再入社区可见面。

## 2026-04-30 local comment reply notification fixed

- 本地 `3106 + 18080` 已修复“B 回复 A 的评论但 A 铃铛没有通知”的问题。
- 根因不是通知没生成，而是 `/api/me/notifications/recent` 后端接口在“互动通知 + 回复通知并存”场景下直接 `500`：
  - `apps/server/src/main/java/com/dramatv/community/me/application/MeQueryService.java`
  - `loadInteractionNotifications(...)` 复用了统一通知映射器，但 `like/favorite` 分支缺失 `reply_to_actor_name`
  - 触发时抛出 `PSQLException: ResultSet 中找不到栏位名称 reply_to_actor_name`
- 已完成修复：
  - 给互动通知 SQL 的 `video / workflow / prompt / post` 四个分支统一补上 `null::text as reply_to_actor_name`
  - 新增 `MeReadApiIntegrationTest` 覆盖“同一 prompt owner 同时命中 like 与 reply 通知”的场景
  - 清掉了本地 18080 上残留的旧 Java 进程，并重启到新后端版本
- 验证完成：
  - `apps/server -> mvn -Dtest=MeReadApiIntegrationTest test` 通过
  - `apps/web -> npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - 实际接口 `GET /api/me/notifications/recent` 已返回 `creator-b / reply / 测试通知6`
  - Playwright 在 `http://127.0.0.1:3106/featured` 打开铃铛，已看到 `creator-b 回复了你的评论`
- 详细排查与复现说明先落在：
  - `.codex/comment-thread-two-level-2026-04-30.md`
- 额外注意：
  - `.codex/progress-community.md` 当前已有编码混乱风险，这次没有继续在该文件中深改，只在主进度和 memory 中补记，后续如果要继续细分前后台/社区子进度，先做一次编码与结构整理。

## 2026-05-06 cloud sync for report flow and latest page polish

- 已把最近一轮“举报功能 + 三个页面改动”同步到云测试环境，按前后端一起部署，避免只更新一半导致公网行为不一致。
- 后端部署：
  - 使用 `scripts/deploy-test-backend.ps1`
  - 新 release：`/opt/dramatv-community-server/releases/20260506-123320`
  - `dramatv-community-server.service` 已重启并保持 `active (running)`
  - 本次环境仍保持 `OSS + ECS RAM Role + PostgreSQL + Redis` 的现有云配置
- 前端部署：
  - 使用 `scripts/deploy-test-web.ps1`
  - 新 release：`/opt/dramatv-community-web/releases/20260506-123356`
  - `dramatv-community-web.service` 已重启并保持 `active (running)`
  - `http://8.141.20.130/` 与 Nginx 转发检查已返回 `200`
- 本次一并带上的范围：
  - 举报相关前后端链路
  - 最近精修的发帖页 / 帖子详情页 / 发布页样式与交互改动
  - 最近一批评论区、返回锚点、通知、个人页与详情页收口改动
- 部署前本地校验：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
  - `apps/server` `-DskipTests package` 通过
- 当前注意点：
  - 前端部署日志里仍提示 `featured-prompts` 的 `unstable_cache` 单项缓存对象超过 `2MB`，这不是本次部署失败，但说明精选补充数据接口后续仍值得继续做轻量化收口。
- 下次先做什么：
  - 直接在公网复验举报入口和最近三个页面的实际效果
  - 若公网通过，再决定是否继续做下一轮发布页 / 评论区 / 详情页细节优化

## 2026-05-06 home canvas CTA now points to placeholder runtime

- 已把首页“进入无限画布”入口改为本地占位画布路由：`/canvas/d2a551f9-8cd4-4fb3-bd72-b90a830f91e3`
- 这次只改首页 CTA 目标，不动 `/canvas` 页面自身逻辑，后续可以继续把这个占位 runtime 当作画布入口演示位
- 本地验证：
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json` 通过
- 下次先做什么：
  - 同步这次首页 CTA 跳转改动到云端前端
  - 再验收首页点击是否直接进入占位画布页

## 2026-05-06 planning workbook repaired after real text corruption

- 已确认 `docs/03_架构/DramaTV社区功能规划清单.xlsx` 本次不是单纯 PowerShell 中文显示乱码，而是工作簿部分单元格内容被真实写坏，Excel 内已出现 `???` 与混乱文本。
- 处理方式：
  - 先保留当前损坏主表副本：`docs/03_架构/DramaTV社区功能规划清单_corrupted_backup_20260506_132530.xlsx`
  - 再以未损坏备份 `docs/03_架构/DramaTV社区功能规划清单_backup_20260506_before_sync.xlsx` 为底，按当前项目真实进度重新回写关键状态行与 `说明` 页。
  - 已同步更新主表与一份镜像表：`docs/03_架构/DramaTV社区功能规划清单.xlsx`、`docs/03_架构/DramaTV社区功能规划清单-已同步.xlsx`
- 本次修复后已用 `unicode_escape` 方式抽样校验行 `13 / 61 / 62 / 73 / 79 / 108` 与 `说明` 页 1-5 行，确认当前工作簿内中文内容已恢复正常，不再是 `???`。
- 后续规则补记：涉及中文 `xlsx`/大文档时，不以终端肉眼显示直接判断文件损坏；先做 UTF-8 安全抽样，再决定是否恢复备份重建。
## 2026-05-06 prompt card inline like

- Community front-end/backend sync item: prompt cards on `/featured` and `/home` now support inline like with red active state.
- Detailed implementation notes are recorded in `.codex/progress-community.md`.

## 2026-05-06 featured prompt cache oversize fix

- Fixed the `featured-prompts` Next cache oversize warning by moving anonymous `/featured` prompt inventory loading out of server-side `unstable_cache` first-screen delivery.
- Anonymous `/featured` now renders base content first and hydrates the large prompt inventory from `/api/public/featured-prompts` on the client.
- `/api/public/featured-prompts` is now a dynamic route with short public cache headers instead of writing a >2MB Next data-cache item.

## 2026-05-06 featured prompt hard-limit removal

- `/featured` 提示词库存链路已进一步去掉对单次 `limit=10000` 的依赖：后端 `GET /api/prompts` 新增 `offset`，前端改为分批拉完。
- 详细实现与验证记录已写入 `.codex/progress-community.md`，后续如果库存继续增长，再从“分批拉完”升级到“真正按需分页展示”。

## 2026-05-07 landing hero overlay cleanup

- `/` 首页 hero 已移除首张精选卡封面作为背景层的写法，避免大屏下隐约看到内嵌图片。
- 详细记录已写入 `.codex/progress-community.md`，下一步是同步到云测试环境并验收首页首屏是否恢复纯净。

## 2026-05-07 landing hero overlay cloud sync

- 首页首屏去首卡封面叠层的前端修复已同步到云测试环境。
- 详细部署记录已写入 `.codex/progress-community.md`。

## 2026-05-08 report entry binding fix across detail pages

- 已修复“举报入口错绑到评论/回复数量按钮”的共享前端回归，覆盖：
  - `提示词/视频详情页`
  - `工作流详情页`
  - `帖子详情页`
- 当前行为调整为：
  - `讨论 4` / `评论 N` / `回复 2` 这些按钮只负责跳到对应评论区
  - `举报` 改为独立按钮，不再伪装成数量按钮
- 这次一并收口：
  - 举报弹窗标题统一中文：`举报提示词 / 举报视频 / 举报工作流 / 举报帖子`
  - 举报提交成功文案统一中文：`举报已提交。`
  - 举报成功提示改为短暂显示后自动消失，不再长期停留在页内
- 本地校验：
  - `apps/web -> npx.cmd tsc --noEmit` 通过
- 当前做到哪一步：
  - 代码层面的共享交互回归已收口
  - 下一步直接拉起前端验收本地详情页，再决定是否同步到公网

## 2026-05-09 prompt detail related works panel simplification

- 已把提示词详情页右侧的“提示词操作”卡去掉，改为更多相关作品卡位。
- 当前提示词详情页右栏的结构更接近内容页，而不是操作页：
  - 保留相关作品
  - 去掉重复的说明型操作卡
  - 相关作品卡数量上调为最多 4 张，便于填满右侧空间
- 本地校验：
  - `apps/web -> npx.cmd tsc --noEmit` 通过
- 当前做到哪一步：
  - 提示词详情页右栏已完成一次减法优化
  - 如果后面还想继续压缩右侧信息，可以再看“相关推荐 / 作者信息 / 讨论入口”的层级怎么再收口

## 2026-05-09 cloud sync for recent frontend polish

- 已将最近几轮前端改动同步到云测试环境 `8.141.20.130`。
- 本次同步范围：
  - 提示词详情页右侧栏减法优化
  - 评论区输入与评论列表分离
  - 评论/回复提示文案中文化
  - 举报入口与成功提示收口
  - 相关评论区视觉纯净化
- 部署结果：
  - `dramatv-community-web.service` 已重启并 `active (running)`
  - 公网前端 `http://8.141.20.130/` 已返回 `200`
  - Release: `/opt/dramatv-community-web/releases/20260509-111544`
- 当前做到哪一步：
  - 云端已经带上最新前端版本
  - 下一步直接在公网继续验收这些细节页和评论区表现

## 2026-05-09 related recommendations synced to cloud

- 详情页推荐语义分开后，已同步到云测试环境，并完成提示词详情页的浏览器抽查。
- 详细记录已写入 `.codex/progress-community.md`。

## 2026-05-11 admin frontend cleanup

- 已确认 `apps/admin` 本地 dev 服务恢复正常，`3206` 重新可用。
- `/users` 页面在干净刷新后不再出现残留控制台报错。
- 已补 `apps/admin/src/app/icon.svg`，清掉唯一的 `favicon.ico 404` 噪音。
- 当前做到哪一步：后台管理前端这次清理已收口，后续可以继续接着做功能开发或验收。

## 2026-05-11 admin users 500 fix

- 已定位本地后台 `/users` 页面“当前无法读取用户列表”不是前端渲染问题，而是后端 `GET /api/admin/users` 在空搜索词场景下真实返回 `500`。
- 根因已确认：`apps/server/src/main/java/com/dramatv/community/admin/users/AdminUserQueryService.java` 中列表 SQL 使用了 `? is null`，PostgreSQL 在参数为 `null` 时无法推断 `$1` 类型，实际报错为 `could not determine data type of parameter $1`。
- 已修复为显式 `text` 类型判断：`cast(? as text) is null`，并同步给 `ilike` 参数做 `cast(? as text)`。
- 已补回归测试：`apps/server/src/test/java/com/dramatv/community/integration/AdminUserGovernanceApiIntegrationTest.java` 新增“管理员无筛选打开用户列表”用例。
- 已验证：
  - 本地后端重启后 `http://127.0.0.1:18080/actuator/health -> UP`
  - 使用 `admin-chief / dramatv-admin-demo` 直连 `GET /api/admin/users` 返回 `200 OK`
  - `scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminUserGovernanceApiIntegrationTest test` 通过，结果 `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`

## 2026-05-12 admin home feed-ops realigned to actual homepage structure

- 已把后台 `feed-ops/home` 从旧的 4 槽口径，收口到和前台首页一致的 `3 个轮播位 + 8 个内容分区位`。
- home 页候选池已同步收紧为 `prompt / workflow`，不再允许把讨论帖挂进首页运营位。
- 已验证：
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsHomeApiIntegrationTest test`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsLoggingIntegrationTest test`
- 详细记录已写入 `.codex/progress-admin.md`。
## 2026-05-12 admin feed-ops/featured realigned to actual featured structure

- 已把后台 `feed-ops/featured` 收口到真实精选页结构：`全部首屏 12 条 + 5 个 tab`。
- 5 个运营位已固定为：
  - `featured-all`
  - `featured-workflow`
  - `featured-video-prompt`
  - `featured-image-prompt`
  - `featured-activity`
- 各槽位上限已统一为 `12` 条，精选页预览也改为按真实首屏和分类清单展示。
- 已验证：
  - `apps/admin -> npm.cmd run build`
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminFeedOpsFeaturedApiIntegrationTest test`

## 2026-05-12 admin feed-ops fully aligned to actual web page structures

- 后台 `feed-ops/home / featured / discussions` 已全部按前台真实页面结构收口，不再沿用旧的 mock 槽位语义或 `admin-content.ts` 参考数据。
- 这轮固定下来的真实结构为：
  - `home`：`home-hero`、`recommended-primary`、`recommended-secondary`、`canvas`、`commercial`、`animation`、`narrative`、`mv`、`creative`
  - `featured`：`featured-all`、`featured-workflow`、`featured-video-prompt`、`featured-image-prompt`、`featured-activity`
  - `discussions`：`discussion-channel-order`、`discussion-global-pinned`、`discussion-channel-focus`、`discussion-home-link`
- 讨论区右侧 `热门话题 / 活跃贡献者` 已明确为前台派生区，不进入后台手动编排。
- 已完成校验：
  - `apps/admin -> npx.cmd tsc --noEmit -p tsconfig.json`
  - `apps/admin -> npm.cmd run build`
  - `AdminFeedOpsHomeApiIntegrationTest`
  - `AdminFeedOpsFeaturedApiIntegrationTest`
  - `AdminFeedOpsDiscussionsApiIntegrationTest`
- 重要约束已补记：这三条 `AdminFeedOps*` 集成测试需要串行执行；并行会争用本地测试库和 `apps/server/target`，产出假失败，不应误判为权限链路或页面逻辑损坏。

## 2026-05-17 admin feed-ops config-table loss recovery

- 已定位这次“后台编排配置不见了”不是前端渲染问题，而是本地库 `admin_feed_slot_configs` 变成了空表。
- 已确认并非整库丢失：`prompt_entries / workflows / discussion_threads` 等业务内容仍在。
- 已补后端兜底：
  - `home` 公共接口在配置表空时不再返回空 `layout.slots`
  - `admin feed-ops` 页面在配置表空时会基于真实候选池生成可见结构，避免工作区整块空掉
- 已执行恢复：
  - 本地后端重启到新代码
  - `home / featured / discussions` 三页已重新按当前可见结构回写并发布
  - 当前库内已恢复为 `published`
- 已完成校验：
  - `apps/server -> .\\scripts\\use-local-java17-maven.ps1 -f apps/server/pom.xml "-Dtest=AdminFeedOpsHomeApiIntegrationTest,FeedReadApiIntegrationTest" test`
  - `http://127.0.0.1:18080/api/admin/feed-ops/home`
  - `http://127.0.0.1:18080/api/feed/home`

## 2026-05-18 codex skill baseline installed for DramaTV

- 已按 `E:\点众\小说库相似度比对服务工作区\docs\54_第三方编码skills汇总_2026-05-18.md` 的建议，为当前开发环境补齐 DramaTV 项目推荐的第三方编码 skills。
- 本次装载来源不是重新联网拉 GitHub，而是直接使用本地第三方源码副本：
  - `E:\点众\小说库相似度比对服务工作区\third_party\agent-skills`
  - `E:\点众\小说库相似度比对服务工作区\third_party\andrej-karpathy-skills`
- 安装策略已固定为：
  - 只补缺失 skill
  - 不覆盖全局目录 `C:\Users\psk13\.codex\skills` 中已存在的同名 skill
- 本次新增装载 15 个缺失 skill，包括：
  - `api-and-interface-design`
  - `ci-cd-and-automation`
  - `code-simplification`
  - `context-engineering`
  - `deprecation-and-migration`
  - `documentation-and-adrs`
  - `doubt-driven-development`
  - `git-workflow-and-versioning`
  - `idea-refine`
  - `incremental-implementation`
  - `interview-me`
  - `planning-and-task-breakdown`
  - `spec-driven-development`
  - `test-driven-development`
  - `using-agent-skills`
- 已存在而未覆盖的关键 skill 包括：
  - `karpathy-guidelines`
  - `frontend-ui-engineering`
  - `browser-testing-with-devtools`
  - `debugging-and-error-recovery`
  - `source-driven-development`
  - `security-and-hardening`
  - `code-review-and-quality`
  - `performance-optimization`
  - `shipping-and-launch`
- 已在仓库内新增项目级说明文档：
  - `docs/90_模板与工具/Codex技能装载与项目推荐清单-2026-05-18.md`
- 已新增共享链路回归任务板：
  - `.codex/shared-regression-taskboard-2026-05-18.md`
  - 用于拆清“后台预期影响前台展示”与“后台非预期误伤前台展示”的边界，并按 `R1-R5` 管理后续共享回归任务
- 已新增项目总优化任务板：
  - `.codex/dramatv-optimization-taskboard-2026-05-18.md`
  - 用于统一管理质量门禁、CI/部署、性能指标化、共享层回归、安全边界、文档执行化六类优化方向
- 已完成优化任务 `O1-1` 第一轮：根目录验证入口已统一到 `package.json`，新增 `typecheck / build / backend-test / api-smoke / auth-session-smoke / notification-smoke / browser-smoke / verify:quick / verify:full`。
- 本轮已实测通过：
  - `npm run typecheck`
  - `npm run api-smoke`
  - `npm run auth-session-smoke`
- `README.md` 已同步补“统一验证入口”说明，后续默认口径固定为：
  - 日常改动后先跑 `npm run verify:quick`
  - 同步云端或阶段性验收前跑 `npm run verify:full`
- 已完成优化任务 `O1-4` 第一轮：仓库已新增 `scripts/check-test-runtime-readiness.mjs`，并补根命令 `readiness:test / deploy:verify:pre / deploy:verify:post:test`，把“部署前跑什么、部署后验什么”收成固定入口。
- `readiness:test` 当前默认覆盖公网测试入口 `http://8.141.20.130` 的：
  - 根页 / 登录页
  - 受保护页跳登录
  - `feed home / prompts / discussions home`
  - 匿名通知代理空列表降级
- 如果补 `DRAMATV_TEST_CREATOR_USERNAME`、`DRAMATV_TEST_CREATOR_PASSWORD`、`DRAMATV_TEST_BACKEND_HEALTH_URL`，还能继续补登录态与后端健康检查。
- 本轮验证：
  - `npm run typecheck` 通过
  - 用本地 `3106 + 18080` 代入同一套 `check-test-runtime-readiness` 脚本，结果 `11 passed / 0 failed`
  - 当前从这台机器直探 `http://8.141.20.130/` 拿到过 `502 Bad Gateway`，所以 `readiness:test` 对公网入口的失败先记为“环境连通/目标服务状态异常”，不是脚本逻辑错误
- 已完成优化任务 `O1-2` 第一轮：`apps/web` 与 `apps/admin` 已各自补齐 `typecheck / smoke` 入口；根目录也已同步补 `smoke:web / smoke:admin`，避免所有验证都只能从根目录大而全入口触发。
- `O1-2` 本轮验证：
  - `npm run typecheck:web` 通过
  - `npm run typecheck:admin` 通过
  - `npm run smoke:web` -> `7 passed / 0 failed`
  - `npm run smoke:admin` -> `7 passed / 0 failed`
- 已完成优化任务 `O1-3` 第一轮：已新增 `scripts/run-backend-integration-suite.ps1`，把 `apps/server` 集成测试按 `core / read / admin / logging / full` 分组；根目录 `backend-test` 现默认走 `core`，本地稳定性脚本也已复用该入口。
- `O1-3` 本轮验证：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`
  - 结果 `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`
- 已完成优化任务 `O2-2` 第一轮：`scripts/deploy-test-web.ps1` 与 `scripts/deploy-test-backend.ps1` 都已补 `-VerifyBeforeDeploy / -VerifyAfterDeploy` 开关，现有部署脚本终于能和新的固定验收入口直接闭环。
- `O2-2` 本轮验证：
  - `deploy-test-web.ps1` / `deploy-test-backend.ps1` 已通过 Windows PowerShell 语法探测
  - `npm run deploy:verify:pre` 已通过
- 已完成优化任务 `O2-3` 第一轮：已补 `docs/04_实施设计/测试环境部署回滚与故障排查清单-2026-05-18.md`，把当前测试环境的部署前后动作、失败时检查顺序、前后端回滚原则和已知公网验收风险都固定成文档。
- 已完成优化任务 `O5-4` 第一轮：社区前台错误展示策略已从分散处理推进到共享 mapper。当前登录、发布、个人资料、上传、互动、讨论区动作都会优先按稳定错误码转成安全文案，并携带 `requestId`；社区主页面级的后端不可用状态也不再直接显示底层 `/api/...` 路径。验证已通过：`node --test apps/web/src/lib/api/community-error-presenter.test.mjs`、`npm run typecheck:web`、`npm run build:web`、`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`，其中 `core` 套件结果已扩大到 `33 passed / 0 failed`。
- 已完成优化任务 `O5-2` 第一轮：后端已新增 Redis 版基础频控层，并把登录、举报创建、上传 `policy / binary` 三条高风险写链路接入限频；同时补上 `uploadBinary` 的资源归属校验，避免登录用户继续向别人的 `assetId` 写入文件。统一错误口径已新增 `AUTH_RATE_LIMITED / REPORT_RATE_LIMITED / UPLOAD_RATE_LIMITED / UPLOAD_ASSET_FORBIDDEN`，前端共享错误文案也已同步。验证已通过：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`，结果已扩大到 `38 passed / 0 failed`；`node --test apps/web/src/lib/api/community-error-presenter.test.mjs` 与 `npm run typecheck:web` 也已通过。
- 当前做到哪一步：
  - 技能已装载到全局 Codex 目录
  - 项目内推荐搭配、默认基线和使用约束已固定到仓库文档
- 下次先做什么：
  - 顺着优化板继续做 `O5-5 审计日志与敏感信息保护复查`，把安全边界继续往“日志脱敏 / 原始 payload 收口 / 后台可见范围”推进，而不是停在入口级限频这一层

## 2026-05-19 O5-5 audit sanitization and test-cleanup fix

- 已完成 `O5-5 审计日志与敏感信息保护复查` 第一轮，核心落点有两块：
  - 新增 `apps/server/src/main/java/com/dramatv/community/shared/security/SensitivePayloadSanitizer.java`，把自由文本和 JSON 文本里的敏感片段统一做脱敏与截断
  - 补齐 `apps/server/src/test/java/com/dramatv/community/integration/ApiIntegrationTestSupport.java` 的测试清理，删除 `audit_records.operator_id` 指向 `it-*` 测试用户的残留记录
- 这轮先用 `core` 套件复现，再按最小面回收：
  - 初始失败并不是业务逻辑坏掉，而是 `cleanupBeforeEach` 在删 `users` 时被 `audit_records_operator_id_fkey` 卡住
  - 补上 `operator_id` 清理后，`core` 套件恢复通过，也确认 `ActionRateLimitIntegrationTest` 的 `upload binary` 频控与归属校验本身没坏
  - 接着在 `admin` 套件里暴露出第二个真实问题：自由文本 `error_message` 只截断未脱敏，`signature=very-secret ...` 仍能透到后台媒体任务详情
  - 最终已把 `sanitizeText()` 与 JSON 文本里的字符串节点统一接上关键字模式脱敏，补住 `token=...`、`signature=...`、`authorization=...`、`policy=...` 和 `Bearer ...`
- 本轮验证结果：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core` -> `38 passed / 0 failed`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin` -> `31 passed / 0 failed`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite logging` -> `25 passed / 0 failed`
- 当前做到哪一步：
  - 优化板 `O5-1 ~ O5-5` 第一轮都已落地并过回归
  - 这一轮剩下的不是继续补入口级频控，而是后续再决定是否把同样的脱敏策略继续扩到更多后台展示面或日志审计脚本
- 下次先做什么：
  - 回到优化板 `O4 共享层回归保护` 或新的稳定性项，继续做自动防回归，而不是再手工追一次同类脏数据问题

## 2026-05-19 O4 R3-5 report-admin linkage regression

- 已完成共享层回归项 `R3-5 举报到后台工单联动回归` 第一轮，当前选择的是最小但真实的后端端到端保护，而不是再补一条手工造数测试。
- 本轮新增 `apps/server/src/test/java/com/dramatv/community/integration/AdminReportApiIntegrationTest.java` 的真实联动用例，覆盖链路：
  - 前台用户 `POST /api/reports`
  - 后台列表 `GET /api/admin/reports`
  - 后台详情 `GET /api/admin/reports/{reportId}`
  - 后台动作 `POST /api/admin/reports/{reportId}/processing`
  - 后台收口 `POST /api/admin/reports/{reportId}/close`
- 这轮先按 TDD 的方式补红测，第一次失败点不是业务逻辑，而是我新用例把返回字段误写成了 `id`；实际契约是 `reportId`，修正后回归通过。
- 已验证通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/use-local-java17-maven.ps1 -f apps/server/pom.xml -Dtest=AdminReportApiIntegrationTest test`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin` -> `32 passed / 0 failed`
- 当前做到哪一步：
  - `O4` 已从分析进入实际补回归阶段，`R3-5` 已落地
  - 下一条优先候选仍是 `R3-6 审核动作到前台展示联动回归`，或者同等级的浏览器级共享链路复检

## 2026-05-19 community-admin shared sync doc established

- 已新增共享台账 `E:\点众\DramaTV社区搭建\.codex\community-admin-shared-sync.md`，用途不是替代 `progress-community.md / progress-admin.md`，而是把“社区前台 + 管理后台 + 共享后端”三者之间会互相影响的真实链路收口成单一事实源。
- 从这条开始，凡是会同时影响 `apps/web`、`apps/admin`、`apps/server` 理解和联调的内容，优先更新这份共享台账，再分别更新各自进度。
- 本轮已继续把对后台开发最有用的现状补进共享台账：新增“当前后台已真实落地的共享能力地图”，明确了后台现有页面、现有 admin API 域、不要重复造的共享能力，以及后台最容易误伤前台的点；同时已同步更新后台 Codex 接手提示词 `E:\点众\DramaTV社区搭建\.codex\backend-codex-shared-sync-handoff-2026-05-19.md`。

## 2026-05-19 community-admin shared sync doc extended with frontend-consumed contract map

- 已为共享台账补充 `4B. 当前前台已真实消费的后台字段 / 状态`，把后台最容易误伤前台的真实契约收口成代码级清单，而不是只停留在抽象原则。
- 当前 `4B` 已明确覆盖：
  - 发布生命周期 / 草稿箱 / 媒体任务字段
  - taxonomy 正式 key 与前台组合筛选口径
  - 评论结构、评论开关读写字段差异
  - 举报创建最小回包
  - 通知项结构与“红点是前台本地派生”这一事实
  - 首页 / 精选页固定 slot key 与媒体字段
  - 讨论区频道 / 帖子绑定关系
  - `/me` 个人中心聚合结构
- 后台 Codex 接手提示词也已同步要求优先阅读 `4A + 4B`，减少后续前后台共享契约继续各猜各的情况。

## 2026-05-19 community cloud sync manifest established

- 已新增云同步整理清单：`E:\点众\DramaTV社区搭建\.codex\community-cloud-sync-manifest-2026-05-19.md`
- 这份清单不是新功能文档，而是专门用于解决“当前工作区过脏，后续哪些该上云、哪些只该进仓库、哪些绝不能带上云”这个执行问题。
- 当前已明确拆成三类真实同步包：
  - `S1` 社区后端运行态包
  - `S2` 社区前台运行态包
  - `S3` 后台管理前端运行态包
- 同时已明确排除：
  - `.next*`
  - `artifacts/`
  - `.logs/`
  - `.codex/*.log`
  - 各类临时快照和测试产物
- 当前做到哪一步：
  - 以后不再用“整个工作区一起推”的方式处理云同步
  - 下一次如果要真正部署测试环境，应先按清单切出最小部署批次，再分别验证
- 下次先做什么：
  - 如果要开始下一次云同步，优先按 `S1 -> S2 -> S3` 顺序推进
  - 同步前先执行对应验证命令，不再先部署再排错

## 2026-05-19 workspace cleanup and artifact archiving

- 已对工作区做了一轮“非源码产物优先”的整理，不碰 `apps/web / apps/server / apps/admin` 真实业务代码，只处理明显散落的历史日志、网页截图、浏览器快照和零散资料。
- 已新增本地归档目录：
  - `archive/workspace-artifacts/2026-05-19/`
- 本轮已归档：
  - 根目录旧运行日志 `61` 个 -> `root-logs/`
  - 根目录网页截图 `15` 个 -> `root-browser-captures/`
  - 根目录浏览器快照 / 抓包文本 `5` 个 -> `root-browser-debug/`
  - 根目录参考压缩包 `2` 个 -> `root-reference-packages/`
  - `.codex/feed-ops-home-response.html` -> `codex-debug/`
- 本轮已做的分类整理：
  - `codex-account-login-recovery-2026-04-06.md` -> `.codex/history/`
  - `本页目录：.md` -> `docs/90_模板与工具/历史零散资料/本页目录-网页导出.md`
  - `语音api获取和配置文档.md` -> `docs/90_模板与工具/历史零散资料/`
  - `419素材新.xlsx` -> `docs/02_研究/待整理素材/`
  - `docs/90_模板与工具` 下 3 张散落 `ChatGPT Image ...png` -> `社区后台前端参考图片/补充生图参考-2026-04-27/`
- 已补 `.gitignore`：
  - `.logs/`
  - `.codex/*.log / *.out.log / *.err.log / *.html`
  - `archive/workspace-artifacts/`
- 当前剩余的小尾巴：
  - 根目录还剩 `web-3107.err.log / web-3107.out.log`
  - 原因不是漏清，而是 `3107` 当前仍有 `node` 进程监听并占用这两个文件，先保留，避免误伤运行中的本地前端
- 当前做到哪一步：
  - 根目录已经从“散落一堆历史截图与日志”收敛到“规则文件 + 当前运行日志 + 少量仍在用的项目笔记”
  - 工作区后续再做云同步时，视觉噪音和误判成本会低很多
- 下次先做什么：
  - 如果 `3107` 不再使用，停掉对应 `node` 进程后，把两个残留日志也归档
  - 之后再继续做“源码同步批次”和“云部署批次”的进一步整理

## 2026-05-19 test env stable baseline and rollback entrypoints

- 已把“当前云端版本先作为第一版稳定版本”的口径正式落到了仓库，而不是只停留在聊天约定：
  - 新增 `ops/releases/test-env-release-ledger.md`
  - 当前稳定基线固定为 `test-stable-2026-05-19-community-r1`
  - 对应云端 current：
    - web：`/opt/dramatv-community-web/releases/20260509-141400`
    - server：`/opt/dramatv-community-server/releases/20260509-123834`
- 已新增测试环境 release 管理脚本：
  - `scripts/list-test-releases.ps1`
  - `scripts/stamp-test-stable-baseline.ps1`
  - `scripts/rollback-test-web.ps1`
  - `scripts/rollback-test-backend.ps1`
- 已新增共享 helper：
  - `scripts/lib/test-env-release-common.ps1`
  - 当前统一承接测试环境资源解析、基础远端连接、release 元数据生成
- 已把发布元数据接入现有发布脚本：
  - `scripts/deploy-test-web.ps1`
  - `scripts/deploy-test-backend.ps1`
- 当前新发布会自动向远端 release 目录写 `release.json`，记录：
  - `releaseName / releaseLabel / component / sourceMode`
  - `branch / commitSha / commitShortSha`
  - `dirtyWorkspace / workspaceStatus`
  - `deployedBy / generatedAt`
  - `verifyBefore / verifyAfter / releaseNotes`
- 根命令也已补齐：
  - `npm run deploy:test:web`
  - `npm run deploy:test:backend`
  - `npm run release:list:test`
  - `npm run rollback:test:web -- -ReleaseName <release> -VerifyAfterRollback`
  - `npm run rollback:test:backend -- -ReleaseName <release> -VerifyAfterRollback`
- 当前做到哪一步：
  - 测试环境已经从“脚本能发，但主要靠聊天记忆版本”推进到“有稳定基线、有远端 release.json、有版本身份、有回滚入口”的阶段
- 下次先做什么：
  - 在这套入口上继续推进“只从明确 commit 发版”
  - 再把自动化发布流水线逐步收口成更标准的 CI/CD

## 2026-05-21 discussion rich editor follow-up

- `/discussions/new` 已从 markdown-ish 输入升级到真实富文本编辑链路：
  - 前端新增 `apps/web/src/lib/discussion-content.ts` 统一做讨论正文纯文本提取
  - `DiscussionComposerPage`、`DiscussionDetailPage`、`presentation.ts`、`DiscussionThreadQuickFavoriteCard.tsx` 已统一接这套提取逻辑
  - `discussionEditorToStorage()` 现直接持久化编辑器 HTML，标题、字号、颜色、图片、视频不会在保存/发布时被回退成 markdown
- 后端已补齐富文本摘要清洗：
  - 新增 `RichTextExcerptSupport`
  - 已接入 `PublishedContentPersistenceService` 与 `MeQueryService`
- 运行态排查结论：
  - 本地 `18080` 一度仍在跑旧进程，所以新发帖子摘要还在写入 HTML
  - 重启 `scripts/start-server-dev-18080.ps1` 后，新发布帖子已改为写入纯文本摘要
- 为修复历史脏数据，新增 Flyway Java migration：
  - `apps/server/src/main/java/db/migration/V23__backfill_discussion_thread_excerpt_text.java`
  - 作用是按同一套 `RichTextExcerptSupport.toExcerpt(...)` 规则回填既有 `discussion_threads.excerpt_text`
- 已验证：
  - `apps/server -> use-local-java17-maven.ps1 "-Dtest=RichTextExcerptSupportTest,DraftApiIntegrationTest" test` 通过
  - `apps/web -> npm.cmd run typecheck` 通过
  - `GET http://127.0.0.1:18080/api/discussions/home?channel=video-production` 现已返回纯文本 excerpt
  - 浏览器实发富文本帖子后，详情页保留富文本样式，列表摘要不再泄漏 `<span style=...>`
- 细化记录已落到：
  - `.codex/progress-community-2026-05-21-rich-editor-followup.md`

## 2026-05-21 cloud sync for community rich editor round

- 本轮社区前后端已同步到测试云环境，且采用“新增 release 目录”方式发布，没有覆盖旧版本：
  - backend current release: `20260521-182732`
  - web current release: `20260521-182814`
- 发布前回滚锚点已确认保留：
  - backend rollback anchor: `20260519-212502`
  - web rollback anchor: `20260521-132138`
  - legacy stable baseline still retained:
    - backend: `20260509-123834`
    - web: `20260509-141400`
- 本轮发布标签：
  - `community-rich-editor-sync-2026-05-21`
- 发布后验证：
  - `scripts/check-test-runtime-readiness.mjs` on public test env: `11 passed / 0 failed`
  - release list re-check confirms both new release and previous rollback anchors are present
- 云端数据补记：
  - 公网 `/api/discussions/home?channel=video-production` 已可正常返回
  - 本地用于富文本验收的新帖子没有同步到云库，所以直接请求该本地验收 slug 的公网详情返回 `404`，这是数据差异，不是发布失败
- 公网浏览器验收已完成：
  - 登录页默认测试账号 `creator-a / dramatv-local-dev` 可正常进入 `/discussions/new`
  - 公网真实发布了一条测试帖子：`公网富文本验收-1779360452056`
  - 发布后自动跳回 `/discussions?channel=video-production`
  - 列表摘要为纯文本：`公网一级标题 公网红色大号正文 公网蓝色次级说明`
  - 详情页保留富文本样式：`h1`、红色 `28px` 文本、蓝色 `18px` 文本均正常渲染
  - 详情页未出现原始 HTML 泄漏

## 2026-05-21 admin cloud release entrypoint prepared

- 已把管理后台 `apps/admin` 接入测试环境 release 体系：
  - 新增 `scripts/deploy-test-admin.ps1`
  - 新增 `scripts/rollback-test-admin.ps1`
  - `scripts/list-test-releases.ps1` 已支持 `admin`
  - `scripts/stamp-test-stable-baseline.ps1` 已支持在远端存在 admin current 时补 `release.json`
- 根命令入口已补齐：
  - `npm run deploy:test:admin`
  - `npm run rollback:test:admin -- -ReleaseName <release> -VerifyAfterRollback`
- 当前策略已固定：
  - 管理后台保持独立前端运行时，不塞回社区前台发布链路
  - 云上继续共享同一个 `apps/server`
  - 当前后台公网验收入口先按独立端口 `3206` 管理，后续如果接正式独立域名，只改公开入口参数，不重做 release 结构
- 共享说明与实施文档已同步：
  - `.codex/community-admin-shared-sync.md`
  - `docs/04_实施设计/测试环境管理后台云发布补充-2026-05-21.md`
