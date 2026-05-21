# 社区主线云同步核对

日期：2026-05-04

## 1. 结论摘要

- `T1 taxonomy` 那一大轮不是只改了前端，当时明确涉及前端、后端、数据库三层，并且已经同步到云测试环境。
- 当前社区主线三层运行态核对结果：
  - 前端：已同步到云
  - 后端：已同步到云
  - 数据库结构：已同步到云
- 当前没有发现“本地代码已经改了，但云端后端或数据库结构还停在旧版本”的证据。
- 需要单独区分：
  - `代码 / 二进制 / 表结构` 是否同步
  - `数据库内容数据` 是否完全一致
  - 当前前者基本同步，后者不保证完全一致。

## 2. 任务级核对

| 任务 | 前端 | 后端 | 数据库 | 结论 | 证据 |
|---|---|---|---|---|---|
| `T1 分类体系后端化` | 是 | 是 | 是 | 已同步到云 | `.codex/progress-community.md` 明确记录 `T1-1/T1-2/T1-3` 已完成；新增迁移 `V19__add_prompt_taxonomy_fields.sql`；云端 taxonomy backfill 和 `3107 /featured` 数量验收已记录 |
| `T2 媒体链路稳定化` | 是 | 是 | 部分涉及 | 已同步到云 | 任务板标记 `T2-1/T2-2/T2-3` 已完成；公网已实测 “后端写 OSS + /media/** 代理 + Range” |
| `T3 发布状态模型剩余收口` | 是 | 是 | 无新增迁移要求 | 已同步到云 | 任务板标记 `T3-1/T3-2/T3-3` 已完成；当前云端后端 hash 与本地一致 |
| `T4 登录 / 会话 / 权限专项` | 是 | 是 | 无新增迁移要求 | 已同步到云 | 任务板标记 `T4-1/T4-2/T4-3` 已完成；当前公网登录、受保护路由、通知代理已正常 |
| 本轮“通知红点 + 头像跳主页” | 是 | 否 | 否 | 已同步到云 | 纯前端需求；已重新部署云前端并在公网验证 |

## 3. 当前运行态核对

### 3.1 前端

- 云前端当前 release：
  - `/opt/dramatv-community-web/releases/20260504-115410`
- 这是本轮用当前本地 `apps/web` 工作区重新部署后的版本。
- 当前判断：
  - 云前端与当前本地前端主线同步。

### 3.2 后端

- 本地重新打包后的 jar SHA256：
  - `9abaedfc90ec2cdac2da9e0cd2eb6f0e55f04b8ffe678483f76f074e5ffb3cab`
- 云端当前运行 jar SHA256：
  - `9abaedfc90ec2cdac2da9e0cd2eb6f0e55f04b8ffe678483f76f074e5ffb3cab`
- 云端服务状态：
  - `dramatv-community-server` = `active`
- 当前判断：
  - 云后端二进制与当前本地后端打包产物一致。

### 3.3 数据库结构

- 本地迁移目录最新版本：
  - `V19__add_prompt_taxonomy_fields.sql`
- 云测试库 `flyway_schema_history`：
  - 总记录数：`19`
  - 最新版本：`19`
  - 最近三条：
    - `19 | add prompt taxonomy fields | true`
    - `18 | flatten comment threads to two levels | true`
    - `17 | scope canvas copy idempotency per operator | true`
- 当前判断：
  - 云数据库结构版本已经追到本地最新迁移版本 `V19`。

## 4. 当前仍要区分的“差异”

### 4.1 已排除的差异

- 不是“taxonomy 只改了前端没上云”
- 不是“云后端还停在旧 jar”
- 不是“云数据库结构还没跑到 taxonomy 迁移”

### 4.2 仍然可能存在，但这次没有做全量比对的差异

- 本地数据库内容 vs 云测试库内容
  - 比如本地额外的测试账号、草稿、临时帖子、手工导入数据
  - 这些不是结构差异，而是数据内容差异
- 浏览器本地状态
  - cookie
  - localStorage
  - 登录会话
  - 通知已读状态
- 本地开发环境特有资源
  - 本地文件资源
  - 本地临时上传物

## 5. 这次核对的直接证据

- 任务板与日志：
  - `.codex/progress-community.md`
  - `.codex/progress.md`
- 本地迁移目录：
  - `apps/server/src/main/resources/db/migration`
- 云端运行态：
  - `/opt/dramatv-community-server/current`
  - `/opt/dramatv-community-web/current`
- 云数据库：
  - `flyway_schema_history`

## 6. 最终判断

- 如果问题是：
  - “taxonomy 那一大轮后端和数据库有没有同步到云？”
  - 答案是：有，而且已经同步。
- 如果问题是：
  - “当前本地和云端是不是还存在明显未同步的代码 / 结构差异？”
  - 当前结论是：前端、后端、数据库结构三层都没有发现明显未同步差异。
- 如果下一步要继续严查：
  - 应该查“数据内容差异”，而不是继续查“代码和结构有没有上云”。
