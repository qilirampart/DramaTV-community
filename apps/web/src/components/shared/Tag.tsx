type TagProps = {
  label: string;
  tone?: "default" | "highlight";
};

export function Tag({ label, tone = "default" }: TagProps) {
  return <span className={tone === "highlight" ? "tag tag-highlight" : "tag"}>{label}</span>;
}
