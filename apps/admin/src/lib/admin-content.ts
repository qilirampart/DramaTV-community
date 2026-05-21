export type SurfaceTone = "neutral" | "positive" | "warning" | "critical";

export type StatCard = {
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone?: SurfaceTone;
};

export type TableColumn = {
  key: string;
  label: string;
};

export type TableRow = {
  id: string;
  [key: string]: string;
};

export type TimelineItem = {
  time: string;
  title: string;
  description: string;
};

export type PanelNote = {
  label: string;
  value: string;
  tone?: SurfaceTone;
};
