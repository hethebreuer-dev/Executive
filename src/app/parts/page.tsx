import { listParts } from "@/lib/luft/parts";
import { PartsClient } from "./PartsClient";

// Re-read per request so newly-posted parts show without a redeploy.
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await listParts();
  return <PartsClient parts={parts} />;
}
