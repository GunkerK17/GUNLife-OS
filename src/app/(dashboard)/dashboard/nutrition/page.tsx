import { NutritionClient } from "@/components/nutrition/nutrition-client";
import { getNutritionPageData } from "@/lib/queries/nutrition";

type NutritionPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function NutritionPage({
  searchParams,
}: NutritionPageProps) {
  const data = await getNutritionPageData(searchParams?.date);

  return (
    <NutritionClient
      selectedDate={data.selectedDate}
      initialLogs={data.logs}
      initialWeekLogs={data.weekLogs}
      initialMonthLogs={data.monthLogs}
      supabaseReady={data.supabaseReady}
    />
  );
}
