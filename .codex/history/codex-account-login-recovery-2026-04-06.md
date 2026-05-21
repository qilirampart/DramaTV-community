# Codex 桌面端账号登录恢复记录

生成时间：2026-04-06 14:27 至 14:30（Asia/Shanghai）

## 一、问题概述

用户反馈：Codex 桌面端此前会显示“账号登录”入口，当前界面只剩 API / 中转方式，但客户端仍可使用。用户担心后续再出现问题时无法确认本次改动内容。

结论：本次问题不是界面偶发异常，而是本地配置被切换到了 API Key / 中转 provider 模式，导致桌面端隐藏了账号登录入口。

## 二、排查结论

- `C:\Users\psk13\.codex\config.toml` 中原先存在自定义 `base_url`、`code-switch` provider，以及 `preferred_auth_method = apikey`。
- 原始配置里 provider 标记 `requires_openai_auth = false`，桌面端据此判断当前不需要 OpenAI 账号 OAuth。
- `C:\Users\psk13\.codex\auth.json` 当时仅保留 API Key 形式的登录态，值为 `code-switch` 占位。
- 历史备份 `C:\Users\psk13\.codex\auth.json.bak` 中保留了此前账号登录留下的 token 信息，证明该客户端之前确实走过官方账号登录流程。
- 历史备份 `C:\Users\psk13\.codex\config.toml.antigravity.bak` 显示过 `requires_openai_auth = true` 的 provider 形态，可作为恢复方向。

## 三、实施的改动

1. 读取并比对当前配置、历史备份和登录态文件，确认问题由认证模式切换引起。
2. 在用户目录先生成一份恢复用的临时 config 文件，避免直接修改受保护文件时出错。
3. 因 `.codex` 目录下目标文件存在 ACL 写入限制，申请提权后执行覆盖。
4. 将 `config.toml` 从 API Key / 中转模式改回需要账号鉴权的 provider 形态。
5. 将 `auth.json` 从 API Key 占位状态恢复为旧的账号登录备份。
6. 对现有文件额外生成一组带时间戳的回滚备份。

## 四、关键配置变化

| 项目 | 修改前 | 修改后 |
| --- | --- | --- |
| `config.toml / model_provider` | `code-switch` | `custom` |
| `config.toml / preferred_auth_method` | `apikey` | 已移除，不再强制 API Key |
| `provider / requires_openai_auth` | `false` | `true` |
| `provider / base_url` | `http://127.0.0.1:18100`（`code-switch` 段） | `http://127.0.0.1:18100`（`custom` 段） |
| 顶层 `base_url` | `https://api.ikuncode.cc/v1` | 已移除 |
| `auth.json` 状态 | 仅 API Key 占位 | 恢复为旧账号登录备份 |

## 五、涉及文件

- 实际生效配置：`C:\Users\psk13\.codex\config.toml`
- 实际生效登录态：`C:\Users\psk13\.codex\auth.json`
- 本次新增备份：`C:\Users\psk13\.codex\config.toml.pre-account-login-20260406-142732.bak`
- 本次新增备份：`C:\Users\psk13\.codex\auth.json.pre-account-login-20260406-142732.bak`
- 历史账号备份来源：`C:\Users\psk13\.codex\auth.json.bak`
- 历史配置参考：`C:\Users\psk13\.codex\config.toml.antigravity.bak`

## 六、当前状态判断

- 当前配置已经回到“需要 OpenAI 账号鉴权”的形态。
- 桌面端需要完全退出并重新启动，才会重新读取这组配置。
- 由于恢复进去的是旧 token，重启后可能直接恢复账号态，也可能提示重新登录；两种都属于预期。
- 本记录未写入 `access token`、`refresh token`、`API Key` 明文，避免后续文档外泄。

## 七、如果后续再出问题，优先检查

- 设置页是否再次只显示 API Key，而不显示账号登录。
- `C:\Users\psk13\.codex\config.toml` 中 provider 是否又被改成 `requires_openai_auth = false`。
- `config.toml` 顶层是否又出现 `preferred_auth_method = apikey` 或自定义顶层 `base_url`。
- `auth.json` 是否又被改回只有 `OPENAI_API_KEY` 的简化结构。
- 是否有第三方工具、启动脚本或代理程序在启动时自动覆写 `.codex` 目录配置。

## 八、回滚办法

1. 如果恢复后出现异常，可先关闭 Codex 桌面端。
2. 再把 `config.toml.pre-account-login-20260406-142732.bak` 覆盖回 `C:\Users\psk13\.codex\config.toml`。
3. 把 `auth.json.pre-account-login-20260406-142732.bak` 覆盖回 `C:\Users\psk13\.codex\auth.json`。
4. 然后重新打开 Codex 桌面端，界面会回到本次改动前的 API Key / 中转模式。

## 九、备注

本次操作中，普通沙箱对 `.codex` 目录内受保护文件没有写权限，因此最终通过提权方式完成覆盖。该点说明：后续若要再次调整同目录下的认证文件，可能仍需要管理员级写入。
