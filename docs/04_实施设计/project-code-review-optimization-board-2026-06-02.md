# 项目整体代码审查与优化任务板

状态：`已完成`
创建日期：`2026-06-02`
适用范围：`apps/web`、`apps/admin`、`apps/server`

## 1. 背景

本轮不是新功能开发，而是基于 2026-06-02 的整体代码审查结果，集中收口已经确认的高风险问题、错误数据契约和工程稳定性缺口。

目标固定为三件事：

1. 先处理默认可用的高风险认证入口。
2. 再处理作者主页作品流与分页契约失真问题。
3. 最后补齐工程校验链路，避免新环境和 CI 因隐式依赖失败。

## 2. 已确认问题

### P0 安全

#### P0-1 后台本地 bootstrap 认证默认可用

- 风险：
  - `admin-chief / operator-floor / moderator-desk` 这组固定用户名可触发后台角色 bootstrap。
  - `allow-local-bootstrap` 当前默认 `true`。
  - `bootstrap-password` 当前默认 `dramatv-admin-demo`。
  - 管理后台登录页仍然预填这组演示账号密码。
- 影响：
  - 环境变量未显式覆盖时，后台存在默认可用入口。
- 相关位置：
  - `apps/server/src/main/resources/application.yml`
  - `apps/server/src/main/java/com/dramatv/community/admin/auth/AdminAuthProperties.java`
  - `apps/server/src/main/java/com/dramatv/community/admin/auth/AdminAuthApplicationService.java`
  - `apps/admin/src/components/AdminLoginForm.tsx`

#### P0-2 社区本地密码登录默认可用且可自动建号

- 风险：
  - 社区登录默认启用 `local_password`。
  - 默认共享密码为 `dramatv-local-dev`。
  - 用户不存在时会自动创建本地 `creator` 账号。
  - 已有本地账号无密码时，也能被这组共享密码初始化。
- 影响：
  - 测试/演示便利逻辑当前是默认行为，不是显式 opt-in。
- 相关位置：
  - `apps/server/src/main/resources/application.yml`
  - `apps/server/src/main/java/com/dramatv/community/identity/application/CommunityAuthProperties.java`
  - `apps/server/src/main/java/com/dramatv/community/identity/application/AuthApplicationService.java`
  - `apps/server/src/main/java/com/dramatv/community/admin/users/AdminUserGovernanceService.java`
  - `apps/admin/src/app/(dashboard)/users/UsersPageClient.tsx`

### P1 正确性 / 负载

#### P1-1 作者主页作品流无法保持真实混排顺序

- 风险：
  - 作品流首屏与“查看更多”都把 `videos` 和 `prompts` 拆成两条独立数据流。
  - 前端渲染时固定先拼视频、再拼提示词。
  - 真实“按发布时间混排”的作品流在当前模型下无法成立。
- 影响：
  - 作者主页“作品”和实际发布顺序不一致。
  - 导入量大时，这种错位会持续放大。
- 相关位置：
  - `apps/web/src/app/(community)/creators/[id]/page.tsx`
  - `apps/web/src/lib/mappers/community.ts`
  - `apps/web/src/features/creator/CreatorPage.tsx`
  - `apps/web/src/features/community-interactions/actions.ts`

#### P1-2 作者页接口暴露 `sort` 但服务层未实现，分页仍是 offset

- 风险：
  - 接口对外暴露 `sort`，服务层实际忽略。
  - 多个作者相关列表仍然使用 `offset:N`。
  - 大作者、导入作者、并发发布场景下，越往后翻越慢，页边界也可能漂移。
- 影响：
  - 接口契约和真实行为不一致。
  - 后续继续优化作者主页加载时，后端会先成为瓶颈。
- 相关位置：
  - `apps/server/src/main/java/com/dramatv/community/creator/controller/CreatorQueryController.java`
  - `apps/server/src/main/java/com/dramatv/community/creator/application/CreatorQueryService.java`
  - `apps/server/src/main/java/com/dramatv/community/shared/persistence/CommunityCatalogJdbcQueryService.java`
  - `apps/server/src/main/java/com/dramatv/community/discussion/application/DiscussionQueryService.java`
  - `apps/server/src/main/java/com/dramatv/community/prompt/application/PromptQueryService.java`

### P2 工程稳定性

#### P2-1 仓库级 typecheck 依赖预先生成 `.next/types`

- 风险：
  - 根脚本 `verify:quick` / `verify:full` 先跑 `typecheck`，后跑 `build`。
  - `apps/web/tsconfig.json` 又把 `.next/types/**/*.ts` 纳入编译输入。
  - 新环境第一次执行 `npm run typecheck` 会因为 `.next/types` 尚未生成而失败。
