import Link from "next/link";
import { PageShell } from "@/components/shared/PageShell";
import { getCommunityDataMode, getConfiguredApiBaseUrl } from "@/lib/api/community-service";

type CommunityBackendUnavailableStateProps = {
  title: string;
  description: string;
  detail?: string;
  requestId?: string;
};

export function CommunityBackendUnavailableState({
  title,
  description,
  detail,
  requestId
}: CommunityBackendUnavailableStateProps) {
  const dataMode = getCommunityDataMode();
  const apiBaseUrl = getConfiguredApiBaseUrl();

  return (
    <PageShell>
      <section className="hero-panel">
        <div className="eyebrow">Backend Unavailable</div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-copy">{description}</p>
        <div className="stats-row">
          <span className="meta-pill">Data mode: {dataMode}</span>
          <span className="meta-pill">API base: {apiBaseUrl ?? "not configured"}</span>
        </div>
        <div className="hero-actions">
          <Link className="button-secondary" href="/home">
            返回社区
          </Link>
          <Link className="button-secondary" href="/">
            回到首页
          </Link>
        </div>
      </section>

      <section className="glass-panel detail-panel">
        <h2>Troubleshooting</h2>
        <p className="section-copy">
          The community page could not fetch live backend data. Check whether the Spring Boot service is up and
          whether the frontend is pointing at the correct API base URL.
        </p>
        <div className="field-list">
          <div className="field">1. Confirm the Spring Boot backend is running.</div>
          <div className="field">2. Confirm `DRAMATV_API_BASE_URL` points to `http://127.0.0.1:18080`.</div>
          {detail ? <div className="field">3. Error detail: {detail}</div> : null}
          {requestId ? <div className="field">4. Request ID: {requestId}</div> : null}
        </div>
      </section>
    </PageShell>
  );
}
