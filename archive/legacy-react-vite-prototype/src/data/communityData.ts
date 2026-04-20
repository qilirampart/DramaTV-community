import { spotlightVideos } from './homepageData'
import { workflowCatalog } from './workflowCanvasData'

export type CreatorProfile = {
  slug: string
  name: string
  role: string
  location: string
  headline: string
  bio: string
  featuredQuote: string
  focus: string[]
  workflowIds: string[]
  videoSlugs: string[]
  statusSignals: Array<{
    label: string
    state: string
  }>
  currentProjectTitle: string
  currentProjectSummary: string
  forumNotes: string[]
  stats: string[]
}

export const creatorProfiles: CreatorProfile[] = [
  {
    slug: 'jing-chuan',
    name: '镜川',
    role: '氛围武侠作者',
    location: '杭州',
    headline: 'Cold Atmosphere Action',
    bio: '长期做冷色武侠、雾层调度和出招前蓄力镜头，擅长把成片情绪和工作流方法绑在同一条阅读路径里。',
    featuredQuote: '先把气候立住，再让动作长出来，观众就会自然相信这条片子的世界。',
    focus: ['冷雾竹林', '刀光高对比', '情绪近景', '镜头起手节奏'],
    workflowIds: ['wf-1'],
    videoSlugs: ['cold-moon-bamboo-duel'],
    statusSignals: [
      { label: '关注', state: '前端占位' },
      { label: '收藏', state: '前端占位' },
      { label: '作品与工作流联动', state: '原型已演示' },
    ],
    currentProjectTitle: '冷月长镜系列',
    currentProjectSummary: '围绕冷月、竹林、刀光做一组可连续发布的 PGC 短片，并把同一套工作流拆成多条可复用镜头模板。',
    forumNotes: [
      '最近在讨论“出刀前停顿”怎样做得更克制但更有压迫感。',
      '计划把近景情绪镜头和中景动作镜头拆成两套可组合节点。',
      '希望后续可以在作者页里直接挂出系列创作笔记。',
    ],
    stats: ['12 条精选作品', '1 条公开工作流', '近 7 天 326 次讨论提及'],
  },
  {
    slug: 'bei-deng',
    name: '北灯',
    role: '仙侠场面调度作者',
    location: '成都',
    headline: 'Dense Fantasy Staging',
    bio: '擅长处理高密度主体和复杂符阵场面，重点是让符光、傀儡和主角关系在大场景里依然保持清晰。',
    featuredQuote: '复杂不是堆东西，而是让每一层都还有自己的职责。',
    focus: ['符阵爆点', '群像清晰度', '金属材质控制', '主次层级'],
    workflowIds: ['wf-1'],
    videoSlugs: ['sigil-puppet-field'],
    statusSignals: [
      { label: '关注', state: '前端占位' },
      { label: '评论', state: '原型已演示' },
      { label: '工作流绑定', state: '原型已演示' },
    ],
    currentProjectTitle: '符阵密度测试组',
    currentProjectSummary: '用同一套场面调度方法测试仙侠和机械两类复杂主体，验证高密度内容能否稳定进入首页推荐流。',
    forumNotes: [
      '想把“复杂不乱”的讨论沉淀成一个作者页固定话题。',
      '后续希望引入精选线，专门承接高密度场景类内容。',
    ],
    stats: ['8 条作品', '1 条方法复用流', '本周 91 次收藏'],
  },
  {
    slug: 'kiro',
    name: 'Kiro',
    role: '真人动作镜头作者',
    location: '上海',
    headline: 'Close Combat Rhythm',
    bio: '聚焦真人动作和硬派打击感，喜欢把镜头切点、肢体节拍和环境回声一起设计成可复用的节奏板。',
    featuredQuote: '动作戏最怕平均，节奏一平均，拳头就没重量了。',
    focus: ['仓库近战', '打击节拍', '跟拍切点', '写实动线'],
    workflowIds: ['wf-1'],
    videoSlugs: ['warehouse-close-combat'],
    statusSignals: [
      { label: '关注', state: '前端占位' },
      { label: '发布联动', state: '接口预留' },
      { label: '评论', state: '原型已演示' },
    ],
    currentProjectTitle: '写实格斗模板库',
    currentProjectSummary: '正在把不同空间里的近战节奏统一成一套镜头模板，后续准备接入发布页里的工作流绑定能力。',
    forumNotes: [
      '需要一个更适合动作短片的标签体系。',
      '希望发布页后续能支持镜头节拍说明字段。',
    ],
    stats: ['6 条作品', '0 条公开工作流', '本周 54 条评论互动'],
  },
  {
    slug: 'observer',
    name: '观察者',
    role: '机甲片场设计师',
    location: '深圳',
    headline: 'Mecha Impact Board',
    bio: '把色板、重量感和推进动线当成同一级内容设计，适合大体量机甲和城市压迫感镜头。',
    featuredQuote: '不是先跑起来，而是先把重量放进去，速度才会显得更贵。',
    focus: ['机甲压迫感', '金属色板', '高速推进', '大场面节奏'],
    workflowIds: ['wf-3'],
    videoSlugs: ['mecha-heavy-entrance'],
    statusSignals: [
      { label: '收藏', state: '前端占位' },
      { label: '工作流详情', state: '原型已演示' },
      { label: '在画布中打开', state: '原型已演示' },
    ],
    currentProjectTitle: '机甲战术板计划',
    currentProjectSummary: '将机甲色板和冲击镜头拆成系列方法资产，后续希望从社区直接复制到画布继续派生。',
    forumNotes: [
      '希望作者页能直接看到工作流被多少作品引用。',
      '后续需要一条专门承接大场面作品的专题流。',
    ],
    stats: ['10 条作品', '1 条公开工作流', '单条工作流 102 次复用信号'],
  },
  {
    slug: 'rhea',
    name: 'Rhea',
    role: '赛博城市镜头作者',
    location: '广州',
    headline: 'Cyber Velocity Scene',
    bio: '擅长做高速霓虹、追逐和城市纵深镜头，重点是让速度感成立但主体不丢失。',
    featuredQuote: '快不等于乱，快是把不该看的都提前删掉。',
    focus: ['赛博夜景', '高速追逐', '霓虹层次', '主体识别'],
    workflowIds: ['wf-3'],
    videoSlugs: ['cyber-city-rush'],
    statusSignals: [
      { label: '关注', state: '前端占位' },
      { label: '评论', state: '原型已演示' },
      { label: '发布入口', state: '接口预留' },
    ],
    currentProjectTitle: '高速都市系列',
    currentProjectSummary: '用统一的色板和速度预设，做一组适合首页推荐流连续刷看的城市短片。',
    forumNotes: [
      '希望后续推荐流能识别“适合连续观看”的高速作品。',
      '发布页里需要更清楚的预览视频和原视频区分。',
    ],
    stats: ['7 条作品', '1 条关联工作流', '本周 73 次转评讨论'],
  },
  {
    slug: 'three-act-studio',
    name: '三幕工作室',
    role: '角色编排团队',
    location: '北京',
    headline: 'Character Blocking System',
    bio: '专注多人角色站位、舞台构图和角色锚定工作流，强调“方法能被看懂，也能被继续改”。',
    featuredQuote: '多人场面的价值，不止是热闹，而是每个位置都有理由。',
    focus: ['角色锚定', '多人编排', '舞台构图', '节拍复盘'],
    workflowIds: ['wf-2'],
    videoSlugs: ['stage-anchor-trio'],
    statusSignals: [
      { label: '作者页聚合', state: '原型已演示' },
      { label: '关注', state: '前端占位' },
      { label: '工作流发布', state: '接口预留' },
    ],
    currentProjectTitle: '角色编排公开课',
    currentProjectSummary: '围绕多人舞台和角色锚定做系列方法拆解，目标是把作者主页做成“作品 + 方法 + 讨论”三位一体入口。',
    forumNotes: [
      '后续想在作者页展示“这个工作流对应了哪些作品”。',
      '希望发布页以后能支持多人角色说明字段。',
      '社区首页里的作者入口应该更像专题，而不是一张头像卡。',
    ],
    stats: ['9 条作品', '1 条公开工作流', '本周 88 次复用信号'],
  },
]

export function getCreatorBySlug(slug: string) {
  return creatorProfiles.find((creator) => creator.slug === slug)
}

export function getCreatorByName(name: string) {
  return creatorProfiles.find((creator) => creator.name === name)
}

export function getCreatorVideos(slug: string) {
  const creator = getCreatorBySlug(slug)

  if (!creator) {
    return []
  }

  return creator.videoSlugs
    .map((videoSlug) => spotlightVideos.find((video) => video.slug === videoSlug))
    .filter((video): video is (typeof spotlightVideos)[number] => Boolean(video))
}

export function getCreatorWorkflows(slug: string) {
  const creator = getCreatorBySlug(slug)

  if (!creator) {
    return []
  }

  return creator.workflowIds
    .map((workflowId) => workflowCatalog.find((workflow) => workflow.id === workflowId))
    .filter((workflow): workflow is (typeof workflowCatalog)[number] => Boolean(workflow))
}
