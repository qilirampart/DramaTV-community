import type { CanvasRuntimeAsset, CanvasRuntimeNode } from '../data/workflowCanvasData'

type CanvasNodeAssetState = {
  status: 'idle' | 'loading' | 'ready'
  asset?: CanvasRuntimeAsset
}

export default function CanvasNodeCard({
  node,
  assetState,
  showPreview,
}: {
  node: CanvasRuntimeNode
  assetState?: CanvasNodeAssetState
  showPreview: boolean
}) {
  const toneClass = `canvas-node canvas-node-${node.type}`

  return (
    <article
      className={toneClass}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        ['--node-accent' as string]: node.accent,
      }}
    >
      <div className="canvas-node-header">
        <span className="canvas-node-badge">{node.badge}</span>
        <span className="canvas-node-group">{node.group}</span>
      </div>

      <div className="canvas-node-body">
        <div>
          <h3>{node.title}</h3>
          <p>{node.description}</p>
        </div>

        {node.mediaKind ? (
          <div className="canvas-node-media">
            {assetState?.status === 'ready' && assetState.asset ? (
              <>
                {node.mediaKind === 'video' && showPreview && assetState.asset.previewUrl ? (
                  <video
                    className="canvas-node-video"
                    src={assetState.asset.previewUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img src={assetState.asset.posterUrl} alt={assetState.asset.caption} />
                )}
                <span className="canvas-node-caption">{assetState.asset.caption}</span>
              </>
            ) : assetState?.status === 'loading' ? (
              <div className="canvas-node-placeholder canvas-node-placeholder-loading">
                <span>visible-assets loading</span>
              </div>
            ) : (
              <div className="canvas-node-placeholder">
                <span>geometry first</span>
              </div>
            )}
          </div>
        ) : (
          <div className="canvas-node-note">
            <span>light snapshot only</span>
          </div>
        )}
      </div>
    </article>
  )
}
