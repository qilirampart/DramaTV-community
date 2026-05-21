# DramaTV 项目优化任务板

日期：`2026-05-18`

## 说明

这份任务板是对当前 DramaTV 项目“下一阶段优化方向”的总整理，不只包含共享链路回归。

它覆盖 6 类优化：

- 质量门禁统一
- CI / 部署流程正规化
- 前端性能指标化
- 共享层回归保护
- 安全与边界收口
- 文档与执行手册化

其中：

- 共享层回归的细项，已单独拆到：
  - `.codex/shared-regression-taskboard-2026-05-18.md`

---

## O1 质量门禁统一

状态：`待做`

目标：

- 把当前分散的类型检查、构建、后端测试、浏览器 smoke 收成统一入口
- 形成“本地开发完成后默认先跑一套”的固定动作

### O1-1 根级验证入口统一

状态：`已完成第一轮`

目标：

- 统一形成一组固定入口，例如：
  - `typecheck`
  - `build`
  - `backend-test`
  - `browser-smoke`

当前结果：

- 根目录 `package.json` 已补统一入口：
  - `typecheck`
  - `typecheck:web`
  - `typecheck:admin`
  - `build`
  - `backend-test`
  - `api-smoke`
  - `auth-session-smoke`
  - `notification-smoke`
  - `browser-smoke`
  - `verify:quick`
  - `verify:full`
- 当前推荐口径已固定：
  - 日常改动后先跑 `verify:quick`
  - 同步云端或阶段性验收前跑 `verify:full`
- 已完成最小验证：
  - `npm run typecheck`
  - `npm run api-smoke`
  - `npm run auth-session-smoke`
  - 本轮结果均通过

### O1-2 前台验证入口统一

状态：`已完成第一轮`

目标：

- `apps/web`
- `apps/admin`

这两个前端工程分别具备明确的：

- 类型检查入口
- 构建入口
- 最小 smoke 入口

当前结果：

- `apps/web/package.json` 已补：
  - `typecheck`
  - `smoke`
- `apps/admin/package.json` 已补：
  - `typecheck`
  - `smoke`
- 根目录入口已同步改为优先复用子应用自身脚本：
  - `npm run typecheck:web`
  - `npm run typecheck:admin`
  - `npm run smoke:web`
  - `npm run smoke:admin`
- 本轮验证已通过：
  - `npm run typecheck:web`
  - `npm run typecheck:admin`
  - `npm run smoke:web` -> `7 passed / 0 failed`
  - `npm run smoke:admin` -> `7 passed / 0 failed`

### O1-3 后端验证入口统一

状态：`已完成第一轮`

目标：

- `apps/server` 的常用测试入口按模块归类
- 减少每次都临时拼一长串 `-Dtest=...`

当前结果：

- 已新增统一分组脚本：
  - `scripts/run-backend-integration-suite.ps1`
- 当前固定 5 组入口：
  - `backend-test:core`
  - `backend-test:read`
  - `backend-test:admin`
  - `backend-test:logging`
  - `backend-test:full`
- 根目录默认 `backend-test` 已收口到 `backend-test:core`
- `scripts/run-local-stability-suite.ps1` 也已改为复用新的后端分组脚本，不再在脚本里手写一长串 `-Dtest=...`
- 本轮验证已通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`
  - 结果：`Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`

### O1-4 部署前后统一验收动作

状态：`已完成第一轮`

目标：

- 部署前先跑一套最小验证
- 部署后自动检查：
  - `/actuator/health`
  - 首页
  - 登录页
  - 关键页面

当前结果：

- 已新增测试环境 / 公网最小可用性脚本：
  - `scripts/check-test-runtime-readiness.mjs`
- 已补根目录统一入口：
  - `npm run readiness:test`
  - `npm run deploy:verify:pre`
  - `npm run deploy:verify:post:test`
- 当前默认口径已固定：
  - 部署前先跑 `deploy:verify:pre`
  - 部署到测试环境后跑 `deploy:verify:post:test`
- 当前 `readiness:test` 第一轮覆盖：
  - 根页 / 登录页可打开
  - `/home` `/featured` `/discussions` `/me` `/publish` 这些受保护页能正确跳登录
  - `feed home / prompts / discussions home` 三条公开 API 可用
  - 匿名通知代理保持 `200 + 空列表` 降级
  - 如果提供测试账号或后端健康地址，还能继续补登录态与 `/actuator/health` 检查
- 本轮验证结果：
  - `npm run typecheck` 已通过
  - 用本地链路执行 `node scripts/check-test-runtime-readiness.mjs --public-base-url http://127.0.0.1:3106 --api-base-url http://127.0.0.1:18080` 已 `11 passed / 0 failed`
  - 直接探测公网 `http://8.141.20.130/` 时当前执行环境拿到过 `502 Bad Gateway`，`readiness:test` 在真实公网入口上的全量结果暂时受环境可达性影响，不能视为脚本本身失败

