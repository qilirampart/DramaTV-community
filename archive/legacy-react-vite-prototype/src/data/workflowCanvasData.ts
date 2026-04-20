const video = (fileName: string) => encodeURI(`/prefill-videos/${fileName}`)

const COPY_TASK_STORAGE_KEY = 'dramatv-copy-task-records'

export type WorkflowDetail = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  authorName: string
  authorRole: string
  status: string
  copyLabel: string
  canvasLabel: string
  tags: string[]
  stats: string[]
  bestFor: string[]
  sourceVideoSlugs: string[]
  defaultRuntimeId: string
  featuredStages: Array<{
    id: string
    title: string
    summary: string
    signal: string
  }>
  featuredNodes: Array<{
    id: string
    title: string
    summary: string
    badge: string
  }>
}

export type CanvasNodeType =
  | 'reference'
  | 'prompt'
  | 'control'
  | 'image'
  | 'video'
  | 'output'
  | 'note'

export type CanvasRuntimeNode = {
  id: string
  type: CanvasNodeType
  title: string
  badge: string
  x: number
  y: number
  width: number
  height: number
  group: string
  accent: string
  description: string
  mediaKind?: 'image' | 'video'
}

export type CanvasRuntimeEdge = {
  id: string
  from: string
  to: string
}

export type CanvasRuntimeAsset = {
  nodeId: string
  kind: 'image' | 'video'
  thumbnailUrl: string
  posterUrl: string
  previewUrl?: string
  caption: string
}

export type CanvasRuntimeRecord = {
  id: string
  workflowId: string
  workflowTitle: string
  ownerName: string
  spaceName: string
  status: 'ready' | 'syncing'
  world: {
    width: number
    height: number
  }
  initialViewport: {
    x: number
    y: number
  }
  nodes: CanvasRuntimeNode[]
  edges: CanvasRuntimeEdge[]
  copyHint: string
}

export type CanvasCopyTaskState = {
  id: string
  workflowId: string
  targetRuntimeId: string
  status: 'runtime_ready' | 'syncing_assets' | 'ready'
  progress: number
  title: string
  detail: string
}

type RuntimeTemplate = {
  world: CanvasRuntimeRecord['world']
  initialViewport: CanvasRuntimeRecord['initialViewport']
  nodes: CanvasRuntimeNode[]
  edges: CanvasRuntimeEdge[]
  copyHint: string
  ownerName: string
  spaceName: string
}

type StoredCopyTask = {
  id: string
  workflowId: string
  targetRuntimeId: string
  createdAt: number
}

