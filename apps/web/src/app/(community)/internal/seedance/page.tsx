import { promises as fs } from "node:fs";
import path from "node:path";
import {
  SeedanceReplicaPage,
  type SeedanceReplicaItem,
  type SeedanceReplicaStats
} from "@/features/seedance-replica/SeedanceReplicaPage";

async function loadSeedanceData(): Promise<{
  items: SeedanceReplicaItem[];
  stats: SeedanceReplicaStats;
}> {
  const filePath = path.join(process.cwd(), "public", "seedance-data.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as {
    items: SeedanceReplicaItem[];
    stats: SeedanceReplicaStats;
  };
}

export default async function InternalSeedanceReferenceRoute() {
  const payload = await loadSeedanceData();
  return <SeedanceReplicaPage initialItems={payload.items} initialStats={payload.stats} />;
}
