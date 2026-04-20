const video = (fileName: string) => encodeURI(`/prefill-videos/${fileName}`)

export const heroStories = [
  {
    id: 'story-dance',
    title: '舞台三秒钟，把观众拉进剧情',
    subtitle: '作品、工作流、讨论在同一片场发生',
    description:
      '用首页直接暴露作品成片、灵感设定和画布工作流入口，让“看完就想试”成为社区默认动作。',
    video: video('舞蹈.mp4'),
    badge: 'Hot Screening',
    metrics: ['14s 角色短片', '可关联工作流', '支持继续创作'],
  },
  {
    id: 'story-drive',
    title: '一条飞驰镜头，带出整个创作者宇宙',
    subtitle: '从成片走回方法，从方法走向派生',
    description:
      '每个作品都能回到它的制作路径，每个工作流都能被继续改写，而不是停留在一次性展示。',
    video: video('汽车.mp4'),
    badge: 'Workflow Ready',
    metrics: ['镜头节奏', '动作轨迹', '可在画布中打开'],
  },
  {
    id: 'story-moves',
    title: '动作设计不再埋在幕后，而是社区内容本身',
    subtitle: '把 AI 视频社区做成作品库 + 方法库',
    description:
      '适合高质量武侠、打戏、角色运动类工作流，既能看结果，也能复盘动作设计和镜头结构。',
    video: video('招式.mp4'),
    badge: 'Creator Signal',
    metrics: ['镜头拆解', '动作复用', '派生能力'],
  },
] as const

export const spotlightVideos = [
  {
    id: 'v1',
    slug: 'cold-moon-bamboo-duel',
    workflowId: 'wf-1',
    title: '冷月竹林对峙',
    author: '镜川',
    category: '武侠奇幻',
    note: '电影级冷色雾场，适合高对比刀光氛围。',
    video: video('jimeng-2026-03-17-1504- 整体基调：电影级武侠奇幻风格，高对比度；冷色（破月冷蓝月光_云海冷雾_霜白刀光....mp4'),
    discussion:
      '这条片子适合放在“作品如何反推工作流”的详情页范式里：先看成片情绪，再看雾层、刀光和角色站位如何被拆成节点。',
    workflowTitle: '武侠冷月镜头工作流',
    workflowAction: '在画布中打开',
    stats: ['1.8k 喜欢', '246 讨论', '89 次复用'],
    tags: ['冷月', '竹林', '刀光', '电影感'],
  },
  {
    id: 'v2',
    slug: 'sigil-puppet-field',
    workflowId: 'wf-1',
    title: '傀儡符阵引爆',
    author: '北灯',
    category: '仙侠机制',
    note: '明黄符光和古铜傀儡的高密度场面调度。',
    video: video('jimeng-2026-03-20-2355-3D国漫仙侠玄幻风格，史诗级奇幻大片质感，明黄符光与古铜傀儡电影级色调，超写实3....mp4'),
    discussion: '适合做“复杂场面调度”和“密集主体保持清晰”的讨论样片。',
    workflowTitle: '傀儡符阵场面调度工作流',
    workflowAction: '复制工作流',
    stats: ['1.2k 喜欢', '182 讨论', '61 次复用'],
    tags: ['符阵', '仙侠', '群像', '爆点'],
  },
  {
    id: 'v3',
    slug: 'warehouse-close-combat',
    workflowId: 'wf-1',
    title: '仓库近身格斗',
    author: 'Kiro',
    category: '真人动作',
    note: '适合做动作镜头模版和打戏节奏讨论。',
    video: video('jimeng-2026-03-22-2265-15秒单段真人格斗打戏，都市废弃仓库内景，夜，男主特工对战持刀雇佣兵，写实硬派近....mp4'),
    discussion: '适合讨论镜头切点、动作节奏和写实打击感的统一。',
    workflowTitle: '近身格斗节奏工作流',
    workflowAction: '查看工作流',
    stats: ['980 喜欢', '124 讨论', '37 次复用'],
    tags: ['真人', '格斗', '仓库', '打击感'],
  },
  {
    id: 'v4',
    slug: 'mecha-heavy-entrance',
    workflowId: 'wf-3',
    title: '机甲压迫式登场',
    author: '观测者',
    category: '机甲科幻',
    note: '适合做画布工作流的节奏预设和色板复用。',
    video: video('jimeng-2026-03-24-5734-  导演版提示词   画面基调：机甲科幻电影级画质，8K超高清，16_9横版。暗....mp4'),
    discussion: '典型的“先用色板建压迫感，再让镜头跟着重量走”的案例。',
    workflowTitle: '机甲冲突色板与运动预设',
    workflowAction: '在画布中打开',
    stats: ['2.4k 喜欢', '318 讨论', '102 次复用'],
    tags: ['机甲', '金属', '压迫感', '色板'],
  },
  {
    id: 'v5',
    slug: 'cyber-city-rush',
    workflowId: 'wf-3',
    title: '赛博奇城突进',
    author: 'Rhea',
    category: '赛博城市',
    note: '适合首页推荐流里的高速度视觉内容。',
    video: video('jimeng-2026-03-21-2688-【画质标准】8K超高清，16_9横版，不加字幕，不生成BGM 【画面基调】赛博奇....mp4'),
    discussion: '适合讨论高速镜头里如何保持霓虹层次和主体识别。',
    workflowTitle: '赛博城市高速镜头模板',
    workflowAction: '复制工作流',
    stats: ['1.1k 喜欢', '136 讨论', '49 次复用'],
    tags: ['赛博', '高速', '霓虹', '追逐'],
  },
  {
    id: 'v6',
    slug: 'stage-anchor-trio',
    workflowId: 'wf-2',
    title: '多人舞台锚定',
    author: '三幕工作室',
    category: '角色编排',
    note: '适合展示角色锚定和舞台编组工作流。',
    video: video('jimeng-2026-03-21-5692- 高质量二次元14秒三人舞台短片，全身入镜。角色锚定：严格保持@图片1角色A +....mp4'),
    discussion: '适合拿来讲角色锚定、站位和镜头调度如何形成统一语言。',
    workflowTitle: '角色舞台编排工作流',
    workflowAction: '查看工作流',
    stats: ['1.6k 喜欢', '209 讨论', '88 次复用'],
    tags: ['舞台', '角色锚定', '多人', '编排'],
  },
] as const