export const workflowCatalog: WorkflowDetail[] = [
  {
    id: 'wf-1',
    slug: 'cold-moon-shot-language',
    title: '武侠冷月镜头工作流',
    summary: '把冷雾、月光、起手蓄力和刀光落点拆成一套可复用的镜头语言。',
    description:
      '这套工作流适合先用情绪和光色立住氛围，再逐步补镜头调度和动作起势。复制后能直接进入一份结构完整的画布副本，当前视口里的关键节点会最先出现缩略图和预览。',
    authorName: '镜川',
    authorRole: '氛围武侠作者',
    status: '可复制',
    copyLabel: '复制到我的画布',
    canvasLabel: '打开样板画布',
    tags: ['冷月', '竹林', '刀光', '情绪近景'],
    stats: ['12 个核心节点', '4 段镜头预设', '支持继续派生'],
    bestFor: ['情绪型对峙', '竹林冷色场景', '近景起手镜头'],
    sourceVideoSlugs: ['cold-moon-bamboo-duel'],
    defaultRuntimeId: 'runtime-wf-1-studio',
    featuredStages: [
      {
        id: 's1',
        title: '冷色基调',
        summary: '先把月光、雾层和竹林反差稳住，保证所有后续节点都在同一气候里。',
        signal: '结构先定气候',
      },
      {
        id: 's2',
        title: '动作起手',
        summary: '把出刀前的停顿做成节奏节点，而不是直接把动作塞进一个 prompt。',
        signal: '镜头先蓄力',
      },
      {
        id: 's3',
        title: '刀光落点',
        summary: '把高亮边缘和人物站位当成独立控制层，方便后续派生到别的角色组合。',
        signal: '亮点单独控制',
      },
    ],
    featuredNodes: [
      { id: 'n-02', title: 'Prompt Spine', summary: '主提示词脊柱，锁住情绪和时代感。', badge: 'Prompt' },
      { id: 'n-05', title: 'Scene Plate', summary: '雾层和月光先做低成本场景板。', badge: 'Image' },
      { id: 'n-10', title: 'Strike Motion', summary: '决定镜头何时从静转动。', badge: 'Video' },
      { id: 'n-15', title: 'Final Render', summary: '输出成片同时保留可继续改写的中间态。', badge: 'Output' },
    ],
  },
  {
    id: 'wf-2',
    slug: 'stage-blocking-score',
    title: '角色舞台编排工作流',
    summary: '用队形、站位和镜头节拍去组织多人表演，不让人物关系在大画布里失控。',
    description:
      '这套工作流更像导演排练本。你复制过去后先看到的是分区骨架和节点组，真正可见的角色卡、站位图和短预览会随着你移动视口一点点补出来，所以大画布也能保持很轻。',
    authorName: '三幕工作室',
    authorRole: '角色编排团队',
    status: '可在画布中打开',
    copyLabel: '复制编排副本',
    canvasLabel: '查看排练画布',
    tags: ['角色锚定', '多人编排', '舞台调度', '节奏切分'],
    stats: ['18 个编排节点', '3 个角色组', '舞台视图就绪'],
    bestFor: ['多人舞台', '角色锚定', '镜头节奏拆分'],
    sourceVideoSlugs: ['stage-anchor-trio'],
    defaultRuntimeId: 'runtime-wf-2-studio',
    featuredStages: [
      {
        id: 's1',
        title: '角色锚点',
        summary: '先把角色身份和距离关系单独稳定下来，再做镜头推进。',
        signal: '人物不漂移',
      },
      {
        id: 's2',
        title: '队形变换',
        summary: '把舞台中心线和镜头切换点做成独立控制块，方便排练不同版本。',
        signal: '队形独立变体',
      },
      {
        id: 's3',
        title: '节奏复盘',
        summary: '每个段落都能回看自己为什么切镜，而不是只看到最终成片。',
        signal: '方法可以回放',
      },
    ],
    featuredNodes: [
      { id: 'n-01', title: 'Cast Board', summary: '角色身份、配色和镜头距离先占位。', badge: 'Reference' },
      { id: 'n-06', title: 'Stage Grid', summary: '把舞台块面拆成可复制的布局。', badge: 'Image' },
      { id: 'n-11', title: 'Beat Preview', summary: '节拍预览只在当前视口里解锁。', badge: 'Video' },
      { id: 'n-14', title: 'Cue Notes', summary: '保留导演式批注，方便团队交流。', badge: 'Note' },
    ],
  },
  {
    id: 'wf-3',
    slug: 'mecha-impact-board',
    title: '机甲冲突色板与运动预设',
    summary: '先搭色板和重量感，再让镜头跟着推进，适合大体量机甲入场和城市压迫感场景。',
    description:
      '这套工作流的重点不是把所有素材一次性塞满，而是先把压迫感和速度层级铺开。打开副本后，用户会先看到整张战术板的结构，再按视口逐步拿到 poster、thumbnail 和少量视频预览。',
    authorName: '观察者',
    authorRole: '机甲片场设计师',
    status: '支持派生',
    copyLabel: '复制战术板',
    canvasLabel: '进入机甲画布',
    tags: ['机甲', '金属色板', '速度预设', '压迫感'],
    stats: ['16 个节点', '2 级色板预设', '大场面可派生'],
    bestFor: ['机甲登场', '高速突进', '色板复用'],
    sourceVideoSlugs: ['mecha-heavy-entrance', 'cyber-city-rush'],
    defaultRuntimeId: 'runtime-wf-3-studio',
    featuredStages: [
      {
        id: 's1',
        title: '重量底色',
        summary: '先用材质和主色块建立机甲压迫感，避免镜头先热闹、重量后补。',
        signal: '先重后快',
      },
      {
        id: 's2',
        title: '速度推进',
        summary: '镜头位移和主体推进拆分成两条独立控制线，后续非常适合复制变种。',
        signal: '运动拆层',
      },
      {
        id: 's3',
        title: '城市场回响',
        summary: '远景和近景预览分开加载，保证大画布复制时依然足够轻。',
        signal: '可视区懒加载',
      },
    ],
    featuredNodes: [
      { id: 'n-03', title: 'Material Lock', summary: '先把金属反射和色板钉住。', badge: 'Control' },
      { id: 'n-08', title: 'Impact Plate', summary: '主场景板块负责压迫感。', badge: 'Image' },
      { id: 'n-12', title: 'Rush Preview', summary: '高速预览只保留少量同屏视频。', badge: 'Video' },
      { id: 'n-16', title: 'Output Rail', summary: '输出轨保留 poster、preview、source 三层。', badge: 'Output' },
    ],
  },
]

