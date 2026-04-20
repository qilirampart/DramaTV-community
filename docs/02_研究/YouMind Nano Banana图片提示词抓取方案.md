# YouMind Nano Banana 图片提示词抓取方案

更新时间：2026-04-09

## 1. 页面性质与目标

目标页面：

- `https://youmind.com/zh-CN/nano-banana-pro-prompts?utm_source=nav`

页面定位：

- 这是 `Nano Banana Pro` 的图片提示词库，不是视频提示词库。
- 页面主体是图片 prompt 瀑布流卡片。
- 页面支持分类筛选、排序、筛选和“加载更多”。
- 页面顶部显示总量为 `12419`，说明后续抓取必须按分页批处理，不能靠手工。

本轮调研结论：

- 可以复用之前 Seedance 的“分页 API 抓取 + 去重 + 建库”主思路。
- 不能直接复用视频下载和视频建库脚本，必须单独做图片版管线。

## 2. 页面结构调研

当前页面可见结构包括：

- 顶部生成输入框与 `生成` 按钮
- 提示词总数统计
- 分类筛选按钮
- `排序`
- `筛选`
- 瀑布流卡片区域
- `加载更多...`
- FAQ 与 CTA 区域

瀑布流里实际混排了三类内容：

1. 真实 prompt 卡
- 有标题
- 有作者
- 有来源链接，通常是 `X / Twitter`
- 有摘要说明
- 有提示词正文
- 有 1 张或多张图片
- 有 `立刻尝试`
- 部分有 `查看其它模型的结果`
- 部分有 `翻译前`

2. 博客引流卡
- 例如：`Nano Banana Pro 动手体验：10 个令人惊叹的真实案例`
- 更像站内文章入口，不是素材条目

3. AI 技能卡
- 例如：`克劳德代码风格信息图`
- 例如：`匠工工艺叙事图`
- 更像技能/模板入口，不应进入素材库

结论：

- 页面 DOM 有混排，不能靠前端卡片直接整页抓取入库。
- 正式采集必须以 API 为主，DOM 只作为结构验证与补充。

## 3. 已确认核心 API

通过浏览器网络请求确认分页主接口为：

- `POST https://youmind.com/youhome-api/prompts`

已确认请求体：

```json
{
  "model": "nano-banana-pro",
  "page": 2,
  "limit": 18,
  "locale": "zh-CN",
  "campaign": "nano-banana-pro-prompts",
  "filterMode": "imageCategories"
}
```

返回顶层字段：

```json
[
  "prompts",
  "total",
  "page",
  "limit",
  "totalPages",
  "hasMore"
]
```

已确认分页规模：

- `total = 12419`
- `totalPages = 4140`
- `limit = 18`
- `hasMore = true`

结论：

- 这和 Seedance 的分页抓取模式高度相似。
- 后续完全可以走脚本化分页抓取，不需要靠手动翻页采集。

## 4. API 字段调研结果

单条 prompt 已确认字段：

```json
[
  "id",
  "title",
  "description",
  "sourceLink",
  "sourcePublishedAt",
  "author",
  "content",
  "media",
  "mediaThumbnails",
  "language",
  "translatedContent",
  "sourcePlatform",
  "featured",
  "sort",
  "searchIndex",
  "likes",
  "resultsCount",
  "needReferenceImages",
  "promptCategories"
]
```

关键字段意义：

- `id`：唯一主键，可作为去重基础
- `title`：标题
- `description`：摘要说明
- `sourceLink`：原始来源链接
- `sourcePublishedAt`：来源发布时间
- `author.name / author.link`：作者信息
- `content`：原始提示词
- `translatedContent`：翻译后的提示词
- `media[]`：原图地址数组
- `mediaThumbnails[]`：缩略图地址数组
- `language`：原始语言
- `featured`：精选标记
- `resultsCount`：结果数量
- `needReferenceImages`：是否依赖参考图
- `promptCategories`：分类信息，目前抽样里为空数组

抽样确认：

- `media` 是图片数组，不是对象数组
- `mediaThumbnails` 也是数组
- 抽样页内 `sourceLink / media / content / translatedContent` 均存在
- API 返回的前 18 条中没有博客卡或技能卡

结论：

- 混排内容大概率是前端额外插入，不是 API 主数据。
- 正式抓取时优先信任 API 数据，过滤压力比 DOM 路线小很多。

## 5. 与 Seedance 经验的复用边界

可以复用：

- 分页抓取思路
- 分批处理节奏
- 合并与去重思路
- `filter-youmind-items.js`
- `merge-youmind-items.js`
- 正式库 + skip report 的组织方式

不能直接复用：

