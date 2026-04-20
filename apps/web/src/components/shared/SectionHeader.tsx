import Link from "next/link";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  hrefLabel
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
        <p className="section-copy">{description}</p>
      </div>
      {href && hrefLabel ? (
        <Link className="section-link" href={href}>
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