const nodeBlueprints: Array<Omit<CanvasRuntimeNode, 'accent' | 'description'>> = [
  { id: 'n-01', type: 'reference', title: 'Cast Board', badge: 'Reference', x: 160, y: 180, width: 248, height: 160, group: 'intake', mediaKind: 'image' },
  { id: 'n-02', type: 'prompt', title: 'Prompt Spine', badge: 'Prompt', x: 470, y: 150, width: 316, height: 184, group: 'intake' },
  { id: 'n-03', type: 'control', title: 'Material Lock', badge: 'Control', x: 860, y: 142, width: 260, height: 172, group: 'intake', mediaKind: 'image' },
  { id: 'n-04', type: 'control', title: 'Camera Rhythm', badge: 'Control', x: 1180, y: 136, width: 260, height: 160, group: 'intake' },
  { id: 'n-05', type: 'image', title: 'Scene Plate', badge: 'Image', x: 180, y: 520, width: 252, height: 188, group: 'build', mediaKind: 'image' },
  { id: 'n-06', type: 'image', title: 'Stage Grid', badge: 'Image', x: 520, y: 500, width: 286, height: 198, group: 'build', mediaKind: 'image' },
  { id: 'n-07', type: 'note', title: 'Director Cue', badge: 'Note', x: 860, y: 522, width: 212, height: 152, group: 'build' },
  { id: 'n-08', type: 'image', title: 'Impact Plate', badge: 'Image', x: 1150, y: 504, width: 300, height: 208, group: 'build', mediaKind: 'image' },
  { id: 'n-09', type: 'control', title: 'Motion Split', badge: 'Control', x: 1530, y: 494, width: 232, height: 160, group: 'build' },
  { id: 'n-10', type: 'video', title: 'Strike Motion', badge: 'Video', x: 510, y: 900, width: 300, height: 210, group: 'motion', mediaKind: 'video' },
  { id: 'n-11', type: 'video', title: 'Beat Preview', badge: 'Video', x: 900, y: 930, width: 286, height: 206, group: 'motion', mediaKind: 'video' },
  { id: 'n-12', type: 'video', title: 'Rush Preview', badge: 'Video', x: 1260, y: 884, width: 320, height: 214, group: 'motion', mediaKind: 'video' },
  { id: 'n-13', type: 'image', title: 'Poster Snapshot', badge: 'Poster', x: 1670, y: 884, width: 248, height: 186, group: 'motion', mediaKind: 'image' },
  { id: 'n-14', type: 'note', title: 'Cue Notes', badge: 'Note', x: 2060, y: 942, width: 228, height: 168, group: 'motion' },
  { id: 'n-15', type: 'output', title: 'Final Render', badge: 'Output', x: 2220, y: 1340, width: 320, height: 214, group: 'output', mediaKind: 'image' },
  { id: 'n-16', type: 'output', title: 'Output Rail', badge: 'Output', x: 1820, y: 1340, width: 292, height: 198, group: 'output', mediaKind: 'image' },
  { id: 'n-17', type: 'image', title: 'Archive Board', badge: 'Archive', x: 1220, y: 1440, width: 260, height: 180, group: 'output', mediaKind: 'image' },
  { id: 'n-18', type: 'note', title: 'Fork Note', badge: 'Fork', x: 760, y: 1420, width: 224, height: 162, group: 'output' },
]

