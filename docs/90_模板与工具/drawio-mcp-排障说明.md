# Draw.io MCP 排障说明

## 这次失败的根因

原始配置使用的是：

```toml
[mcp_servers.drawio]
args = ['-y', 'drawio-mcp-server', '--editor']
command = 'C:\\Program Files\\nodejs\\npx.cmd'
type = 'stdio'
```

这个组合在当前环境下有两个问题：

1. `--editor` 启动时会先输出初始化文本，如果直接走 `stdio`，会污染 MCP 握手。
2. 第一次启动 editor 需要下载 draw.io 资源；如果网络不可达或代理未生效，进程会直接退出。

## 现在的修复方案

Codex 已改成走项目内 wrapper：

```toml
[mcp_servers.drawio]
args = ['E:\\点众\\DramaTV社区搭建\\scripts\\drawio-mcp-stdio-wrapper.mjs', '--editor']
command = 'C:\\Program Files\\nodejs\\node.exe'
type = 'stdio'
```

这个 wrapper 会：

1. 把 editor 初始化日志改走 `stderr`
2. 默认使用项目内的 `.drawio-assets`
3. 同时保留 `stdio` MCP 和本地 editor 页面

## 相关脚本

- 预下载资源：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prefetch-drawio-assets.ps1
```

- 带代理预下载资源：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prefetch-drawio-assets.ps1 -ProxyUrl http://127.0.0.1:7897
```

## 如果后面又失败，先看这几个点

1. `E:\点众\DramaTV社区搭建\.drawio-assets\webapp` 是否存在
2. `C:\Users\psk13\.codex\config.toml` 的 `drawio` 段是否还是 wrapper 版本
3. 当前终端里直接执行：

```powershell
"C:\Program Files\nodejs\node.exe" ".\scripts\drawio-mcp-stdio-wrapper.mjs" --editor
```

如果这条命令能稳定挂住，说明 drawio 服务本体没问题，剩下只看 Codex 会话是否重启生效。
