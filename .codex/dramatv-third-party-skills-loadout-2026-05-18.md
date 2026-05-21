# DramaTV Third-Party Skills Loadout

日期：`2026-05-18`

来源分析文档：

- `E:\点众\小说库相似度比对服务工作区\docs\54_第三方编码skills汇总_2026-05-18.md`

## 结论

这份汇总文档里的两套第三方 skills，可以按“底层行为护栏 + 上层工程流程”来理解：

- `andrej-karpathy-skills`
  - 适合作为所有编码任务的底层行为约束
  - 重点是减少过度设计、误改无关代码、没想清楚就开工这类问题
- `agent-skills`
  - 适合作为中大型项目的工程流程增强
  - 覆盖前端、调试、性能、上线、安全、代码质量等多个方向

结合 DramaTV 当前阶段，这个项目已经不再是纯页面原型，而是：

- 有 `apps/web + apps/server + apps/admin`
- 有前后台并行推进
- 有本地、云、OSS、发布、回归、性能和上线准备

所以不适合只装一条通用规则，也不建议把 Addy 全量 20 多个 skill 一次性全部灌入。全量装入会让触发范围过宽，容易产生上下文噪音。

当前采取的策略是：

- 安装 `Karpathy` 作为底层行为护栏
- 从 `Addy Osmani Agent Skills` 中挑选最贴合 DramaTV 当前阶段的 skill 组成精简装载集

## 已安装技能

已安装到全局目录：

- `C:\Users\psk13\.codex\skills\karpathy-guidelines`
- `C:\Users\psk13\.codex\skills\source-driven-development`
- `C:\Users\psk13\.codex\skills\frontend-ui-engineering`
- `C:\Users\psk13\.codex\skills\debugging-and-error-recovery`
- `C:\Users\psk13\.codex\skills\performance-optimization`
- `C:\Users\psk13\.codex\skills\browser-testing-with-devtools`
- `C:\Users\psk13\.codex\skills\security-and-hardening`
- `C:\Users\psk13\.codex\skills\shipping-and-launch`
- `C:\Users\psk13\.codex\skills\code-review-and-quality`

## 选择理由

### 1. `karpathy-guidelines`

作为底层护栏最合适。它约束：

- 先想清楚再编码
- 先做最小可用解
- 只做外科手术式修改
- 目标必须可验证

这和 DramaTV 这种已经进入“收口、修复、稳定化”的项目非常匹配。

### 2. `source-driven-development`

适合当前项目大量使用：

- Next.js
- React
- Spring Boot
- 浏览器验收
- 云端链路

后面做框架相关改动时，更适合走“查官方资料再下手”的模式，避免靠记忆写过期方案。

### 3. `frontend-ui-engineering`

DramaTV 当前还有大量前端精修任务，这个 skill 对：

- 页面结构
- 组件组织
- 视觉一致性
- 响应式与交互

都有直接帮助。

### 4. `debugging-and-error-recovery`

当前项目很常见的工作之一就是：

- 服务起不来
- 前后端联调异常
- 云端和本地行为不一致
- 回归后出现共享层 bug

这个 skill 很贴合现状。

### 5. `performance-optimization`

DramaTV 的视频卡片、悬浮播放、评论区、精选页资源量、首页首屏都已经进入性能优化阶段，所以这个 skill 是当前阶段高频可用项。

### 6. `browser-testing-with-devtools`

项目经常依赖浏览器级复检、页面交互回归、网络请求和媒体加载检查，这个 skill 对后续浏览器验收很有价值。

### 7. `security-and-hardening`

项目当前已涉及：

- 登录与会话
- 上传
- 举报
- 审核预留
- OSS 媒体访问

所以安全和边界收口已经进入有意义的阶段。

### 8. `shipping-and-launch`

项目已经开始考虑：

- 公网访问
- 云端部署
- OSS
- 上线准备

这个 skill 更适合作为后续上线前的约束补充。

### 9. `code-review-and-quality`

当前大量工作不是从零开发，而是反复修正共享层、清理回归和收口，这个 skill 对代码评审口径和质量收口有帮助。

## 暂未安装的技能

以下 skill 暂不装入本次精简集：

- `planning-and-task-breakdown`
- `spec-driven-development`
- `test-driven-development`
- `documentation-and-adrs`
- `api-and-interface-design`
- `incremental-implementation`
- `code-simplification`
- `ci-cd-and-automation`
- `git-workflow-and-versioning`
- `deprecation-and-migration`
- `doubt-driven-development`
- `context-engineering`
- `idea-refine`
- `interview-me`
- `using-agent-skills`

原因不是这些 skill 没价值，而是当前先控制触发面。等 DramaTV 后续进入：

- 更重的测试体系建设
- 更规范的接口设计
- 更强的 CI/CD
- 更正式的 ADR / 方案沉淀

再按需补装更合适。

## 对 DramaTV 的实际建议

当前推荐的使用口径：

- 默认由 `karpathy-guidelines` 作为底层行为护栏
- 涉及框架正确性时，优先叠加 `source-driven-development`
- 涉及前端界面和交互时，优先叠加 `frontend-ui-engineering`
- 遇到联调、回归、启动异常时，优先叠加 `debugging-and-error-recovery`
- 遇到卡顿、加载慢、媒体过重时，优先叠加 `performance-optimization`
- 做浏览器验收和回归时，优先叠加 `browser-testing-with-devtools`
- 做登录、上传、权限、举报、审核边界时，优先叠加 `security-and-hardening`
- 做部署、验收、上线准备时，优先叠加 `shipping-and-launch`

## 激活说明

这些 skill 已经拷贝到全局 `C:\Users\psk13\.codex\skills`，但当前会话未必会立即重新装载。

要让 Codex 明确识别到新增 skill，建议：

- 重启 Codex
- 或开启一个新聊天

如果后面要继续给 DramaTV 增补更多第三方 skill，优先基于这份装载清单继续扩，而不是一次性全量灌入。