const edgeBlueprints: CanvasRuntimeEdge[] = [
  { id: 'e-01', from: 'n-01', to: 'n-02' },
  { id: 'e-02', from: 'n-02', to: 'n-03' },
  { id: 'e-03', from: 'n-03', to: 'n-04' },
  { id: 'e-04', from: 'n-02', to: 'n-05' },
  { id: 'e-05', from: 'n-05', to: 'n-06' },
  { id: 'e-06', from: 'n-06', to: 'n-07' },
  { id: 'e-07', from: 'n-06', to: 'n-08' },
  { id: 'e-08', from: 'n-08', to: 'n-09' },
  { id: 'e-09', from: 'n-09', to: 'n-10' },
  { id: 'e-10', from: 'n-09', to: 'n-11' },
  { id: 'e-11', from: 'n-09', to: 'n-12' },
  { id: 'e-12', from: 'n-10', to: 'n-13' },
  { id: 'e-13', from: 'n-11', to: 'n-14' },
  { id: 'e-14', from: 'n-12', to: 'n-16' },
  { id: 'e-15', from: 'n-13', to: 'n-16' },
  { id: 'e-16', from: 'n-16', to: 'n-15' },
  { id: 'e-17', from: 'n-16', to: 'n-17' },
  { id: 'e-18', from: 'n-16', to: 'n-18' },
]

const workflowThemes = {
  'wf-1': {
    primary: '#8fc7da',
    secondary: '#f0a96a',
    muted: '#364753',
    previewVideo: video('舞蹈.mp4'),
    copyHint: '结构副本已创建，当前视口会优先补月光、刀光和起手段落的缩略图。',
    ownerName: '社区公开样板',
    spaceName: 'Cold Moon Public Space',
  },
  'wf-2': {
    primary: '#e9c16f',
    secondary: '#7fc8b5',
    muted: '#38463c',
    previewVideo: video('招式.mp4'),
    copyHint: '画布先出排练骨架，再补角色卡和节拍预览，复制时不会整屏卡死。',
    ownerName: '编排示范空间',
    spaceName: 'Stage Blocking Room',
  },
  'wf-3': {
    primary: '#9cb4ff',
    secondary: '#ef9156',
    muted: '#34374f',
    previewVideo: video('汽车.mp4'),
    copyHint: '先把大场面结构立起来，只在你看到的区域内继续补齐 poster 和预览。',
    ownerName: '机甲测试空间',
    spaceName: 'Impact Board Space',
  },
} as const

