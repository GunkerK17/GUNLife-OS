import { JournalClient } from "@/components/journal/journal-client";
import { getJournalPageData } from "@/lib/queries/journal";

type JournalPageProps = {
  searchParams?: {
    date?: string;
  };
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const data = await getJournalPageData(searchParams?.date);

  return <JournalClient {...data} />;
}
