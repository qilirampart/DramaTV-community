# 测试环境发布台账

规则：

- 这份台账主表仍以测试环境社区前台 / 社区后端联合发布为主；自 `2026-05-21` 起，后台 `apps/admin` 的独立云发布也纳入同一份台账追加记录。
- 采用 append-only 方式追加，不回改历史条目。
- 稳定版本必须写清前端 release、后端 release、验证口径和回滚目标。

## 当前稳定基线

- 稳定版本标识：`test-stable-2026-05-19-community-r1`
- 固化时间：`2026-05-19`
- 前端当前云 release：`/opt/dramatv-community-web/releases/20260509-141400`
- 后端当前云 release：`/opt/dramatv-community-server/releases/20260509-123834`
- 来源说明：这两个 release 是“补 release 元数据与回滚规范之前”的历史测试环境当前版本，现已通过 `scripts/stamp-test-stable-baseline.ps1` 回填远端 `release.json`
- 版本身份说明：虽然远端已有 `release.json`，但它们仍然是 `legacy baseline`，`commitSha / branch` 只能保留为 `unknown`，不能反推精确源码版本
- 用途：作为后续测试环境异常时的第一回滚锚点

## 发布记录

| 日期 | 稳定标识 / 发布批次 | 范围 | 前端 release | 后端 release | 验证结果 | 回滚备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-19 | test-stable-2026-05-19-community-r1 | baseline capture | 20260509-141400 | 20260509-123834 | 基线固化，后续发布从此对照 | 回滚优先回到这组 legacy release |
| 2026-05-19 | r2-20260519-community | community frontend + backend sync | 20260519-212618 | 20260519-212502 | `deploy:test:backend` / `deploy:test:web` + `deploy:verify:pre/post:test` 全部通过 | 当前测试环境新批次，后续异常优先回看这一组 |

## 管理后台补充

- 2026-05-21 起，管理后台 `apps/admin` 也已纳入同一套测试环境 release 体系：
  - `scripts/deploy-test-admin.ps1`
  - `scripts/rollback-test-admin.ps1`
  - `scripts/list-test-releases.ps1 -Runtime admin`
  - 远端 `release.json`
- 当前还没有首条真实 admin 云发布记录。
- 第一次执行 `deploy:test:admin` 成功后，再把实际 admin release 追加到本台账。
