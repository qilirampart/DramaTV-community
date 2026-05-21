# YouMind GPT-Image-2 漫画故事版增量抓取记录

更新时间：2026-05-05

## 1. 本轮目标

目标页面：

- `https://youmind.com/zh-CN/gpt-image-2-prompts?utm_source=footer&categories=comic-storyboard`

本轮目标是继续抓取 `gpt-image-2` 下的 `comic-storyboard` 分类提示词，并尽量避免和 `2026-04-24` 那批 `252` 条已有资产重复。

## 2. 处理方式

本轮采用了“先全量抓取当前线上数据，再和旧库按 `id` 去重，只保留新增项”的方式。

原因：

- 当前线上总量已经变化，直接补页可能漏掉新条目
- 旧库已有 `252` 条，直接重复下载会浪费时间和存储
- 按 `id` 去重最稳

## 3. 抓取结果

当前线上页面已确认：

- `total = 646`
- `totalPages = 36`

旧资产库：

- `2026-04-24` 的 `gpt-image-2 / comic-storyboard` 库
- 条目数：`252`

本轮差集结果：

- 新增条目数：`399`
- 重复条目数：`247`

## 4. 资源形式

本轮新增资源同样按三层落盘：

### 4.1 原始抽取层

- 全量刷新页数据：
  [gpt-image-2-comic-storyboard-refresh-2026-05-05](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-refresh-2026-05-05)
- 全量索引：
  [nano-banana-items.api.p001-p036.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-refresh-2026-05-05\nano-banana-items.api.p001-p036.json)
- 去重后的新增索引：
  [nano-banana-items.api.p001-p036.new-only.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-refresh-2026-05-05\nano-banana-items.api.p001-p036.new-only.json)

### 4.2 原始图片下载层

- 图片目录：
  [images](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-refresh-2026-05-05\images)

### 4.3 标准库层

- 标准库目录：
  [gpt-image-2-comic-storyboard-library-p001-p036-new-only](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p036-new-only)
- 清单：
  [library-manifest.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p036-new-only\library-manifest.json)
- 跳过报告：
  [library-skip-report.json](E:\点众\DramaTV社区搭建\docs\02_研究\youmind-image-assets\gpt-image-2-comic-storyboard-library-p001-p036-new-only\library-skip-report.json)

## 5. 统计结果

本轮去重后的新增数据：

- 新增索引条目数：`399`
- 含图片条目数：`395`
- 成功建库条目数：`395`
- 跳过条目数：`4`

跳过原因：

- `missing image`

## 6. 本轮方法

本轮沿用之前的抓取管线，并做了两件事：

1. 给 `fetch-youmind-nano-banana-api.js` 增加了重试和更长超时，避免网络波动导致整批失败
2. 将全量抓取结果与旧库按 `id` 做差集，只保留新增项

这样可以保证：

- 新增资源尽量不重复
- 已有 `252` 条旧资产不被覆盖
- 后续主项目可以同时保留“旧库”和“增量库”

## 7. 新增资产结构

单条目录仍然保持与之前一致的结构：

```text
000002-18209/
  meta.json
  prompt.raw.txt
  summary.txt
  source.txt
  images/
    01.jpg
```

新库的分类仍然是：

- `model = gpt-image-2`
- `categories = comic-storyboard`
- `campaign = gpt-image-2-prompts`

## 8. 资源位置

当前 `gpt-image-2 / comic-storyboard` 相关资产现在分成两批：

### 8.1 旧库

- `docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-extracted`
- `docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-library-p001-p014`

### 8.2 本轮增量库

- `docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-refresh-2026-05-05`
- `docs/02_研究/youmind-image-assets/gpt-image-2-comic-storyboard-library-p001-p036-new-only`

## 9. 对主项目侧的对接建议

如果主项目侧后续要接这批资源，建议优先按下面方式处理：

1. 先接旧库，保证已有内容稳定
2. 再接本轮增量库，作为补充内容
3. 统一保留 `categories = comic-storyboard`
4. 统一保留来源作者字段
5. 如果要合并，按 `id` 去重，不按标题去重

## 10. 备注

本轮已经把网络波动影响降到最低，并成功拿到了当前页的新增资源。
如果后面还要继续追增量，建议直接复用本轮新增的重试参数和差集方式。

