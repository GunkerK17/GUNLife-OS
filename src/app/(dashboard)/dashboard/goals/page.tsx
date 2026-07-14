import { GoalsClient } from "@/components/goals/goals-client";
import { getGoalsPageData } from "@/lib/queries/goals";

type GoalsPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const data = await getGoalsPageData(searchParams?.date);

  return (
    <GoalsClient
      selectedDate={data.selectedDate}
      initialGoals={data.goals}
      initialSkills={data.skills}
      supabaseReady={data.supabaseReady}
    />
  );
}
