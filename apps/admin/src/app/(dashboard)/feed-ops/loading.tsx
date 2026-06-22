import styles from "./shared/page.module.css";

export default function FeedOpsLoading() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>运营配置加载中</h1>
          <p className={styles.subtitle}>正在读取当前页面配置与已挂载内容</p>
        </div>
      </header>
      <div className={styles.layout}>
        <section className={styles.poolCard}>
          <div className={styles.cardHeader}>
            <h2>候选内容池</h2>
          </div>
          <div className={styles.emptyState}>正在初始化候选内容池...</div>
        </section>
        <section className={styles.workspaceCard}>
          <div className={styles.cardHeader}>
            <h2>编排工作区</h2>
          </div>
          <div className={styles.emptyState}>正在读取当前配置位...</div>
        </section>
        <aside className={styles.previewCard}>
          <div className={styles.cardHeader}>
            <h2>结构预览</h2>
          </div>
          <div className={styles.emptyState}>正在整理前台真实展示结果...</div>
        </aside>
      </div>
    </section>
  );
}
