# Draw.io MCP 排障说明

更新时间：2026-04-20

## 当前推荐配置

Codex 的 Draw.io MCP 推荐走项目内 wrapper，而不是直接用 `npx drawio-mcp-server --editor`。

```toml
[mcp_servers.drawio]
args = ['E:\\点众\\DramaTV社区搭建\\scripts\\drawio-mcp-stdio-wrapper.mjs', '--editor']
command = 'C:\\Program Files\\nodejs\\node.exe'
type = 'stdio'
```

这个 wrapper 会做三件事：

- 把 editor 初始化日志写到 `stderr`，避免污染 MCP stdio 握手。
- 默认使用项目内 `.drawio-assets`，降低首次启动对网络的依赖。
- 自动从 npx cache 中解析可用的 `drawio-mcp-server`，避免脚本硬编码某个缓存目录。

## 手动启动

项目内脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-drawio-mcp.ps1
```

手动直连 wrapper：

```powershell
"C:\Program Files\nodejs\node.exe" ".\scripts\drawio-mcp-stdio-wrapper.mjs" --editor
```

预下载 draw.io assets：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prefetch-drawio-assets.ps1
```

如需代理：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prefetch-drawio-assets.ps1 -ProxyUrl http://127.0.0.1:7897
```

## 常见问题

### 1. 第一次启动卡住

常见原因：

- draw.io webapp assets 没有预下载。
- 当前网络或代理不可用。
- MCP stdio 被 editor 初始化日志污染。

处理方式：

- 先执行 `scripts/prefetch-drawio-assets.ps1`。
- 确认 `E:\点众\DramaTV社区搭建\.drawio-assets\webapp` 存在。
- 确认 Codex 配置仍然走 `drawio-mcp-stdio-wrapper.mjs`。

### 2. `list_layers` 或其他模型操作超时

已确认的高风险触发方式：

- 不要把多个 Draw.io MCP 调用放进并发工具里同时执行。
- Draw.io MCP 背后依赖同一个浏览器/图模型会话，并发读写可能导致某个调用等待锁超时。

处理方式：

- Draw.io MCP 调用一律串行。
- 超时后先单独调用 `get_active_layer` 或 `list_paged_model` 验证会话是否仍可用。
- 如果基础调用可用，不需要重启服务。
- 如果基础调用也失败，再停止并重新启动 Draw.io MCP。

### 3. 端口被占用

默认 HTTP 端口是 `3000`。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop-drawio-mcp.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-drawio-mcp.ps1
```

如果端口上有别的服务，先确认占用进程不是当前项目需要的服务，再决定是否停止。

## 本项目使用规则

- 产图优先写入 `docs/03_架构/*.drawio`。
- Draw.io MCP 只串行调用，不并发。
- 大图优先用文件 XML 生成或替换，MCP 主要用于确认、导入、导出。
- 图文件涉及中文时，统一按 UTF-8 处理，避免 PowerShell 默认编码导致乱码。
