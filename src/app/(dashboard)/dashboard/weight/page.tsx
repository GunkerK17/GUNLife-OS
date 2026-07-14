import { WeightClient } from "@/components/weight/weight-client";
import { getWeightPageData } from "@/lib/queries/weight";

type WeightPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function WeightPage({ searchParams }: WeightPageProps) {
  const data = await getWeightPageData(searchParams?.date);

  return (
    <WeightClient
      selectedDate={data.selectedDate}
      initialLogs={data.logs}
      initialWeekLogs={data.weekLogs}
      initialMonthLogs={data.monthLogs}
      supabaseReady={data.supabaseReady}
    />
  );
}