function makeSvgDataUri(title: string, subtitle: string, primary: string, secondary: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="960" height="640" fill="#140f0d" />
      <rect x="24" y="24" width="912" height="592" rx="40" fill="url(#g)" opacity="0.24" />
      <g opacity="0.18" stroke="white">
        <path d="M0 138H960" />
        <path d="M0 306H960" />
        <path d="M0 472H960" />
        <path d="M208 0V640" />
        <path d="M474 0V640" />
        <path d="M736 0V640" />
      </g>
      <rect x="60" y="70" width="208" height="34" rx="17" fill="rgba(255,255,255,0.16)" />
      <text x="84" y="92" fill="#f8efe6" font-size="26" font-family="Segoe UI, PingFang SC, sans-serif" letter-spacing="4">${subtitle}</text>
      <text x="62" y="364" fill="#fbf5ef" font-size="74" font-family="Georgia, Noto Serif SC, serif">${title}</text>
      <text x="62" y="414" fill="rgba(248,241,232,0.86)" font-size="28" font-family="Segoe UI, PingFang SC, sans-serif">visible assets hydrate on demand</text>
      <circle cx="790" cy="196" r="122" fill="rgba(255,255,255,0.12)" />
      <circle cx="842" cy="164" r="58" fill="rgba(255,255,255,0.2)" />
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createNodeDescription(workflow: WorkflowDetail, node: Omit<CanvasRuntimeNode, 'accent' | 'description'>) {
  if (node.type === 'prompt') {
    return `${workflow.title} 的主提示词脊柱，负责把风格、情绪和镜头方向锁在同一条线上。`
  }

  if (node.type === 'video') {
    return `进入视口后才会请求视频 poster 和少量预览，避免大画布同时解码太多媒体。`
  }

  if (node.type === 'output') {
    return `输出节点保留 thumbnail、poster、preview 三层，方便社区页和画布页共用。`
  }

  if (node.type === 'note') {
    return `这个节点是给创作者和团队看的说明层，不会阻塞画布首屏成型。`
  }

  return `这里是 ${workflow.title} 的 ${node.badge} 节点，复制时会先带走结构和引用关系。`
}

function createRuntimeNodes(workflow: WorkflowDetail) {
  const theme = workflowThemes[workflow.id as keyof typeof workflowThemes]

  return nodeBlueprints.map((node, index) => ({
    ...node,
    accent: index % 2 === 0 ? theme.primary : theme.secondary,
    description: createNodeDescription(workflow, node),
  }))
}

function createRuntimeTemplate(workflow: WorkflowDetail): RuntimeTemplate {
  const theme = workflowThemes[workflow.id as keyof typeof workflowThemes]

  return {
    world: { width: 3200, height: 2200 },
    initialViewport: { x: workflow.id === 'wf-2' ? 280 : 420, y: workflow.id === 'wf-3' ? 380 : 260 },
    nodes: createRuntimeNodes(workflow),
    edges: edgeBlueprints,
    copyHint: theme.copyHint,
    ownerName: theme.ownerName,
    spaceName: theme.spaceName,
  }
}

const runtimeTemplates = workflowCatalog.reduce<Record<string, RuntimeTemplate>>((accumulator, workflow) => {
  accumulator[workflow.id] = createRuntimeTemplate(workflow)
  return accumulator
}, {})

const dynamicRuntimeCatalog = new Map<string, CanvasRuntimeRecord>()

const runtimeAssets = workflowCatalog.reduce<Record<string, Record<string, CanvasRuntimeAsset>>>((accumulator, workflow) => {
  const theme = workflowThemes[workflow.id as keyof typeof workflowThemes]
  const template = runtimeTemplates[workflow.id]

  accumulator[workflow.id] = template.nodes.reduce<Record<string, CanvasRuntimeAsset>>((assetMap, node) => {
    if (!node.mediaKind) {
      return assetMap
    }

    assetMap[node.id] = {
      nodeId: node.id,
      kind: node.mediaKind,
      thumbnailUrl: makeSvgDataUri(node.title, node.badge.toUpperCase(), theme.primary, theme.muted),
      posterUrl: makeSvgDataUri(workflow.title, node.title, theme.primary, theme.secondary),
      previewUrl: node.mediaKind === 'video' ? theme.previewVideo : undefined,
      caption: `${workflow.title} · ${node.title}`,
    }

    return assetMap
  }, {})

  return accumulator
}, {})

const baseRuntimeCatalog = workflowCatalog.reduce<Record<string, CanvasRuntimeRecord>>((accumulator, workflow) => {
  const template = runtimeTemplates[workflow.id]

  accumulator[workflow.defaultRuntimeId] = {
    id: workflow.defaultRuntimeId,
    workflowId: workflow.id,
    workflowTitle: workflow.title,
    ownerName: template.ownerName,
    spaceName: template.spaceName,
    status: 'ready',
    world: template.world,
    initialViewport: template.initialViewport,
    nodes: template.nodes,
    edges: template.edges,
    copyHint: template.copyHint,
  }

  return accumulator
}, {})

function readStoredCopyTasks() {
  if (typeof window === 'undefined') {
    return {} as Record<string, StoredCopyTask>
  }

  const stored = window.sessionStorage.getItem(COPY_TASK_STORAGE_KEY)

  if (!stored) {
    return {} as Record<string, StoredCopyTask>
  }

  try {
    return JSON.parse(stored) as Record<string, StoredCopyTask>
  } catch {
    return {} as Record<string, StoredCopyTask>
  }
}

function writeStoredCopyTasks(records: Record<string, StoredCopyTask>) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(COPY_TASK_STORAGE_KEY, JSON.stringify(records))
}

