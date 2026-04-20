# DramaTV Design System

## 1. Visual Theme & Atmosphere

DramaTV 的视觉气质不是普通短视频平台，也不是 AI 工具官网。

它应该像一个“深夜放映厅 + 创作者工作台”的结合体：

- 第一眼是电影感、作品感、精选感
- 第二层是方法感、工作流感、创作过程感
- 第三层才是发布、互动、管理等产品能力

整体方向参考：

- `RunwayML` 的媒体优先和沉浸感
- `Linear` 的秩序、状态层级和工具精度
- `Pinterest` 的浏览节奏与内容陈列感

但最终落地必须保持 DramaTV 自己的辨识度：

- 深色为主，但不是纯黑科技感
- 有编辑感与电影感，不走冷冰冰后台风
- 工作流必须是一级内容，不是视频附件
- 页面应该鼓励“看作品 -> 看方法 -> 看作者 -> 继续创作”

**关键词：**

- 电影化
- 编辑感
- 创作者社区
- 方法可见
- 深色沉浸
- 非官网
- 非播放器
- 非纯后台

## 2. Color Palette & Roles

### Background

- **Projection Black** `#06070b`
  页面主背景。接近放映厅的黑，不是纯技术黑。
- **Ink Stage** `#0d1117`
  大区块背景、首页主舞台、详情页主体区域。
- **Slate Panel** `#131923`
  卡片、面板、信息容器的标准底色。
- **Raised Deck** `#1a2330`
  浮层、重点信息块、交互激活态容器。

### Text

- **Screen White** `#f4f7fb`
  主标题和主信息。
- **Soft Silver** `#c4ced9`
  正文、次级信息。
- **Fog Blue** `#93a0b3`
  辅助说明、元数据。
- **Dim Steel** `#697487`
  最弱信息、占位态、禁用态。

### Accent

- **Signal Cyan** `#86e7f8`
  链接、结构高亮、焦点边框、工作流相关强调。
- **Tungsten Gold** `#f2bb67`
  主 CTA、创作入口、关键行动按钮。
- **Studio Coral** `#ff7a6b`
  警示、风险提示、异常状态。
- **Success Mint** `#6fd8a8`
  成功、已完成、健康状态。

### Surface & Border

- **Line Soft** `rgba(255, 255, 255, 0.08)`
  标准边框。
- **Line Strong** `rgba(255, 255, 255, 0.14)`
  激活、悬停、重点容器边框。
- **Glow Cyan** `rgba(134, 231, 248, 0.18)`
  结构高亮光晕。
- **Glow Gold** `rgba(242, 187, 103, 0.18)`
  CTA 或精选模块氛围光。

### Background Effects

- 主背景允许使用大面积径向光斑、暗部渐层和轻颗粒纹理。
- 不允许使用俗套的紫色科技渐变。
- 不依赖大面积纯色块堆叠，要有空气感和空间层次。

## 3. Typography Rules

### Font Family

- **Display / Heading**
  `Noto Serif SC`, `Source Han Serif SC`, `Songti SC`, serif
