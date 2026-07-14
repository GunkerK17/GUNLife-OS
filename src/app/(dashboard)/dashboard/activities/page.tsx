import { ActivitiesClient } from "@/components/activities/activities-client";
import { getActivitiesPageData } from "@/lib/queries/activities";

type ActivitiesPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function ActivitiesPage({
  searchParams,
}: ActivitiesPageProps) {
  const data = await getActivitiesPageData(searchParams?.date);

  return (
    <ActivitiesClient
      selectedDate={data.selectedDate}
      initialLogs={data.logs}
      initialWeekLogs={data.weekLogs}
      initialMonthLogs={data.monthLogs}
      supabaseReady={data.supabaseReady}
    />
  );
}
