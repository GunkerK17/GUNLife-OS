import { FinanceClient } from "@/components/finance/finance-client";
import { getFinancePageData } from "@/lib/queries/finance";

type FinancePageProps = {
  searchParams?: {
    action?: string;
    goal?: string;
    month?: string;
  };
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const data = await getFinancePageData(searchParams?.month);

  const initialAction =
    searchParams?.action === "save" || searchParams?.action === "withdraw"
      ? searchParams.action
      : null;

  return (
    <FinanceClient
      {...data}
      initialAction={initialAction}
      initialGoalId={searchParams?.goal ?? null}
    />
  );
}