- **UI / Body**
  `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, sans-serif
- **Monospace**
  `IBM Plex Mono`, `Cascadia Code`, `Consolas`, monospace

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Hero Display | Noto Serif SC | 56px | 700 | 1.02 | -0.04em | 首页主标题、详情页主标题 |
| Section Hero | Noto Serif SC | 40px | 700 | 1.08 | -0.03em | 一级区块标题 |
| Panel Title | Noto Serif SC | 28px | 700 | 1.14 | -0.02em | 卡片大标题、详情模块标题 |
| Card Title | Noto Sans SC | 20px | 700 | 1.3 | normal | 视频卡、工作流卡 |
| Body Large | Noto Sans SC | 17px | 500 | 1.75 | normal | 介绍文案 |
| Body | Noto Sans SC | 15px | 400 | 1.75 | normal | 标准正文 |
| Caption | Noto Sans SC | 13px | 500 | 1.6 | 0.01em | 元数据、标签说明 |
| Eyebrow | Noto Sans SC | 12px | 700 | 1.4 | 0.12em | 顶部分类标签、模块眉题 |
| Mono Meta | IBM Plex Mono | 12px | 400 | 1.5 | normal | 技术状态、工作流结构信息 |

### Principles

- 标题要有“片名”气质，正文要有“社区阅读”气质。
- 大标题优先使用衬线字体，建立编辑感和精选感。
- UI 和正文统一使用无衬线字体，保证信息效率。
- 中文标题不要过度拉字距，但允许轻微压缩，避免散。
- 英文标签、代码态信息、技术说明可使用等宽字体。

## 4. Component Stylings

### Top Navigation

- 顶栏是“悬浮式片场导航”，不是官网导航条。
- 高度克制，背景半透明，边框极轻，带轻微模糊。
- Logo 区应体现社区身份，不要像 SaaS 品牌条。
- 导航文字简洁，默认弱化，悬停后提亮。

### Hero

- 首页首屏必须是“精选片场”，以视觉内容和明确主题驱动。
- 采用左右分栏或不对称布局：
  左侧为主标题、引导语和主 CTA。
  右侧或背景为精选视频/封面视觉。
- 不要做成传统产品官网里那种大标题 + 三个卖点卡片。

### Video Card

- 大封面、大视觉优先。
- 标题和作者信息必须直接可见。
- 与工作流有关时，要明确显示“来源工作流”信号。
- 可在封面底部叠加轻微暗角与信息带，但不要覆盖过重。
- 卡片悬停时应体现“可进入详情”的张力，而不是按钮堆叠。

### Workflow Card

- 比视频卡更强调结构感与方法感。
- 允许增加状态条、复制许可、适用场景、作者等更密集信息。
- 工作流卡的视觉重点不是封面本身，而是“这是一个可继续创作的方法对象”。

### Creator Header

- 更像导演 / 创作者的片场名片，而不是通用用户资料头。
- 头像、名称、创作方向、代表标签、关注动作形成一个完整模块。
- 需要保留作品与工作流的双入口延展性。

### Buttons

**Primary CTA**

- 背景：`Tungsten Gold`
- 文本：`Projection Black`
- 圆角：14px
- 用于：发布、进入创作、复制工作流、在画布中打开

**Secondary CTA**

- 背景：半透明深色
- 边框：`Line Strong`
- 文本：`Screen White`
- 圆角：14px
- 用于：详情页次要操作、筛选、回退

**Utility / Technical Button**

- 背景：`rgba(255,255,255,0.04)`
- 边框：`rgba(134, 231, 248, 0.18)`
- 文本：`Soft Silver`
- 圆角：12px
- 用于：开发态工具、次级结构操作

不建议：

- 大面积使用超长 pill 按钮
- 使用纯蓝或纯紫做主按钮
- 用过重阴影营造廉价悬浮感

### Tags & Meta Pills

- 标签允许轻量胶囊形态，但尺寸要小。
- 工作流相关标签优先偏 `Signal Cyan` 体系。
- 精选 / 主 CTA / 推荐标签优先偏 `Tungsten Gold` 体系。
- 评论、统计、作者类标签以低对比中性态为主。

### Comment Thread

- 评论区要像“社区讨论层”，不要像博客页末尾留言板。
- 根评论容器应有稳定结构，回复层轻微缩进即可。
- 互动按钮不要抢主视觉，但要清晰。
- 评论输入区应比单纯 textarea 更有“参与讨论”的产品感。

### Publish Sections

- 发布页不是简单表单。
- 每个模块都应该像创作者工作台中的一个“段落卡片”。
- 媒体上传、标题简介、标签、工作流绑定、可见性说明应分层展示。
- 允许使用更清晰的边框、分组和状态提示，但不要做成后台管理表单。

## 5. Layout Principles

### Core Structure

- 首页、详情页、作者页、发布页都应使用统一外层容器系统。
- 最大内容宽度建议控制在 `1280px - 1440px`。
- 首页可以比详情页更开放，详情页可以更聚焦。

### Spacing Scale

- 基础单位：`8px`
- 主要尺度：`8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72`
- 大区块上下间距优先使用 `40px+`
- 卡片内部信息间距优先使用 `12 - 20px`

### Composition

- 允许不对称布局，不要求全站规整 3 列卡片墙。
- 首页可以在“精选内容 / 推荐流 / 热门工作流 / 创作者入口”之间切换不同节奏。
- 视频详情页应媒体优先。
- 工作流详情页应操作优先。
- 作者主页应列表与人物叙事并重。
- 发布页应分段式而不是一整块长表单。

### Shapes

- 卡片圆角：`20px - 28px`
- 面板圆角：`18px - 24px`
- 小按钮圆角：`12px - 14px`
- 极少使用完全直角，也避免一切都做成药丸。

## 6. Depth & Elevation

| Level | Treatment | Use |
|------|-----------|-----|
| Level 0 | 主背景渐层 + 轻颗粒 | 页面根背景 |
| Level 1 | 深色平面 + 细边框 | 普通卡片、区块面板 |
| Level 2 | 稍亮容器 + 局部光晕 | Hero 内容、重点详情模块 |
| Level 3 | 柔和投影 + 强边框 + 微光 | 浮层、重要 CTA、精选模块 |

### Principles

- 阴影可以有，但必须克制，偏柔软、偏大范围，不要传统网页卡片阴影。
- 深度主要通过：
  背景层次、
  边框亮度、
  局部光晕、
  媒体本身的暗部与亮部对比
  来体现。
- 不要使用廉价玻璃拟态。

## 7. Do's and Don'ts

### Do

- 让作品封面、视频预览、工作流对象成为页面的主视觉
- 把“作品、工作流、创作者”都做成可进入的独立对象
- 用深色空间和局部高光建立电影感与创作感
- 用衬线标题建立精选感和编辑感
- 让首页看起来像社区，不像官网
- 让工作流页看起来像方法对象，不像附件下载页
- 让发布页看起来像创作者工作台，不像后台表单页

### Don't

- 不要做成普通短视频播放器界面
- 不要做成 SaaS 首页模板
- 不要把页面全部做成统一后台管理面板
- 不要使用紫色主导、赛博霓虹、廉价科技光效
- 不要把所有按钮都做成 pill
- 不要用大量小卡片堆满首屏
- 不要让工作流退化成视频下方的小补充块

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | `< 640px` | 首屏改为单列，按钮纵向堆叠，操作区下沉 |
| Tablet | `640px - 1023px` | 首页 2 列内容开始形成，详情页上下布局 |
| Desktop | `1024px - 1439px` | 标准桌面布局 |
| Wide | `>= 1440px` | Hero 与精选区可更开放 |

### Rules

- 首页首屏在移动端仍需保留“精选片场”气质，不能直接塌成普通 banner。
- 视频详情页在移动端优先顺序应是：
  视频、
  标题简介、
  作者与工作流动作、
  评论。
- 工作流详情页在移动端优先顺序应是：
  标题说明、
  主操作、
  关联作品、
  评论或扩展信息。
- 发布页在移动端必须分段，不允许横向拥挤的双列表单。

## 9. Agent Prompt Guide

当 AI 代理为 DramaTV 生成页面时，应默认遵循以下规则：

- 这是一个 AI 视频生成社区，不是官网，不是播放器，也不是后台系统。
- 首页优先表达“精选作品 + 工作流一级内容 + 创作者社区”。
- 视频详情页优先表达“作品主视觉 + 来源工作流 + 创作者 + 评论参与”。
- 工作流详情页优先表达“方法对象 + 可复制 + 可进入画布 + 关联作品”。
- 创作者主页必须同时展示作品与工作流。
- 发布页要像创作者工作台，而不是一个普通上传表单。

### Prompt Keywords

- cinematic creator community
- editorial dark interface
- workflow as first-class content
- creator-first storytelling
- asymmetric media-led layout
- refined dark surfaces with cyan and tungsten accents

### Anti-Pattern Keywords

- generic SaaS landing page
- purple gradient on white
- crypto dashboard
- short-video app clone
- full admin backoffice aesthetic

### Page-by-Page Guidance

**Community Home**

- 首屏必须像精选片场
- 下面依次承接推荐流、热门工作流、创作者入口
- 不要先放一堆产品介绍卡

**Video Detail**

- 视频主视觉占据最大注意力
- 关联工作流是强入口
- 评论区是真实社区参与区

**Workflow Detail**

- 复制工作流和在画布中打开是主动作
- 结构信息要更密，但不能像配置面板

**Creator Profile**

- 作者是“创作人格”，不是普通用户账号
- 代表作品与代表工作流都需要强展示

**Publish**

- 分段式工作台
- 清晰的创作流程感
- 强调绑定工作流和内容说明