---

## O2 CI / 部署流程正规化

状态：`待做`

目标：

- 从“人工可控部署”继续进化到“规范化发布流程”

### O2-1 最小 CI 草案

状态：`已完成第一轮`

目标：

- 至少明确一版 CI 要跑什么：
  - 前台 typecheck
  - 前台 build
  - 后端关键测试

当前结果：

- 仓库已新增最小 CI 工作流：
  - `.github/workflows/ci-minimal.yml`
- 已新增配套说明文档：
  - `docs/04_实施设计/最小 CI 草案-2026-05-18.md`
- 当前第一轮 CI 已固定 3 个 job：
  - `web-quality`
  - `admin-quality`
  - `backend-core`
- 覆盖范围：
  - `apps/web` 的 `typecheck + build`
  - `apps/admin` 的 `typecheck + build`
  - `apps/server` 的核心集成测试，运行在临时 `PostgreSQL 16 + Redis 7` 上
- 当前有意不把本机 PowerShell / `.tools` 路径假设直接带进 CI，而是在 Linux runner 内用原生命令执行

### O2-2 部署脚本与验收脚本对齐

状态：`已完成第一轮`

目标：

- `deploy-test-web.ps1`
- `deploy-test-backend.ps1`

和对应 smoke / readiness 检查形成闭环

当前结果：

- `scripts/deploy-test-web.ps1`
  - 已新增可选开关：
    - `-VerifyBeforeDeploy`
    - `-VerifyAfterDeploy`
- `scripts/deploy-test-backend.ps1`
  - 已新增可选开关：
    - `-VerifyBeforeDeploy`
    - `-VerifyAfterDeploy`
- 当前约定：
  - `VerifyBeforeDeploy` 先执行 `npm run deploy:verify:pre`
  - `VerifyAfterDeploy` 在部署完成后执行测试环境 readiness 校验，并把结果落到 `artifacts/runtime-readiness/test/*.json`
- 本轮验证：
  - 两个脚本都已通过 Windows PowerShell 语法探测
  - `npm run deploy:verify:pre` 已通过

### O2-3 回滚与失败态动作说明

状态：`已完成第一轮`

目标：

- 明确部署失败后：
  - 看什么日志
  - 用哪个 release 回滚
  - 先确认哪几个健康点

当前结果：

- 已新增可执行清单文档：
  - `docs/04_实施设计/测试环境部署回滚与故障排查清单-2026-05-18.md`
- 这版文档已经按当前真实测试环境收口：
  - ECS：`8.141.20.130`
  - 前台服务：`dramatv-community-web.service`
  - 后端服务：`dramatv-community-server.service`
  - 前后端 release 目录结构
  - 部署前/后标准动作
  - 失败时的最短检查顺序
  - 手工回滚原则

---

## O3 前端性能指标化

状态：`已完成第一轮`

目标：

- 从“发现卡顿再修”升级到“固定指标跟踪”

### O3-1 首页性能基线

状态：`已完成第一轮`

目标：

- 固定关注：
  - `/`
  - `/home`

的首屏加载与视频挂载数

当前结果：

- 已新增基线脚本：
  - `scripts/run-local-frontend-performance-baseline.py`
- 已补根目录入口：
  - `npm run perf:frontend:baseline`
- 已新增说明文档：
  - `docs/04_实施设计/前端性能基线说明-2026-05-18.md`
- 当前本地首轮结果：
  - `/home`：`domContentLoaded=481ms`，`load=532ms`，`mountedVideos=1`
  - `/`：`domContentLoaded=263ms`，`load=1446ms`，`mountedVideos=1`

### O3-2 精选页压力基线

状态：`已完成第一轮`

目标：

- 固定关注：
  - `/featured` 首屏请求数
  - 分类切换 20 次左右后的表现
  - 视频挂载数量

当前结果：

