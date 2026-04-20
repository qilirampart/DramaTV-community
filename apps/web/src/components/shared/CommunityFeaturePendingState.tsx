import Link from "next/link";
import { PageShell } from "@/components/shared/PageShell";

type CommunityFeaturePendingStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  detail?: string;
};

export function CommunityFeaturePendingState({
  eyebrow = "能力接入状态",
  title,
  description,
  detail
}: CommunityFeaturePendingStateProps) {
  return (
    <PageShell>
      <section className="hero-panel">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-copy">{description}</p>
        <div className="hero-actions">
          <Link className="button" href="/">
            返回首页
          </Link>
          <Link className="button-secondary" href="/publish">
            进入发布台
          </Link>
        </div>
      </section>

      <section className="glass-panel detail-panel">
        <h2>当前处理方式</h2>
        <div className="field-list">
          <div className="field">1. 该页面不再使用本地静态数据伪装真实业务。</div>
          <div className="field">2. 后续接入真实后端后，再恢复讨论区或对应能力的真实内容流。</div>
          {detail ? <div className="field">3. 当前说明：{detail}</div> : null}
        </div>
      </section>
    </PageShell>
  );
}
