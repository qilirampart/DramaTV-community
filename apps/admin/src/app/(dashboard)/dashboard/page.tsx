import Link from "next/link";
import { requireAdminAccess } from "@/lib/admin-auth";
import { AdminBackendError, getAdminDashboardOverview } from "@/lib/admin-service";
import styles from "./page.module.css";

type Tone = "neutral" | "positive" | "warning" | "critical";

type Metric = {
  label: string;
  value: string;
  delta: string;
  icon: "review" | "report" | "comment" | "media" | "content" | "user";
};

type QueueRow = {
  id: string;
  targetTypeCode: string;
  type: "视频提示词" | "图片提示词" | "工作流" | "帖子" | "视频作品";
  title: string;
  author: string;
  submittedAt: string;
  status: string;
  statusTone: Tone;
  risk: string;
  riskTone: Tone;
  href: string;
};

type AlertGroup = {
  title: string;
  icon: "report" | "media" | "manual";
  href: string;
  items: readonly {
    title: string;
    detail: string;
    time: string;
    href: string;
  }[];
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: "moderation" | "report" | "layout" | "media";
};

function formatDateTime(input: string | null | undefined) {
  if (!input) {
    return "未记录";
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function truncateInlineText(input: string, maxLength: number) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function summarizeMediaTaskError(errorMessage: string | null | undefined) {
  const normalized = (errorMessage ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "待排查";
  }

  const lower = normalized.toLowerCase();
  if (lower.includes("timeout")) {
    return "媒体处理超时";
  }
  if (
    lower.includes("ffmpeg")
    || lower.includes("encoder")
    || lower.includes("conversion failed")
    || lower.includes("invalid argument")
  ) {
    return "FFmpeg 转码失败";
  }
  if (lower.includes("callback")) {
    return "回调处理失败";
  }
  if (lower.includes("upload")) {
    return "上传处理失败";
  }

  return truncateInlineText(normalized, 28);
}

function targetTypeLabel(targetType: string): QueueRow["type"] {
  if (targetType === "prompt") {
    return "视频提示词";
  }
  if (targetType === "workflow") {
    return "工作流";
  }
  if (targetType === "post") {
    return "帖子";
  }
  return "视频作品";
}

function statusLabel(statusCode: string) {
  if (statusCode === "pending_review") {
    return "待审核";
  }
  if (statusCode === "in_review") {
    return "审核中";
  }
  if (statusCode === "processing") {
    return "处理中";
  }
  if (statusCode === "pending") {
    return "待处理";
  }
  if (statusCode === "failed") {
    return "失败";
  }
  if (statusCode === "disabled") {
    return "禁用";
  }
  if (statusCode === "pending_user" || statusCode === "pending-user" || statusCode === "pending") {
    return "观察中";
  }
  return statusCode || "未记录";
}

function riskLabel(riskLevel: string) {
  if (riskLevel === "high") {
    return "高";
  }
  if (riskLevel === "low") {
    return "低";
  }
  return "中";
}

function riskTone(riskLevel: string): Tone {
  if (riskLevel === "high") {
    return "critical";
  }
  if (riskLevel === "low") {
    return "neutral";
  }
  return "warning";
}

function moderationHref(targetType: string, targetId: string) {
  return `/moderation?selectedType=${encodeURIComponent(targetType)}&selectedId=${encodeURIComponent(targetId)}`;
}

function reportHref(reportId: string) {
  return `/reports?selected=${encodeURIComponent(reportId)}`;
}

function mediaTaskHref(taskId: string) {
  return `/media-tasks?selected=${encodeURIComponent(taskId)}`;
}

function userHref(userId: string) {
  return `/users?selected=${encodeURIComponent(userId)}`;
}

function MetricIcon({ icon }: { icon: Metric["icon"] }) {
  if (icon === "review") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 3.75l5 1.5v4.1c0 3.06-2.1 5.87-5 6.9-2.9-1.03-5-3.84-5-6.9v-4.1l5-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
        <path d="M8.2 9.95l1.2 1.2 2.5-2.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (icon === "report") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M5 4.25v11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        <path d="M5.5 4.75h7l-1.8 3 1.8 3h-7" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (icon === "comment") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M10 4c-3.45 0-6.25 2.2-6.25 4.92 0 1.44.8 2.73 2.09 3.63l-.59 2.45 2.74-1.3c.64.14 1.31.22 2.01.22 3.45 0 6.25-2.2 6.25-4.92C16.25 6.2 13.45 4 10 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (icon === "media") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="11" x="4.5" y="5.5" />
        <path d="M8.5 8l3.5 2-3.5 2V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (icon === "content") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M6 3.75h5l3 3v9.5H6V3.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
        <path d="M11 3.75v3h3" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="6.25" r="2.75" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 15.25c.64-2.18 2.54-3.5 5-3.5s4.36 1.32 5 3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function RowTypeIcon({ type }: { type: QueueRow["type"] }) {
  if (type === "工作流") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <circle cx="6" cy="6" fill="currentColor" r="1.5" />
        <circle cx="14" cy="6" fill="currentColor" r="1.5" />
        <circle cx="10" cy="14" fill="currentColor" r="1.5" />
        <path d="M7.25 6h5.5M6.9 7.15L9.1 12.8M13.1 7.15L10.9 12.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    );
  }

  if (type === "帖子") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <path d="M6 4.25h8a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 14 15.75H6a1.5 1.5 0 0 1-1.5-1.5v-8.5A1.5 1.5 0 0 1 6 4.25Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.25 8h5.5M7.25 11h3.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "图片提示词") {
    return (
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        <rect height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="11.5" x="4.25" y="4.75" />
        <path d="M6.25 12l2.3-2.3 2.15 2.15 2.9-3.4 1.65 1.95" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" width="11" x="4.5" y="5.5" />
      <path d="M8.5 8l3.5 2-3.5 2V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function PanelIcon({ icon }: { icon: AlertGroup["icon"] }) {
  if (icon === "report") {
    return <MetricIcon icon="report" />;
  }
  if (icon === "media") {
    return <MetricIcon icon="media" />;
  }
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 7v3.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="10" cy="13.4" fill="currentColor" r="1" />
    </svg>
  );
}

function QuickActionIcon({ icon }: { icon: QuickAction["icon"] }) {
  if (icon === "moderation") {
    return <MetricIcon icon="review" />;
  }
  if (icon === "report") {
    return <MetricIcon icon="report" />;
  }
  if (icon === "media") {
    return <MetricIcon icon="media" />;
  }
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M5 6.25h10M5 10h10M5 13.75h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="7.25" cy="6.25" fill="currentColor" r="1.15" />
      <circle cx="12.75" cy="10" fill="currentColor" r="1.15" />
      <circle cx="9" cy="13.75" fill="currentColor" r="1.15" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M8 5.5L12.5 10 8 14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function toneClass(tone: Tone) {
  if (tone === "positive") {
    return styles.tonePositive;
  }
  if (tone === "warning") {
    return styles.toneWarning;
  }
  if (tone === "critical") {
    return styles.toneCritical;
  }
  return styles.toneNeutral;
}

export default async function DashboardPage() {
  const session = await requireAdminAccess(["admin", "operator", "moderator"], "/dashboard");

  try {
    const response = await getAdminDashboardOverview();
    const overview = response.data;

    const metrics: readonly Metric[] = [
      {
        label: "待审核内容",
        value: overview.summary.pendingModerationCount.toLocaleString("en-US"),
        delta: "当前积压",
        icon: "review"
      },
      {
        label: "待处理举报",
        value: overview.summary.pendingReportCount.toLocaleString("en-US"),
        delta: "当前工单",
        icon: "report"
      },
      {
        label: "失败媒体任务",
        value: overview.summary.failedMediaTaskCount.toLocaleString("en-US"),
        delta: `可重试 ${overview.summary.retryableMediaTaskCount}`,
        icon: "media"
      },
      {
        label: "用户总数",
        value: overview.summary.totalUsers.toLocaleString("en-US"),
        delta: `非活跃 ${overview.summary.nonActiveUsers}`,
        icon: "user"
      },
      {
        label: "后台账号",
        value: overview.summary.backendRoleUsers.toLocaleString("en-US"),
        delta: "管理员 / 运营 / 审核",
        icon: "content"
      },
      {
        label: "风险聚焦",
        value: (overview.summary.pendingModerationCount + overview.summary.pendingReportCount + overview.summary.failedMediaTaskCount).toLocaleString("en-US"),
        delta: "审核 + 举报 + 媒体异常",
        icon: "comment"
      }
    ];

    const queueRows: readonly QueueRow[] = overview.moderationQueue.map((row) => ({
      id: `${row.targetType}-${row.targetId}`,
      targetTypeCode: row.targetType,
      type: targetTypeLabel(row.targetType),
      title: row.title,
      author: row.authorDisplayName,
      submittedAt: formatDateTime(row.submittedAt),
      status: statusLabel(row.statusCode),
      statusTone: row.statusCode === "in_review" ? "positive" : "warning",
      risk: riskLabel(row.riskLevel),
      riskTone: riskTone(row.riskLevel),
      href: moderationHref(row.targetType, row.targetId)
    }));

    const alertGroups: readonly AlertGroup[] = [
      {
        title: "最新举报",
        icon: "report",
        href: "/reports",
        items: overview.latestReports.map((item) => ({
          title: item.targetTitle,
          detail: `${item.reporterDisplayName} · ${statusLabel(item.statusCode)} · ${riskLabel(item.riskLevel)}风险`,
          time: formatDateTime(item.createdAt),
          href: reportHref(item.reportId)
        }))
      },
      {
        title: "失败任务",
        icon: "media",
        href: "/media-tasks",
        items: overview.failedMediaTasks.map((item) => ({
          title: item.targetTitle,
          detail: `${item.targetAuthorDisplayName} · ${summarizeMediaTaskError(item.errorMessage)} · 重试 ${item.retryCount}/${item.maxRetryCount}`,
          time: formatDateTime(item.createdAt),
          href: mediaTaskHref(item.taskId)
        }))
      },
      {
        title: "账号关注",
        icon: "manual",
        href: "/users",
        items: overview.userWatchItems.map((item) => ({
          title: item.displayName,
          detail: `${statusLabel(item.statusCode)} · 命中举报 ${item.openReportsAgainstUser} · 待处理工单 ${item.assignedOpenTickets}`,
          time: item.lastLoginAt ? formatDateTime(item.lastLoginAt) : "未登录",
          href: userHref(item.userId)
        }))
      }
    ];

    const quickActions = [
      {
        title: "进入内容审核",
        description: "处理待审核内容",
        href: "/moderation",
        icon: "moderation"
      },
      {
        title: "查看举报工单",
        description: "处理用户举报",
        href: "/reports",
        icon: "report"
      },
      {
        title: "配置首页排序",
        description: "调整首页内容排序",
        href: "/feed-ops/home",
        icon: "layout"
      },
      {
        title: "查看媒体失败任务",
        description: "处理失败的媒体任务",
        href: "/media-tasks",
        icon: "media"
      }
    ].filter((item) => {
      if (session.role === "operator") {
        return item.href !== "/moderation" && item.href !== "/reports";
      }
      if (session.role === "moderator") {
        return item.href !== "/feed-ops/home";
      }
      return true;
    }) as readonly QuickAction[];

    const systemServices = [
      { label: "审核池", status: overview.summary.pendingModerationCount > 0 ? "有积压" : "正常", tone: overview.summary.pendingModerationCount > 0 ? "warning" : "positive" },
      { label: "举报池", status: overview.summary.pendingReportCount > 0 ? "有积压" : "正常", tone: overview.summary.pendingReportCount > 0 ? "warning" : "positive" },
      { label: "媒体任务", status: overview.summary.failedMediaTaskCount > 0 ? "需处理" : "正常", tone: overview.summary.failedMediaTaskCount > 0 ? "critical" : "positive" },
      { label: "账号治理", status: overview.summary.nonActiveUsers > 0 ? "需关注" : "正常", tone: overview.summary.nonActiveUsers > 0 ? "warning" : "positive" }
    ] as const;

    return (
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>后台总览</h1>
        </header>

        <section className={styles.statsGrid}>
          {metrics.map((metric) => (
            <article key={metric.label} className={styles.metricCard}>
              <div className={styles.metricHead}>
                <span className={styles.metricIcon}>
                  <MetricIcon icon={metric.icon} />
                </span>
                <span>{metric.label}</span>
              </div>
              <strong className={styles.metricValue}>{metric.value}</strong>
              <span className={styles.metricDelta}>{metric.delta}</span>
            </article>
          ))}
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.primaryColumn}>
          <section className={`${styles.surface} ${styles.queueCard}`}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>待审核队列</h2>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>内容类型</th>
                    <th>标题</th>
                    <th>作者</th>
                    <th>提交时间</th>
                    <th>状态</th>
                    <th>风险提示</th>
                    <th aria-label="查看详情" />
                  </tr>
                </thead>
                <tbody>
                  {queueRows.length > 0 ? (
                    queueRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className={styles.typeCell}>
                            <span className={styles.typeIcon}>
                              <RowTypeIcon type={row.type} />
                            </span>
                            {row.type}
                          </span>
                        </td>
                        <td className={styles.titleCell}>{row.title}</td>
                        <td>{row.author}</td>
                        <td>{row.submittedAt}</td>
                        <td>
                          <span className={`${styles.pill} ${toneClass(row.statusTone)}`}>{row.status}</span>
                        </td>
                        <td>
                          <span className={`${styles.pill} ${toneClass(row.riskTone)}`}>{row.risk}</span>
                        </td>
                        <td className={styles.rowArrow}>
                          <Link className={styles.iconLink} href={row.href} aria-label="查看详情">
                            <ChevronRightIcon />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={styles.emptyRow} colSpan={7}>
                        当前没有待审核内容。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Link className={styles.fullWidthLink} href="/moderation">
              查看全部待审核内容
              <ChevronRightIcon />
            </Link>
          </section>

          <section className={`${styles.surface} ${styles.quickCard}`}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>快捷操作</h2>
            </header>

            <div className={styles.quickGrid}>
              {quickActions.map((action) => (
                <Link key={action.title} className={styles.quickAction} href={action.href}>
                  <span className={styles.quickActionIcon}>
                    <QuickActionIcon icon={action.icon} />
                  </span>
                  <span className={styles.quickActionBody}>
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </span>
                  <span className={styles.quickActionArrow}>
                    <ChevronRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          </section>
          </div>

          <aside className={`${styles.surface} ${styles.sideCard}`}>
            <div className={styles.sideSections}>
              {alertGroups.map((group) => (
                <section key={group.title} className={styles.sideSection}>
                  <div className={styles.sideSectionHeader}>
                    <div className={styles.sideSectionTitle}>
                      <span className={styles.sideSectionIcon}>
                        <PanelIcon icon={group.icon} />
                      </span>
                      <span>{group.title}</span>
                    </div>
                    <Link className={styles.inlineLink} href={group.href}>
                      查看全部
                    </Link>
                  </div>

                  <div className={styles.sideList}>
                    {group.items.length > 0 ? (
                      group.items.map((item) => (
                        <Link key={`${group.title}-${item.title}-${item.time}`} className={styles.sideItemLink} href={item.href}>
                          <article className={styles.sideItem}>
                            <div className={styles.sideItemTop}>
                              <strong>{item.title}</strong>
                              <span className={styles.sideItemTime}>{item.time}</span>
                            </div>
                            <p className={styles.sideItemMeta}>{item.detail}</p>
                          </article>
                        </Link>
                      ))
                    ) : (
                      <div className={styles.sideItemEmpty}>当前没有需要关注的记录。</div>
                    )}
                  </div>
                </section>
              ))}

              <section className={styles.sideSection}>
                <div className={styles.sideSectionHeader}>
                  <div className={styles.sideSectionTitle}>
                    <span className={styles.sideSectionIcon}>
                      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10 7v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                        <circle cx="10" cy="13.25" fill="currentColor" r="1" />
                      </svg>
                    </span>
                    <span>系统状态</span>
                  </div>
                  <div className={styles.statusHeadline}>
                    <span className={styles.statusHeadlineDot} />
                    实时
                  </div>
                </div>

                <div className={styles.systemGrid}>
                  {systemServices.map((service) => (
                    <div key={service.label} className={styles.systemItem}>
                      <span>{service.label}</span>
                      <span className={`${styles.systemState} ${toneClass(service.tone as Tone)}`}>
                        <span className={styles.systemDot} />
                        {service.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </section>
    );
  } catch (error) {
    const requestId =
      error instanceof AdminBackendError && error.requestId
        ? `requestId: ${error.requestId}`
        : "dashboard overview 查询异常";

    return (
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>后台总览</h1>
        </header>

        <section className={styles.surface}>
          <div className={styles.errorState}>
            <strong>总览接口暂时不可用</strong>
            <p>当前不再展示占位总览，请先检查 `apps/server` 最新进程与 `/api/admin/dashboard/overview`。</p>
            <span>{requestId}</span>
          </div>
        </section>
      </section>
    );
  }
}
