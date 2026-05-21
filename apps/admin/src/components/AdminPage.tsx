import type { ReactNode } from "react";
import type { PanelNote } from "@/lib/admin-content";
import styles from "./AdminPage.module.css";

type AdminPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  notes?: readonly PanelNote[];
  actions?: ReactNode;
  children: ReactNode;
};

function toneClass(tone?: PanelNote["tone"]) {
  switch (tone) {
    case "positive":
      return styles.notePositive;
    case "warning":
      return styles.noteWarning;
    case "critical":
      return styles.noteCritical;
    default:
      return styles.noteNeutral;
  }
}

export function AdminPage({ eyebrow, title, description, notes, actions, children }: AdminPageProps) {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroBody}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>

      {notes?.length ? (
        <div className={styles.notes}>
          {notes.map((note) => (
            <div key={`${note.label}-${note.value}`} className={`${styles.noteCard} ${toneClass(note.tone)}`}>
              <span>{note.label}</span>
              <strong>{note.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.content}>{children}</div>
    </section>
  );
}
