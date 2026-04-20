# YouMind Seedance界面复刻与30条样本采集方案

## 1. 任务目标

这份文档用于交给另一个聊天，直接执行两件事：

1. 先从 YouMind 的 Seedance 2.0 提示词页面采集 30 条公开样本。
2. 再基于这 30 条样本，复刻一个前端界面相近、但适配 DramaTV 当前阶段的展示页。

当前阶段约束：

- 只做前端视觉和交互，不接后端。
- 不要做假联调，不要伪装成功能已完成。
- 不要把提示词或工作流做成与视频并列的大卡片。
- 内容主体始终是视频卡，提示词作为“查看详情 / 查看创作过程”的附属层出现。
- 浏览器只用于抓取和必要确认，不要频繁截图验收。

目标参考页：

- [YouMind Seedance 2.0 提示词页](https://youmind.com/zh-CN/seedance-2-0-prompts?utm_source=nav)

## 2. 已验证事实

以下信息已经实际验证过，可直接作为执行前提：

- 页面主体是提示词视频卡列表，不是传统文章列表。
- 首屏初始大约加载 12 条 `article` 卡片，继续滚动可以拿更多。
- 每张卡片的视频不是普通 `video src`，而是 `Cloudflare Stream iframe`。
- 卡片上的“查看详情”会弹出一个 `dialog`。
- 完整提示词正文在弹层里的 `pre` 标签内。
- 卡片视频可以通过 `Cloudflare Stream` 的 `video.mpd` 拉流，再用 `ffmpeg` 合成为本地 `mp4`。

本地已验证样例：

- 视频样例：[seedance-2-romance.mp4](/E:/点众/DramaTV社区搭建/tmp/youmind-samples/seedance-2-romance.mp4)
- 提示词样例：[seedance-2-romance-prompt.txt](/E:/点众/DramaTV社区搭建/tmp/youmind-samples/seedance-2-romance-prompt.txt)

## 3. 复刻范围

建议复刻的界面结构：

- 顶部品牌区
- 搜索 / 生成输入条
- 提示词列表区
- 视频卡 hover 操作区
- 提示词详情弹层
- “立即体验”按钮占位

建议保留的卡片信息：

- 视频预览
- 标题
- 一小段摘要
- 查看详情
- 立即体验

建议复刻的交互：

- 卡片 hover 时露出轻量操作按钮
- 点击“查看详情”弹出 prompt 详情层
- 详情层支持复制提示词
- 列表滚动加载更多

当前不要做的内容：

- 登录态
- 订阅态
- 真实生成能力
- 真实分享能力
- 全站复杂筛选
- 后端数据联调

## 4. 对 DramaTV 的适配要求

虽然参考的是 YouMind 页面，但落到 DramaTV 时要遵守当前产品方向：

- 视频是一级内容。
- 提示词 / 创作过程是视频的附属信息，不单独做等权大块。
- 作者信息可以在详情层或卡片头部轻量展示。
- 如果后续替换成“工作流”，也要走“视频卡 -> 查看创作过程”的路径，不要做单独工作流大卡。

一句话要求：

- 复刻的是“信息架构和界面气质”
- 不是把 YouMind 原样搬成另一个产品

## 5. 本地素材目录建议

先把抓取结果放进可管理目录，不要散落到各处。

建议目录：

```text
apps/web/public/external-samples/youmind-seedance/
  manifest.json
  videos/
  prompts/
  thumbs/
```

临时抓取目录可以先用：

```text
tmp/youmind-seedance/
```

确认页面效果满意后，再把最终采用的素材移动到 `apps/web/public/external-samples/youmind-seedance/`。

## 6. 30条样本的数据结构

统一用一套字段，不要同类信息多套命名。

推荐结构：

```ts
type YouMindSeedanceItem = {
  id: string
  title: string
  summary: string
  promptText: string
  authorName?: string
  publishedAt?: string
  sourcePage: string
  embedUrl: string
  manifestUrl: string
  thumbnailUrl?: string
  localVideoPath: string
  localPromptPath: string
  localThumbnailPath?: string
}
```

`id` 推荐直接使用 Cloudflare 的视频 ID。

## 7. 单条样本的采集方法

### 7.1 列表层拿到这些字段

从每个 `article` 卡片里先拿：

- 标题
- 摘要
- `iframe.src`
- `iframe.title`
- 缩略图地址

可用来源：

- `article iframe.src`
- `article iframe.title`
- `article p`
- `article img`

### 7.2 提示词详情层拿到这些字段

对每条卡片执行：

1. 找到 `article button[title="查看详情"]`
2. 点击后等待 `dialog` 出现
3. 从 `dialog pre` 提取完整提示词
4. 从 `dialog` 头部提取作者和日期
5. 写入本地 `.txt`
6. 关闭弹层，进入下一条

完整提示词正文不要只截摘要，必须拿 `pre` 内容。

### 7.3 视频下载方法

先从 `iframe.src` 中解析出视频 ID。

示例：

```text
https://iframe.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8?letterboxColor=transparent&muted=true&preload=metadata&loop=true&autoplay=true&controls=false
```

对应视频 ID：

```text
7f63ad253175a9ad1dac53de490efac8
```

然后找到同一条资源对应的 `customer-xxx.cloudflarestream.com` 域名。

最稳定的取法：

- 从缩略图地址里取域名
- 或从网络请求里的 `manifest/video.mpd` 取域名

缩略图示例：

```text
https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg
```

有了域名和视频 ID 后，拼出 `manifest`：

```text
https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/manifest/video.mpd?parentOrigin=https%3A%2F%2Fyoumind.com
```

下载命令示例：

```powershell
ffmpeg -y -i "https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/<videoId>/manifest/video.mpd?parentOrigin=https%3A%2F%2Fyoumind.com" -c copy "tmp\\youmind-seedance\\videos\\<slug>.mp4"
```

说明：

- 优先直接从 `mpd` 拉流。
- 使用 `-c copy`，不要转码。
- 下载失败时，先检查是否是沙箱网络限制，再检查 `customer` 域名是否匹配当前卡片。

## 8. 批量采集30条的执行顺序

建议严格按下面顺序做，避免一边抓素材一边改页面导致上下文混乱。

### 第一阶段：先采集

1. 打开目标页。
2. 滚动，直到页面里加载出至少 30 个 `article`。
3. 先只采集结构化元数据，生成 `manifest.json` 草稿。
4. 再逐条补抓完整 prompt。
5. 最后逐条下载视频。

### 第二阶段：再清洗

1. 给每条记录生成稳定 `slug`。
2. 把视频、提示词、缩略图文件名全部改成稳定短名。
3. 修正 `manifest.json` 里的本地路径。
4. 抽查 3 到 5 条，确认视频能播、prompt 能显示。

### 第三阶段：最后做界面

1. 先用这 30 条本地静态数据驱动页面。
2. 再做列表布局、卡片 hover、详情弹层。
3. 最后才补“复制提示词”“立即体验占位”“加载更多占位”。

## 9. 建议的本地命名规则

文件名不要直接用整段提示词。

建议：

```text
ym-seedance-001.mp4
ym-seedance-001.txt
ym-seedance-001.jpg
```

同时在 `manifest.json` 里保留真实标题。

不要使用超长中文文件名，否则后续前端引用和脚本处理都容易出问题。

## 10. 前端复刻的最低验收标准

另一个聊天至少要交付这些结果：

- 本地成功保存 30 个视频文件
- 本地成功保存 30 个提示词文件
- 生成一份可直接驱动页面的 `manifest.json`
- 有一个可浏览的前端页面
- 页面里至少能展示前 12 条卡片
- 点击卡片详情能看到完整 prompt
- 本地视频能正常播放
- 未接后端的按钮有明确占位，不伪装成功能已完成

## 11. 界面实现建议

推荐用这套页面骨架：

```text
顶部轻导航
搜索 / 生成条
列表头部（标题 + 数量 + 下载占位）
双列或三列视频卡网格
详情弹层
底部 FAQ 可选
```

视觉建议：

- 参考 YouMind 的“工具页 + 内容墙”结构
- 但整体做得比它更轻、更干净
- 少用大圆角和厚重玻璃感
- 让视频预览成为第一视觉中心
- 弹层里的 prompt 要有明确的阅读区和复制按钮

## 12. 另一个聊天可直接使用的执行提示

下面这段可以直接复制给另一个聊天：

```text
你现在在 E:\\点众\\DramaTV社区搭建 工作区内执行任务。

目标：
1. 参考 https://youmind.com/zh-CN/seedance-2-0-prompts?utm_source=nav
2. 先采集 30 条公开样本，每条都要包含：
   - 标题
   - 摘要
   - 完整提示词
   - 视频本地文件
   - 缩略图
   - 作者和日期（如果页面可见）
   - 原始来源页
3. 采集结果输出到：
   - apps/web/public/external-samples/youmind-seedance/videos
   - apps/web/public/external-samples/youmind-seedance/prompts
   - apps/web/public/external-samples/youmind-seedance/thumbs
   - apps/web/public/external-samples/youmind-seedance/manifest.json
4. 再基于这 30 条静态数据，做一个前端参考页，复刻 YouMind Seedance 页面的信息架构和交互气质。

强约束：
- 只做前端，不接后端。
- 浏览器只用于抓取和必要确认，不要频繁截图。
- 不要做假功能。
- 视频是主体，提示词通过详情层展示，不要单独做等权大卡。
- 如果复制按钮只是前端行为，要明确是本地复制。
- 统一用一套字段名，不要同类信息多套命名。

采集方法：
- 从 article 中拿标题、摘要、iframe.src、iframe.title、缩略图。
- 点击 article button[title="查看详情"]。
- 从 dialog pre 中拿完整 prompt。
- 用 iframe 里的 Cloudflare 视频 ID 和 customer 域名拼 manifest/video.mpd。
- 用 ffmpeg -c copy 下载本地 mp4。

交付结果：
- 30 条本地样本
- 结构化 manifest.json
- 一个可直接运行的前端页面
- 必要时补一份简短说明文档
```

## 13. 风险提醒

需要提前告诉另一个聊天：

- 这批内容来自外部公开页面，适合先用于内部原型和视觉验证。
- 如果后续要正式上线或公开分发，需要单独确认素材使用权限。
- 采集阶段优先保留来源字段，不要把来源丢掉。

## 14. 当前最推荐的落地策略

不要一上来就做整站复刻。

最稳妥的顺序是：

1. 先抓 30 条素材。
2. 先把静态数据跑起来。
3. 先做一个单页参考版。
4. 确认视觉方向满意。
5. 再决定是否把这套界面语言吸收到 DramaTV 正式首页或资源页。
