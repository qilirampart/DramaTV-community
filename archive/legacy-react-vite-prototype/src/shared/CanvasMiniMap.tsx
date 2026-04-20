import type { CanvasRuntimeEdge, CanvasRuntimeNode } from '../data/workflowCanvasData'

export default function CanvasMiniMap({
  nodes,
  edges,
  world,
  viewport,
}: {
  nodes: CanvasRuntimeNode[]
  edges: CanvasRuntimeEdge[]
  world: {
    width: number
    height: number
  }
  viewport: {
    x: number
    y: number
    width: number
    height: number
  }
}) {
  const width = 248
  const height = 164
  const scale = Math.min(width / world.width, height / world.height)
  const scaledWorldWidth = world.width * scale
  const scaledWorldHeight = world.height * scale
  const offsetX = (width - scaledWorldWidth) / 2
  const offsetY = (height - scaledWorldHeight) / 2

  return (
    <div className="canvas-minimap">
      <div className="canvas-minimap-head">
        <strong>Light Snapshot</strong>
        <span>{nodes.length} nodes</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="canvas minimap">
        <rect
          x={offsetX}
          y={offsetY}
          width={scaledWorldWidth}
          height={scaledWorldHeight}
          rx="16"
          className="canvas-minimap-world"
        />

        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.from)
          const to = nodes.find((node) => node.id === edge.to)

          if (!from || !to) {
            return null
          }

          return (
            <line
              key={edge.id}
              x1={offsetX + (from.x + from.width / 2) * scale}
              y1={offsetY + (from.y + from.height / 2) * scale}
              x2={offsetX + (to.x + to.width / 2) * scale}
              y2={offsetY + (to.y + to.height / 2) * scale}
              className="canvas-minimap-edge"
            />
          )
        })}

        {nodes.map((node) => (
          <rect
            key={node.id}
            x={offsetX + node.x * scale}
            y={offsetY + node.y * scale}
            width={Math.max(node.width * scale, 5)}
            height={Math.max(node.height * scale, 5)}
            rx="4"
            className="canvas-minimap-node"
          />
        ))}

        <rect
          x={offsetX + viewport.x * scale}
          y={offsetY + viewport.y * scale}
          width={Math.max(viewport.width * scale, 16)}
          height={Math.max(viewport.height * scale, 12)}
          rx="10"
          className="canvas-minimap-viewport"
        />
      </svg>
    </div>
  )
}