function buildRuntimeFromWorkflow(workflowId: string, runtimeId: string, ownerName: string, spaceName: string) {
  const workflow = getWorkflowById(workflowId)
  const template = runtimeTemplates[workflowId]

  if (!workflow || !template) {
    return undefined
  }

  return {
    id: runtimeId,
    workflowId,
    workflowTitle: workflow.title,
    ownerName,
    spaceName,
    status: 'syncing' as const,
    world: template.world,
    initialViewport: template.initialViewport,
    nodes: template.nodes,
    edges: template.edges,
    copyHint: template.copyHint,
  }
}

function getWorkflowIdFromRuntimeId(runtimeId: string) {
  const match = runtimeId.match(/^runtime__(.+?)__/)
  return match?.[1]
}

export function getWorkflowBySlug(slug: string) {
  return workflowCatalog.find((workflow) => workflow.slug === slug)
}

export function getWorkflowById(workflowId: string) {
  return workflowCatalog.find((workflow) => workflow.id === workflowId)
}

export function getCanvasRuntimeById(runtimeId: string) {
  const baseRuntime = baseRuntimeCatalog[runtimeId]

  if (baseRuntime) {
    return baseRuntime
  }

  const cachedRuntime = dynamicRuntimeCatalog.get(runtimeId)

  if (cachedRuntime) {
    return cachedRuntime
  }

  const workflowId = getWorkflowIdFromRuntimeId(runtimeId)

  if (!workflowId) {
    return undefined
  }

  const runtime = buildRuntimeFromWorkflow(workflowId, runtimeId, '你的工作区', 'My Canvas Space')

  if (runtime) {
    dynamicRuntimeCatalog.set(runtimeId, runtime)
  }

  return runtime
}

export async function startMockWorkflowCopy(workflowId: string) {
  const workflow = getWorkflowById(workflowId)

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`)
  }

  const uniqueToken = Date.now().toString(36)
  const copyTaskId = `copy_${workflowId}_${uniqueToken}`
  const targetRuntimeId = `runtime__${workflowId}__${uniqueToken}`
  const records = readStoredCopyTasks()

  records[copyTaskId] = {
    id: copyTaskId,
    workflowId,
    targetRuntimeId,
    createdAt: Date.now(),
  }

  writeStoredCopyTasks(records)

  await new Promise((resolve) => {
    window.setTimeout(resolve, 820)
  })

  return {
    copyTaskId,
    targetRuntimeId,
    openUrl: `/canvas/${targetRuntimeId}?copyTaskId=${copyTaskId}`,
  }
}

export function getCanvasCopyTask(copyTaskId: string) {
  const records = readStoredCopyTasks()
  const record = records[copyTaskId]

  if (!record) {
    return undefined
  }

  const elapsed = Date.now() - record.createdAt

  if (elapsed < 1400) {
    return {
      id: record.id,
      workflowId: record.workflowId,
      targetRuntimeId: record.targetRuntimeId,
      status: 'runtime_ready',
      progress: 38,
      title: '结构副本已创建',
      detail: '现在已经能进入画布，当前只保证结构、坐标和引用先到位。',
    } satisfies CanvasCopyTaskState
  }

  if (elapsed < 3800) {
    return {
      id: record.id,
      workflowId: record.workflowId,
      targetRuntimeId: record.targetRuntimeId,
      status: 'syncing_assets',
      progress: 76,
      title: '正在补齐可视区素材',
      detail: 'poster、thumbnail 和少量 preview 会随着视口移动继续补齐。',
    } satisfies CanvasCopyTaskState
  }

  return {
    id: record.id,
    workflowId: record.workflowId,
    targetRuntimeId: record.targetRuntimeId,
    status: 'ready',
    progress: 100,
    title: '副本已就绪',
    detail: '大部分轻资源已经就位，后续继续移动视口时仍会按需请求远处节点。',
  } satisfies CanvasCopyTaskState
}

export async function fetchVisibleAssets(
  runtimeId: string,
  nodeIds: string[],
  limit = 6,
) {
  const runtime = getCanvasRuntimeById(runtimeId)

  if (!runtime) {
    return []
  }

  const assetMap = runtimeAssets[runtime.workflowId] ?? {}
  const requestedIds = nodeIds.slice(0, limit)

  await new Promise((resolve) => {
    window.setTimeout(resolve, 280 + requestedIds.length * 90)
  })

  return requestedIds.map((nodeId) => assetMap[nodeId]).filter(Boolean)
}
