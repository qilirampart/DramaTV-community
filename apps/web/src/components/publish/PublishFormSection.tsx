import type { ReactNode } from "react";

type PublishFormSectionProps = {
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
};

export function PublishFormSection({
  title,
  description,
  eyebrow = "Publish Module",
  className,
  children
}: PublishFormSectionProps) {
  return (
    <section className={["publish-section", className].filter(Boolean).join(" ")}>
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p className="section-copy">{description}</p>
      {children}
    </section>
  );
}
