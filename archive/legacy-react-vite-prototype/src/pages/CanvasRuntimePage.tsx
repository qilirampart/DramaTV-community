import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  fetchVisibleAssets,
  getCanvasCopyTask,
  getCanvasRuntimeById,
  getWorkflowById,
} from '../data/workflowCanvasData'
import CanvasMiniMap from '../shared/CanvasMiniMap'
import CanvasNodeCard from '../shared/CanvasNodeCard'

type AssetState = {
  status: 'idle' | 'loading' | 'ready'
  asset?: Awaited<ReturnType<typeof fetchVisibleAssets>>[number]
}

function intersectsViewport(
  viewport: { x: number; y: number; width: number; height: number },
  node: { x: number; y: number; width: number; height: number },
  padding: number,
) {
  const left = viewport.x - padding
  const right = viewport.x + viewport.width + padding
  const top = viewport.y - padding
  const bottom = viewport.y + viewport.height + padding

  return (
    node.x + node.width >= left &&
    node.x <= right &&
    node.y + node.height >= top &&
    node.y <= bottom
  )
}

export default function CanvasRuntimePage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const runtime = params.runtimeId ? getCanvasRuntimeById(params.runtimeId) : undefined
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const seededViewportRef = useRef(false)
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [assetStates, setAssetStates] = useState<Record<string, AssetState>>({})
  const [copyTaskState, setCopyTaskState] = useState(
    searchParams.get('copyTaskId') ? getCanvasCopyTask(searchParams.get('copyTaskId')!) : undefined,
  )

  const copyTaskId = searchParams.get('copyTaskId')

  useEffect(() => {
    if (!runtime) {
      return
    }

    setAssetStates({})
    seededViewportRef.current = false
  }, [runtime?.id])

  useEffect(() => {
    if (!runtime) {
      return
    }

    const element = scrollRef.current

    if (!element) {
      return
    }

    const syncViewport = () => {
      setViewport({
        x: element.scrollLeft,
        y: element.scrollTop,
        width: element.clientWidth,
        height: element.clientHeight,
      })
    }

    if (!seededViewportRef.current) {
      element.scrollLeft = runtime.initialViewport.x
      element.scrollTop = runtime.initialViewport.y
      seededViewportRef.current = true
      syncViewport()
    }

    let frame = 0

    const handleMove = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(syncViewport)
    }

    element.addEventListener('scroll', handleMove)
    window.addEventListener('resize', handleMove)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', handleMove)
      window.removeEventListener('resize', handleMove)
    }
  }, [runtime])

  useEffect(() => {
    if (!copyTaskId) {
      return
    }

    const sync = () => {
      setCopyTaskState(getCanvasCopyTask(copyTaskId))
    }

    sync()

    const timer = window.setInterval(sync, 700)

    return () => {
      window.clearInterval(timer)
    }
  }, [copyTaskId])

  if (!runtime) {
    return (
      <main className="detail-shell detail-shell-empty">
        <div className="detail-empty-card">
          <p className="eyebrow">Canvas Missing</p>
          <h1>这份画布副本还没有准备好</h1>
          <Link to="/" className="primary-button">
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  const workflow = getWorkflowById(runtime.workflowId)

  const visibleNodeIds = runtime.nodes
    .filter((node) => node.mediaKind && intersectsViewport(viewport, node, 260))
    .map((node) => node.id)

  const deferredVisibleNodeIds = useDeferredValue(visibleNodeIds)
  const deferredVisibleNodeKey = deferredVisibleNodeIds.join('|')

  useEffect(() => {
    if (!runtime || !deferredVisibleNodeIds.length) {
      return
    }

    const nextBatch = deferredVisibleNodeIds.filter((nodeId) => {
      const state = assetStates[nodeId]
      return !state || state.status === 'idle'
    })

    if (!nextBatch.length) {
      return
    }

    const targetIds = nextBatch.slice(0, 6)

    setAssetStates((current) => {
      const draft = { ...current }

      targetIds.forEach((nodeId) => {
        draft[nodeId] = { status: 'loading' }
      })

      return draft
    })

    let ignore = false

    void fetchVisibleAssets(runtime.id, targetIds, 6).then((assets) => {
      if (ignore) {
        return
      }

      setAssetStates((current) => {
        const draft = { ...current }

        assets.forEach((asset) => {
          draft[asset.nodeId] = {
            status: 'ready',
            asset,
          }
        })

        return draft
      })
    })

    return () => {
      ignore = true
    }
  }, [assetStates, deferredVisibleNodeKey, deferredVisibleNodeIds, runtime])

  const activePreviewIds = runtime.nodes
    .filter(
      (node) =>
        node.mediaKind === 'video' &&
        assetStates[node.id]?.status === 'ready' &&
        intersectsViewport(viewport, node, 80),
    )
    .slice(0, 2)
    .map((node) => node.id)

  return (
    <div className="canvas-page-shell">
      <div className="page-noise" />

      <header className="canvas-topbar">
        <div>
          {workflow ? (
            <Link to={`/workflows/${workflow.slug}`} className="detail-backlink">
              返回工作流详情
            </Link>
          ) : null}
          <h1>{runtime.workflowTitle}</h1>
          <p>
            {runtime.spaceName} · {runtime.ownerName}
          </p>
        </div>

        <div className="canvas-topbar-actions">
          <div className="canvas-status-pill">
            <strong>{copyTaskState?.progress ?? 100}%</strong>
            <span>{copyTaskState?.title ?? '样板运行中'}</span>
          </div>
          <Link to="/" className="ghost-button">
            返回社区
          </Link>
        </div>
      </header>

      <main className="canvas-main">
        <aside className="canvas-sidebar">
          <div className="canvas-sidebar-card">
            <p className="eyebrow">Copy Task</p>
            <h2>{copyTaskState?.title ?? '画布样板已就绪'}</h2>
            <p>{copyTaskState?.detail ?? runtime.copyHint}</p>
            <div className="canvas-progress-rail">
              <span style={{ width: `${copyTaskState?.progress ?? 100}%` }} />
            </div>
          </div>

          <CanvasMiniMap nodes={runtime.nodes} edges={runtime.edges} world={runtime.world} viewport={viewport} />

          <div className="canvas-sidebar-card">
            <p className="eyebrow">Render Rule</p>
            <ul className="canvas-rule-list">
              <li>先渲染 Node Shell，再补 visible-assets。</li>
              <li>小地图只吃几何信息，不依赖真实媒体。</li>
              <li>视频节点默认只允许少量同屏 preview。</li>
            </ul>
          </div>
        </aside>

        <section className="canvas-stage-panel">
          <div className="canvas-stage-head">
            <div>
              <span className="workflow-status">runtime ready</span>
              <h2>打开时先出现结构，内容按视口逐步长出来</h2>
            </div>
            <p>
              当前视口会优先请求 {deferredVisibleNodeIds.length} 个媒体节点。远处节点仍保留轻量几何壳，不会抢首屏资源。
            </p>
          </div>

          <div ref={scrollRef} className="canvas-viewport">
            <div
              className="canvas-world"
              style={{ width: runtime.world.width, height: runtime.world.height }}
            >
              <svg
                className="canvas-edge-layer"
                width={runtime.world.width}
                height={runtime.world.height}
                aria-hidden="true"
              >
                {runtime.edges.map((edge) => {
                  const from = runtime.nodes.find((node) => node.id === edge.from)
                  const to = runtime.nodes.find((node) => node.id === edge.to)

                  if (!from || !to) {
                    return null
                  }

                  const startX = from.x + from.width
                  const startY = from.y + from.height / 2
                  const endX = to.x
                  const endY = to.y + to.height / 2
                  const curve = Math.max((endX - startX) / 2, 80)

                  return (
                    <path
                      key={edge.id}
                      d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`}
                    />
                  )
                })}
              </svg>

              {runtime.nodes.map((node) => (
                <CanvasNodeCard
                  key={node.id}
                  node={node}
                  assetState={assetStates[node.id]}
                  showPreview={activePreviewIds.includes(node.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
