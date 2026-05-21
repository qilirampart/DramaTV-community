# DramaTV 社区仓库入口

当前正式工程已经固定为：

- 前端：`apps/web`
- 后端：`apps/server`

根目录里最早期的 `React + Vite` 页面原型已经迁移到：

- `archive/legacy-react-vite-prototype`

默认开发和后续迭代都以 `apps/web` 这套正式社区工程为准，不再以旧原型作为主线。

## 常用命令

- 启动正式前端：`npm run dev:web`
- 启动后台前端：`npm run dev:admin`
- 构建正式前端：`npm run build:web`
- 构建后台前端：`npm run build:admin`
- 启动归档原型：`npm run dev:prototype`
- 构建归档原型：`npm run build:prototype`

## 统一验证入口

当前仓库已经把常用验证动作统一成根目录脚本，推荐优先使用这组入口：

- `npm run typecheck`
  - 同时检查 `apps/web` 与 `apps/admin`
- `npm run typecheck:web`
  - 只检查 `apps/web`
- `npm run typecheck:admin`
  - 只检查 `apps/admin`
- `npm run build`
  - 同时构建 `apps/web` 与 `apps/admin`
- `npm run backend-test`
  - 运行后端最小关键集成测试
- `npm run backend-test:read`
  - 运行前台公共读链路集成测试
- `npm run backend-test:admin`
  - 运行后台治理主链路集成测试
- `npm run backend-test:logging`
  - 运行日志 / requestId / traceId 相关集成测试
- `npm run api-smoke`
  - 运行社区 API smoke
- `npm run auth-session-smoke`
  - 运行登录 / 会话回归
- `npm run smoke:web`
  - 运行社区前台路由最小 smoke
- `npm run smoke:admin`
  - 运行社区后台路由最小 smoke
- `npm run browser-smoke`
  - 运行浏览器级社区 smoke
- `npm run perf:frontend:baseline`
  - 运行首页 / 精选 / 详情往返 / 评论区 的前端性能基线
- `npm run readiness:test`
  - 运行测试环境 / 公网最小可用性检查
- `npm run verify:quick`
  - 快速回归：`typecheck + backend-test + api-smoke + auth-session-smoke`
- `npm run verify:full`
  - 完整回归：`typecheck + build + backend-test + api-smoke + auth-session-smoke + browser-smoke`
- `npm run deploy:verify:pre`
  - 部署前固定动作，当前等价于 `verify:quick`
- `npm run deploy:verify:post:test`
  - 部署到测试环境后固定动作，当前等价于 `readiness:test`
- `npm run deploy:test:web`
  - 按标准口径部署社区前台到测试环境，并默认执行部署前/后验证
- `npm run deploy:test:backend`
  - 按标准口径部署社区后端到测试环境，并默认执行部署前/后验证
- `npm run release:list:test`
  - 查看测试环境当前 web / server release 列表与 `current` 指向
- `npm run release:stamp:baseline:test`
  - 一次性给当前云端稳定基线补远端 `release.json`
- `npm run rollback:test:web -- -ReleaseName 20260509-141400 -VerifyAfterRollback`
  - 把测试环境前台回退到指定 release
- `npm run rollback:test:backend -- -ReleaseName 20260509-123834 -VerifyAfterRollback`
  - 把测试环境后端回退到指定 release

推荐口径：

- 日常改动后先跑：`npm run verify:quick`
- 准备同步云端或做阶段性验收前再跑：`npm run verify:full`
- 部署到测试环境前先跑：`npm run deploy:verify:pre`
- 部署完成后再跑：`npm run deploy:verify:post:test`
- 需要确认当前版本或准备回滚时先跑：`npm run release:list:test`

`readiness:test` 默认面向当前测试环境公网入口 `http://8.141.20.130`，第一轮固定检查：

- 根页 / 登录页是否可打开
- `/home` `/featured` `/discussions` `/me` `/publish` 这些受保护页是否正确跳登录
- `feed home / prompts / discussions home` 三条公开 API 是否可用
- 匿名通知代理是否保持 `200 + 空列表` 降级

如果需要把这套检查扩展到登录态或直连后端健康检查，可额外传入：

- `DRAMATV_TEST_CREATOR_USERNAME`
- `DRAMATV_TEST_CREATOR_PASSWORD`
- `DRAMATV_TEST_BACKEND_HEALTH_URL`

## 执行手册入口

这轮已经把常用执行动作收口成短手册，优先按这些文档操作：

- `docs/04_实施设计/本地开发标准动作清单-2026-05-18.md`
- `docs/04_实施设计/测试环境部署前检查清单-2026-05-18.md`
- `docs/04_实施设计/测试环境部署后验收清单-2026-05-18.md`
- `docs/04_实施设计/本地手动启动操作指南-2026-05-21.md`
- `docs/04_实施设计/故障排查入口速查表-2026-05-18.md`
- `docs/04_实施设计/测试环境部署回滚与故障排查清单-2026-05-18.md`
- `docs/04_实施设计/最小 CI 草案-2026-05-18.md`
- `docs/04_实施设计/前端性能基线说明-2026-05-18.md`
- `docs/04_实施设计/测试环境社区前台发布与回滚方案-2026-05-19.md`
- `ops/releases/test-env-release-ledger.md`

## 测试环境版本管理

当前已经把测试环境版本管理收口到“release 目录 + current 切换 + 本地发布台账”这一层：

- 远端当前稳定基线：`test-stable-2026-05-19-community-r1`
- 稳定基线记录：`ops/releases/test-env-release-ledger.md`
- 当前稳定基线与后续新发版都会在远端 release 目录里保留 `release.json`
- 回滚入口固定为：
  - `npm run release:list:test`
  - `npm run rollback:test:web -- -ReleaseName <release>`
  - `npm run rollback:test:backend -- -ReleaseName <release>`

当前这套仍然不是完整 CI/CD，但已经从“手工记忆版部署”推进到“可追踪、可比对、可回退”的测试环境发布规范。

## 说明

- 旧原型保留仅用于回看早期页面思路，不再承接新需求。
- 页面美化、交互优化、真实接口联调都继续在 `apps/web` 中完成。