- 基线脚本已覆盖 `/featured` 分类切换约 `20` 次场景
- 当前本地首轮结果：
  - `mp4Requests=0`
  - `mountedVideos=0`
  - `featuredCards=24`
  - 未出现 console error

### O3-3 详情页往返压力基线

状态：`已完成第一轮`

目标：

- 固定关注：
  - 详情页多次进入退出
  - 是否重复加载视频
  - 是否引发页面卡死

当前结果：

- 基线脚本已覆盖从 `/featured?filter=video_prompt&sort=hot` 进入详情、返回列表、重复 3 轮的场景
- 当前口径已从“粗暴累计全页面资源数”收口为：
  - 清空 resource timing 后只统计详情往返窗口
  - 看 `mp4Requests / uniqueMp4Requests / mountedVideos / featuredCards / console errors`
- 当前本地首轮结果：
  - `resourceWindow.mp4Requests=1`
  - `resourceWindow.uniqueMp4Requests=1`
  - 返回后 `mountedVideos=0`
  - 返回后 `featuredCards=24`

### O3-4 评论区交互性能基线

状态：`已完成第一轮`

目标：

- 固定关注：
  - 评论提交耗时
  - 回复展开耗时
  - 删除评论耗时
  - 是否触发整页重拉

当前结果：

- 基线脚本已覆盖：
  - 展开回复
  - 打开楼中楼回复框
  - 提交一条回复
- 为避免污染本地演示数据，脚本已在执行前后自动调用：
  - `scripts/reset-local-browser-smoke-state.ps1`
- 当前本地首轮结果：
  - 回复后资源增量 `resourceDeltaAfterReply=3`
  - 评论条目数 `1 -> 3`
  - 未看到整页崩溃或评论区回退

---

## O4 共享层回归保护

状态：`已完成第一轮`

目标：

- 把“修过一次的共享问题”逐步补成自动防回归

说明：

- 这部分详细子项已经单独拆板：
  - `.codex/shared-regression-taskboard-2026-05-18.md`

### O4-1 后台改前台展示的共享回归

状态：`进行中`

### O4-2 发布 / 评论 / 通知 / 举报 / 审核共享链路回归

状态：`进行中`

### O4-3 登录 / 会话 / 权限回归

状态：`待做`

### O4-4 共享层性能与稳定性回归

状态：`待做`

---

## O5 安全与边界收口

状态：`进行中`

目标：

- 在不引入过重复杂度的前提下，把当前已经进入生产前阶段的风险边界先收住

### O5-1 上传校验增强

状态：`已完成第一轮`

目标：

- 文件类型校验
- MIME 校验
- 大小限制校验

当前结果：

- 已新增上传校验集成测试：
  - `apps/server/src/test/java/com/dramatv/community/integration/UploadValidationIntegrationTest.java`
- 第一轮已把上传边界从“仅 MIME 前缀判断”收口到更明确的三层规则：
  - MIME 白名单
  - 文件扩展名白名单
  - `policy` 注册 MIME 与二进制上传 `Content-Type` 一致性校验
- 当前允许格式已固定为：
  - 图片：`image/jpeg`、`image/png`、`image/webp`
  - 视频：`video/mp4`、`video/quicktime`、`video/webm`
  - 图片扩展名：`jpg`、`jpeg`、`png`、`webp`
  - 视频扩展名：`mp4`、`mov`、`webm`
- 当前第一轮已覆盖的关键拒绝场景包括：
  - `svg` 这类高风险图片 MIME 不能再创建上传 policy
  - 伪装成 `video/mp4` 的 `.exe` 文件名不能再创建上传 policy
  - 已注册为 `image/jpeg` 的资源，二进制上传阶段不能改成 `image/png`
  - 即便前置 policy 虚报小体积，实际上传超限仍会拒绝并清理本地残留文件
- 后端统一测试分组已接入：
  - `scripts/run-backend-integration-suite.ps1 -Suite core`

### O5-2 登录 / 举报 / 评论 / 上传频控

状态：`已完成第一轮`

目标：

- 为关键写接口预留基础限流与防刷思路

当前结果：

- 已新增 Redis 版基础频控配置与服务：
  - `apps/server/src/main/java/com/dramatv/community/shared/security/ActionRateLimitProperties.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/security/ActionRateLimiter.java`
- 已新增请求 IP 解析组件，并把访问日志的 `remoteIp` 解析复用到登录频控：
  - `apps/server/src/main/java/com/dramatv/community/shared/request/RequestClientIpResolver.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/request/AccessLogFilter.java`
