import Link from "next/link";
import { PageShell } from "@/components/shared/PageShell";
import type { CanvasRuntimePageView } from "@/lib/contracts/view-models";
import { formatRuntimeStatus } from "@/lib/presentation";

type CanvasRuntimePageProps = {
  view: CanvasRuntimePageView;
};

function formatAssetState(state: string) {
  switch (state) {
    case "empty":
      return "空节点";
    case "placeholder":
      return "占位资源";
    case "ready":
      return "资源就绪";
    case "failed":
      return "加载失败";
    default:
      return state;
  }
}

export function CanvasRuntimePage({ view }: CanvasRuntimePageProps) {
  return (
    <PageShell>
      <section className="hero-panel">
        <div className="eyebrow">画布运行态</div>
        <h1 className="hero-title">先打开结构，再逐步补齐资源。</h1>
        <p className="hero-copy">
          这个页面演示的是后续 P2 的目标体验：先创建可进入的运行态壳子，再按视口和优先级补齐图片、视频与其他素材。
        </p>
        <div className="stats-row">
          <span className="meta-pill">{formatRuntimeStatus(view.runtime.runtimeStatus)}</span>
          <span className="meta-pill">快照 v{view.runtime.lightSnapshotVersion}</span>
          {view.copyTask ? <span className="meta-pill">复制进度 {view.copyTask.progressPercent}%</span> : null}
        </div>
        <div className="actions-row">
          <Link className="button-secondary" href="/home">
            返回社区
          </Link>
          {view.runtime.sourceWorkflowId ? (
            <Link className="button-secondary" href={`/workflows/${view.runtime.sourceWorkflowId}`}>
              查看来源工作流
            </Link>
          ) : null}
        </div>
      </section>

      <div className="detail-layout">
        <div className="glass-panel canvas-board">
          {view.snapshot.nodes.map((node) => (
            <div
              className="canvas-node"
              key={node.id}
              style={{
                left: `${node.x / 4}px`,
                top: `${node.y / 4}px`,
                width: `${node.width / 2}px`,
                height: `${node.height / 2}px`
              }}
            >
              <strong>{node.title ?? node.type}</strong>
              <p className="muted">{formatAssetState(node.assetState)}</p>
            </div>
          ))}
        </div>

        <div className="glass-panel stack-panel">
          <div className="eyebrow">运行态摘要</div>
          <h2>渐进复制约定</h2>
          <p className="card-copy">来源工作流：{view.runtime.sourceWorkflowId ?? "当前运行态未记录来源工作流"}</p>
          <p className="card-copy">画布工作流：{view.runtime.canvasWorkflowId}</p>
          {view.copyTask ? (
            <p className="card-copy">复制任务状态：{view.copyTask.statusCode}</p>
          ) : (
            <p className="card-copy">当前没有进行中的复制任务。</p>
          )}
          <div className="canvas-minimap" />
        </div>
      </div>
    </PageShell>
  );
}