export const workflowDeck = [
  {
    id: 'wf-1',
    slug: 'cold-moon-shot-language',
    defaultRuntimeId: 'runtime-wf-1-studio',
    title: '武侠冷月镜头工作流',
    summary: '适合竹林、刀光、冷雾、近景情绪对峙，强调冷蓝月光和角色站位张力。',
    tags: ['镜头调度', '氛围光', '动作起手'],
    status: '可复制',
  },
  {
    id: 'wf-2',
    slug: 'stage-blocking-score',
    defaultRuntimeId: 'runtime-wf-2-studio',
    title: '角色舞台编排工作流',
    summary: '把多人短片中的角色锚定、队形变换和镜头节拍拆成可继续修改的节点块。',
    tags: ['角色锚定', '舞台调度', '镜头节奏'],
    status: '可在画布中打开',
  },
  {
    id: 'wf-3',
    slug: 'mecha-impact-board',
    defaultRuntimeId: 'runtime-wf-3-studio',
    title: '机甲冲突色板与运动预设',
    summary: '适合机甲类大场面，包含高对比金属色板、速度感镜头和压迫式出场结构。',
    tags: ['色板模板', '速度预设', '机甲片场'],
    status: '支持派生',
  },
] as const

export const pulseTopics = [
  {
    title: '讨论最热',
    items: [
      '如何把“出招前蓄力”做得更有重量感',
      '武侠短片里的雾层应该放在前景还是中景',
      '同一工作流如何适配真人打戏和国漫角色',
    ],
  },
  {
    title: '创作者动作',
    items: [
      '今天有 18 个作品绑定了工作流发布',
      '7 位作者把镜头预设开成了可派生',
      '精选区新增 4 个“角色舞台”主题片段',
    ],
  },
] as const

export const creatorLineup = [
  {
    name: '镜川',
    role: '氛围武侠作者',
    blurb: '擅长冷色竹林与刀光细节，作品和工作流都偏电影镜头语言。',
  },
  {
    name: '观测者',
    role: '机甲片场设计师',
    blurb: '擅长做压迫式登场镜头、厚重金属色板和高速动线结构。',
  },
  {
    name: '三幕工作室',
    role: '角色编排团队',
    blurb: '专注多人角色站位、舞台构图和角色锚定工作流。',
  },
] as const

export const videoComments = [
  {
    id: 'c1',
    author: '砚山',
    role: '动作工作流作者',
    content: '这条片子的亮点不是单个镜头，而是每次出刀前的蓄力时间都被拉得很克制，所以重量感非常稳定。',
  },
  {
    id: 'c2',
    author: 'Len',
    role: '社区剪辑师',
    content: '我更想看这个成片对应的节点顺序，尤其是雾层和刀光是在前景还是中景叠出来的。',
  },
  {
    id: 'c3',
    author: '观测者',
    role: '机甲片场设计师',
    content: '这种片子最适合作为“成片反查工作流”的示范页，先看情绪，再看方法，学习成本最低。',
  },
] as const

export function getSpotlightVideoBySlug(slug: string) {
  return spotlightVideos.find((entry) => entry.slug === slug)
}