- 第一轮已把频控接到 3 条关键入口：
  - 登录：按 `clientIp + username` 限频
  - 举报创建：按 `userId` 限频
  - 上传 `policy / binary`：按 `userId` 分别限频
- 当前默认阈值已固定为：
  - 登录：`60s / 6 次`
  - 举报：`60s / 5 次`
  - 上传 policy：`60s / 20 次`
  - 上传 binary：`60s / 20 次`
- 已统一使用稳定错误码返回 `429 Too Many Requests`：
  - `AUTH_RATE_LIMITED`
  - `REPORT_RATE_LIMITED`
  - `UPLOAD_RATE_LIMITED`
- 顺手补上一条上传边界真校验：
  - `uploadBinary` 现已校验资源归属，不能再拿别人的 `assetId` 继续上传
  - 对应错误码：`UPLOAD_ASSET_FORBIDDEN`
- 已新增后端回归：
  - `apps/server/src/test/java/com/dramatv/community/integration/ActionRateLimitIntegrationTest.java`
- 统一入口 `scripts/run-backend-integration-suite.ps1 -Suite core` 已接入这组新回归。
- 前端共享错误呈现器也已同步补齐安全文案：
  - `AUTH_RATE_LIMITED`
  - `REPORT_RATE_LIMITED`
  - `UPLOAD_RATE_LIMITED`
  - `UPLOAD_ASSET_FORBIDDEN`