- 影响：
  - 本地新环境、CI、冷启动校验链路不稳定。
- 相关位置：
  - `package.json`
  - `apps/web/tsconfig.json`

## 3. 优化顺序

按风险和回归成本固定为以下顺序：

1. `O7-1` 收口后台 bootstrap 默认入口。
2. `O7-2` 收口社区本地密码登录和默认建号入口。
3. `O7-3` 收口作者主页作品流的数据契约，统一真实混排。
4. `O7-4` 把作者相关分页从误导性 `sort + offset` 收口到真实可实现契约。
5. `O7-5` 消除仓库级 typecheck 对 `.next/types` 的隐式依赖。

## 4. 待优化任务板

### O7-1 后台 bootstrap 默认入口收口

状态：`已完成`

验收标准：

- [ ] 默认配置下后台 bootstrap 登录关闭，且没有默认密码。
- [ ] 管理后台登录页不再预填演示账号和密码。
- [ ] 测试环境如果仍需 bootstrap，必须通过显式测试配置开启。
- [ ] 新增回归测试覆盖“默认关闭”和“测试环境显式开启”两个口径。

### O7-2 社区本地密码登录默认入口收口

状态：`已完成`

验收标准：

- [ ] 默认配置下社区 `local_password` 登录关闭。
- [ ] 自动建号和默认共享密码不再作为默认行为存在。
- [ ] 测试基座显式开启本地登录，不再依赖生产默认值。
- [ ] 后台创建本地账号时不再提示或依赖共享默认密码。

### O7-3 作者主页作品流统一成真实混排

状态：`已完成`

验收标准：

- [ ] 作者主页“作品”首屏按真实统一顺序返回和展示。
- [ ] “查看更多”延续同一条作品流，不再拆成视频游标和提示词游标。
- [ ] 至少补一条混合内容作者的回归测试。

### O7-4 作者页分页契约收口

状态：`已完成`

验收标准：

- [ ] 移除无效 `sort`，或后端真正实现 `sort`。
- [ ] 作者主页相关列表不再继续扩散误导性 offset 契约。
- [ ] 对大作者场景补最小回归验证。

### O7-5 工程校验链路去除 `.next/types` 隐式依赖

状态：`已完成`

验收标准：

- [ ] 新环境首次 `npm run typecheck` 不依赖手工先跑 `build`。
- [ ] 根级 `verify:quick` / `verify:full` 顺序与真实依赖关系一致。
- [ ] 至少完成本地一次从冷状态的校验验证。

## 5. 本轮执行规则

- 每次只推进一个任务，做完一个再更新状态。
- 每个任务都必须先补可复现测试或最小回归保护，再改代码。
- 每个任务完成后，要同步回写：
  - 本文档状态
  - `.codex/progress.md`
  - 对应单线进度文档
  - 如果影响前后台共享口径，再写 `.codex/community-admin-shared-sync.md`

## 6. 2026-06-02 status override

- `O7-1`: completed
  - backend local bootstrap is now closed by default
  - admin login prefill has been removed
- `O7-2`: completed
  - community `local_password` is now disabled by default
  - auto-create / local-password-init now require explicit `local-password-bootstrap-secret`
  - admin blank-password user creation now generates a temporary `DT` 12-char password instead of falling back to `dramatv-local-dev`
  - admin users page copy now describes generated temporary passwords
- `O7-3`: completed
  - backend now exposes `/api/creators/{id}/works` as a single mixed creator-work stream
  - creator page first load and load-more now both consume one cursor instead of separate video/prompt cursors
  - creator works keep true mixed order from backend instead of frontend concatenation
- `O7-4`: completed
  - creator legacy list endpoints no longer expose an unimplemented public `sort` contract
  - creator list `nextCursor` is now opaque on new responses instead of leaking raw `offset:N`
  - backend still accepts historical `offset:*` cursors for compatibility while only emitting opaque cursors going forward
- `O7-5`: completed
  - `apps/web` and `apps/admin` typecheck now follow the official Next 16 flow: `next typegen && tsc --noEmit`
  - root `verify:quick` / `verify:full` keep their existing order, but `typecheck` is now self-sufficient instead of implicitly depending on a prior build
  - local cold-state validation was completed by temporarily removing generated route types and re-running root `npm run typecheck`
- verification
  - `CreatorReadApiIntegrationTest`
  - `npx.cmd tsc --noEmit -p apps/web/tsconfig.json`
  - `apps/web -> npm.cmd run build`
  - `CommunityAuthDefaultsIntegrationTest`
  - `AdminUserGovernanceApiIntegrationTest`
  - `AuthMeApiIntegrationTest`
  - `apps/admin -> npm.cmd run build`
  - `npm.cmd run typecheck` from cold generated-route state
