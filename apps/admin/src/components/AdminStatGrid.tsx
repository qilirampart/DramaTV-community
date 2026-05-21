import type { StatCard } from "@/lib/admin-content";
import styles from "./AdminPage.module.css";

type AdminStatGridProps = {
  stats: readonly StatCard[];
};

function toneClass(tone?: StatCard["tone"]) {
  switch (tone) {
    case "positive":
      return styles.statPositive;
    case "warning":
      return styles.statWarning;
    case "critical":
      return styles.statCritical;
    default:
      return styles.statNeutral;
  }
}

export function AdminStatGrid({ stats }: AdminStatGridProps) {
  return (
    <div className={styles.statGrid}>
      {stats.map((stat) => (
        <article key={stat.label} className={`${styles.statCard} ${toneClass(stat.tone)}`}>
          <span className={styles.statLabel}>{stat.label}</span>
          <strong className={styles.statValue}>{stat.value}</strong>
          <span className={styles.statDelta}>{stat.delta}</span>
          <p className={styles.statDetail}>{stat.detail}</p>
        </article>
      ))}
    </div>
  );
}
