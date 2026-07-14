import { AiClient } from "@/components/ai/ai-client";
import { getAiPageData } from "@/lib/queries/ai";

export default async function AiPage() {
  const data = await getAiPageData();
  return <AiClient {...data} />;
}
