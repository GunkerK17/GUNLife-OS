import { TimelineClient } from "@/components/timeline/timeline-client";
import { getTimelinePageData } from "@/lib/queries/timeline";

type TimelinePageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const timelineData = await getTimelinePageData(searchParams?.date);

  return (
    <TimelineClient
      key={timelineData.selectedDate}
      selectedDate={timelineData.selectedDate}
      initialLogs={timelineData.logs}
      initialTemplates={timelineData.templates}
      initialWorkoutPlans={timelineData.workoutPlans}
      generated={timelineData.generated}
      supabaseReady={timelineData.supabaseReady}
    />
  );
}
