import { promises as fs } from "node:fs";
import path from "node:path";
import {
  NanoBananaReplicaPage,
  type NanoBananaReplicaItem,
  type NanoBananaReplicaStats
} from "@/features/nano-banana-replica/NanoBananaReplicaPage";

async function loadNanoBananaData(): Promise<{
  items: NanoBananaReplicaItem[];
  stats: NanoBananaReplicaStats;
}> {
  const filePath = path.join(process.cwd(), "public", "nano-banana-data.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as {
    items: NanoBananaReplicaItem[];
    stats: NanoBananaReplicaStats;
  };
}

export default async function InternalNanoBananaReplicaRoute() {
  const payload = await loadNanoBananaData();
  return <NanoBananaReplicaPage initialItems={payload.items} initialStats={payload.stats} />;
}