- `fetch-youmind-seedance-api.js`
  - 写死了 `video-prompts`
  - 字段解析假定有 `videos[0]`
- `download-youmind-videos.js`
  - 下载的是 `mp4`
- `build-youmind-library.js`
  - 输出结构是 `video.mp4 + prompt txt`

建议策略：

- 不要硬改现有 Seedance 管线。
- 单独新建 Nano Banana 版本脚本，保持视频库和图片库解耦。

## 6. 建议目录与存储规范

建议新建两套目录：

- `youmind-nano-banana-extracted/`
- `youmind-nano-banana-library/`

### 6.1 抓取中间层

`youmind-nano-banana-extracted/` 下建议包含：

- `api-pages/`
- `images/`
- `nano-banana-items.api.p001-p00x.json`
- `nano-banana-items.api.p001-p00x.unique.json`
- `nano-banana-items.exclude.p001-p00x.json`

### 6.2 正式素材库

每条素材一个目录，建议结构：

```text
youmind-nano-banana-library/
  000001-151/
    meta.json
    prompt.raw.txt
    prompt.zh.txt
    summary.txt
    source.txt
    images/
      01.jpg
      02.jpg
      03.jpg
    thumbs/
      01.jpg
      02.jpg
```

说明：

- `prompt.raw.txt`：原始语言提示词，直接对应 `content`
- `prompt.zh.txt`：中文提示词，优先对应 `translatedContent`
- `summary.txt`：对应 `description`
- `source.txt`：来源链接
- `images/`：原图
- `thumbs/`：缩略图，可选

`meta.json` 建议字段：

- `rank`
- `id`
- `title`
- `description`
- `language`
- `featured`
- `sourceLink`
- `sourcePublishedAt`
- `sourcePlatform`
- `authorName`
- `authorLink`
- `resultsCount`
- `needReferenceImages`
- `promptCategories`
- `mediaCount`
- `thumbnailCount`
- `grade`
- `files`

## 7. 入库标准与分级

正式入库标准建议：

- 至少有 1 个 `media`
- 至少有 1 份可用 prompt
- 图片与 prompt 必须属于同一条 API item

分级建议：

- `A`：有图片，且有原始 prompt，同时有中文翻译更好
- `B`：有图片，有 prompt，但只剩翻译版或信息不够完整
- `SKIP`：缺图片或缺 prompt，不入正式库

强调：

- 只拿到 prompt、没有图片，不入库
- 只拿到图片、没有 prompt，不入库
- 这是和前面视频库策略一致的“配套优先”

## 8. 建议脚本拆分

建议新增脚本：

1. `fetch-youmind-nano-banana-api.js`
- 分页请求 `/youhome-api/prompts`
- 输出原始分页 JSON
- 同时输出归一化 JSON

2. `download-youmind-images.js`
- 读取归一化结果
- 下载 `media[]`
- 必要时下载 `mediaThumbnails[]`

3. `build-youmind-image-library.js`
- 将图片与 prompt 组装成正式素材库
- 产出 `library-manifest.json`
- 产出 `library-skip-report.json`

可复用脚本：

- `filter-youmind-items.js`
- `merge-youmind-items.js`

## 9. 推荐执行顺序

第一阶段：打样验证

1. 先抓 `page 1-3`
2. 落盘原始 API JSON
3. 确认字段映射
4. 下载这几页的图片
5. 按正式目录生成 20-50 条样本库

第二阶段：批量抓取

1. 按 `18` 条每页分页抓取
2. 先做高成功率页面批量提取
3. 每批做去重
4. 每批生成清单和 skip report

第三阶段：清洗与补救

1. 检查下载失败图片
2. 检查 403/超时/空内容
3. 单独处理少量疑难项

## 10. 当前方法论判断

这次 Nano Banana 的抓取，之前积累的经验可以直接复用到以下层面：

- 通过真实分页 API 而不是手工点页面
- 先拿结构化 JSON，再做资源下载
- 保证“资源和提示词配套存储”
- 用唯一主键和来源链接做排重
- 用 `manifest + skip report` 持续推进

但需要单独适配的差异也很明确：

- 资源类型从视频换成图片
- 数据字段从 `videos` 换成 `media`
- 页面有更多混排内容
- 总量更大，抓取周期会更长

## 11. 当前最优方案结论

最优路线不是“爬网页 HTML”，而是：

1. 以 `/youhome-api/prompts` 为主源
2. 用脚本批量抓分页 JSON
3. 基于 `media + content + translatedContent` 建立配套素材库
4. 仅把 DOM 用作结构验证和异常排查

这条路线比手动浏览器提取更稳、更快，也更适合后续大规模沉淀到我们自己的社区素材库里。
