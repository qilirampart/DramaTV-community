import Link from "next/link";
import { PageShell } from "@/components/shared/PageShell";
import { COMMUNITY_INTERNAL_ROUTES } from "@/lib/routes/community-routes";

export default function CommunityInternalIndexPage() {
  return (
    <PageShell variant="home" topNavActive="landing">
      <main className="page-shell-home-content">
        <section className="glass-panel" style={{ padding: "32px" }}>
          <div className="eyebrow">Internal Routes</div>
          <h1 style={{ margin: "16px 0 0", fontSize: "2rem" }}>内部隔离页面</h1>
          <p style={{ margin: "12px 0 0", maxWidth: "64ch", color: "var(--soft-silver)", lineHeight: 1.7 }}>
            这里收纳历史复刻页、参考页和本地联调页。正式社区主线只保留首页、精选、社区、发布、详情、作者页和画布联动页。
          </p>

          <div style={{ display: "grid", gap: "14px", marginTop: "24px" }}>
            <Link className="button-secondary" href={COMMUNITY_INTERNAL_ROUTES.seedance}>
              Seedance 参考页
            </Link>
            <Link className="button-secondary" href={COMMUNITY_INTERNAL_ROUTES.nanoBanana}>
              Nano Banana 参考页
            </Link>
            <Link className="button-secondary" href={COMMUNITY_INTERNAL_ROUTES.devSmoke}>
              Dev Smoke 工具页
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
