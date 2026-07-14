import { WorkoutClient } from "@/components/workout/workout-client";
import { getWorkoutPageData } from "@/lib/queries/workout";

type WorkoutPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function WorkoutPage({ searchParams }: WorkoutPageProps) {
  const data = await getWorkoutPageData(searchParams?.date);

  return (
    <WorkoutClient
      selectedDate={data.selectedDate}
      initialPlans={data.plans}
      initialLogs={data.logs}
      initialWeekLogs={data.weekLogs}
      initialMonthLogs={data.monthLogs}
      supabaseReady={data.supabaseReady}
    />
  );
}