- 本轮验证已通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`
  - `node --test apps/web/src/lib/api/community-error-presenter.test.mjs`
  - `npm run typecheck:web`

### O5-3 权限边界复查

状态：`已完成第一轮`

目标：

- 游客
- 普通用户
- 创作者
- 后台管理员

这些角色在前台和后台的边界再收一遍

当前结果：

- 已新增权限矩阵文档：
  - `docs/04_实施设计/社区与后台权限边界矩阵-2026-05-18.md`
- 已把当前真实边界按 4 层写清：
  - 社区前台页面权限
  - 社区 API 权限
  - 后台页面权限
  - 后台 API 权限
- 已补后端跨角色拒绝访问回归测试：
  - `AdminAccessBoundaryApiIntegrationTest`
- 当前第一轮覆盖的关键拒绝场景包括：
  - 匿名用户不能访问 `/api/admin/**`
  - 普通社区登录用户不能访问 `/api/admin/**`
  - `operator` 不能访问 `reports / comments`
  - `moderator` 不能访问 `feed-ops / taxonomy`
  - 非后台角色不能走后台登录成功
- 已补测试执行收口：
  - `apps/server/src/test/resources/junit-platform.properties`
  - 显式关闭 JUnit 并行执行，避免 admin 集成测试在共享本地测试库上互删 `it-*` 数据导致假失败
- 统一入口 `scripts/run-backend-integration-suite.ps1 -Suite admin` 已纳入：
  - `AdminAccessBoundaryApiIntegrationTest`

### O5-4 错误信息对外统一

状态：`已完成第一轮`

目标：

- 不直接暴露底层异常
- 逐步统一成“可显示文案 + requestId + 稳定错误口径”

当前结果：

- 已新增社区前台共享错误呈现器：
  - `apps/web/src/lib/api/community-error-presenter.ts`
- 已把社区前台高频写链路统一走“稳定错误码 -> 安全文案 -> requestId”：
  - 登录
  - 发布
  - 个人资料
  - 上传
  - 互动动作
  - 讨论区动作
- 已把 `/ /home /featured /me /publish /discussions /prompts /videos /workflows /creators /canvas` 这一批主用户路径上的 `backend unavailable` 明细统一收口成安全提示，不再把底层 `/api/...` 路径直接暴露给用户界面。
- 已新增前端轻量回归：
  - `apps/web/src/lib/api/community-error-presenter.test.mjs`
- 已新增后端错误信封回归：
  - `apps/server/src/test/java/com/dramatv/community/integration/ApiErrorEnvelopeIntegrationTest.java`
- `scripts/run-backend-integration-suite.ps1 -Suite core` 已接入这组新后端回归。
- 本轮验证已通过：
  - `node --test apps/web/src/lib/api/community-error-presenter.test.mjs`
  - `npm run typecheck:web`
  - `npm run build:web`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`
- 本轮暂未收口：
  - `apps/admin` 的独立错误码展示策略
  - `features/devtools/local-smoke` 里本地命令执行失败时的开发态原始输出

### O5-5 审计日志与敏感信息保护复查

状态：`已完成第一轮`

目标：

- 确认日志中不泄露 token / 签名 / 大块敏感正文

当前结果：

- 已新增敏感 payload 脱敏组件：
  - `apps/server/src/main/java/com/dramatv/community/shared/security/SensitivePayloadSanitizer.java`
- 第一轮已把以下链路收口到“先脱敏、再截断、再落库 / 展示”：
  - 内部回调 `task_callback_logs.raw_payload_json`
  - 异步任务 `async_task_records.error_message`
  - 后台媒体任务详情读取时的 `error_message / result_json / raw_payload_json`
- 当前已明确覆盖的高风险片段包括：
  - `token=...`
  - `signature=...`
  - `authorization=...`
  - `policy=...`
  - `Bearer ...`
- 为避免这轮安全回归再次被测试脏数据掩盖，`ApiIntegrationTestSupport.cleanupTestUsers()` 也已补删：
  - `audit_records.operator_id` 指向 `it-*` 测试用户的残留记录
- 本轮验证已通过：
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite core`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite admin`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-backend-integration-suite.ps1 -Suite logging`

---

## O6 文档与执行手册化

状态：`已完成第一轮`

目标：

- 从“有很多过程文档”升级到“执行时能直接照着做”

### O6-1 本地开发标准动作

状态：`已完成第一轮`

目标：

- 拉服务
- 验状态
- 跑最小验证

形成固定手册

当前结果：

- 已新增短手册：
  - `docs/04_实施设计/本地开发标准动作清单-2026-05-18.md`
- 当前已把本地开发固定动作收口为：
  - 拉起 PostgreSQL / Redis
  - 启动后端
  - 启动 `apps/web` / `apps/admin`
  - 跑 `readiness:local`
  - 跑 `verify:quick`
- 这版文档只保留可直接执行的动作，不再把长背景说明混进主流程

### O6-2 部署前检查清单

状态：`已完成第一轮`

目标：

- 改了什么
- 本地过了什么
- 云端需要同步什么

当前结果：

- 已新增短手册：
  - `docs/04_实施设计/测试环境部署前检查清单-2026-05-18.md`
- 已把部署前固定口径写实：
  - 先分清这轮改的是前台、后端还是共享层
  - 先跑 `npm run deploy:verify:pre`
  - 再明确本次要同步本机云镜像、公网前台、云后端中的哪一项

### O6-3 部署后检查清单

状态：`已完成第一轮`

目标：

- 健康检查
- 关键页面
- 关键写链路
- 浏览器回归

当前结果：

- 已新增短手册：
  - `docs/04_实施设计/测试环境部署后验收清单-2026-05-18.md`
- 已把部署后默认动作收口为：
  - 先跑 `npm run deploy:verify:post:test`
  - 再查关键页面
  - 再按本轮改动补最小写链路人工验收

### O6-4 故障排查入口清单

状态：`已完成第一轮`

目标：

- 服务起不来先查哪里
- 前后端不一致先查哪里
- 公网异常先查哪里
- 后台误伤前台先查哪里

当前结果：

- 已新增速查表：
  - `docs/04_实施设计/故障排查入口速查表-2026-05-18.md`
- 已配套长文档：
  - `docs/04_实施设计/测试环境部署回滚与故障排查清单-2026-05-18.md`
- 当前已把最常见的四类问题入口固定下来：
  - 本地服务起不来
  - 本地 / 3107 / 公网不同步
  - 公网打不开
  - 后台共享改动误伤前台

---

## 当前优先级建议

### P0 先做

- `O1-1`
- `O1-4`
- `O4`
- `O5-3`

### P1 接着做

- `O1-2`
- `O1-3`
- `O2-2`
- `O5-1`
- `O5-4`

### P2 再做

- `O2-3`
- `O5-2`
- `O5-5`

## 当前结论

之前提到的优化方向，不止“共享链路回归”这一块。

现在总共分两层管理：

- 总优化板：
  - `.codex/dramatv-optimization-taskboard-2026-05-18.md`
- 共享回归子板：
  - `.codex/shared-regression-taskboard-2026-05-18.md`

后续如果要开始做优化，应优先从：

- 统一质量门禁
- 性能指标化
- 共享层回归保护

这三条主线往下推。
