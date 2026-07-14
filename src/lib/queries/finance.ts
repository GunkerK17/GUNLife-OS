import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoalRow,
  MonthlyBudgetRow,
  TransactionRow,
  WalletRow,
} from "@/lib/supabase/database.types";

export type FinancePageData = {
  selectedMonth: string;
  wallets: WalletRow[];
  transactions: TransactionRow[];
  budgets: MonthlyBudgetRow[];
  financeGoals: GoalRow[];
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

export function getBangkokMonthString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find(
    (part) => part.type === "month",
  )?.value}`;
}

function isValidMonth(value: string | undefined) {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function demoData(selectedMonth: string): FinancePageData {
  const [year, month] = selectedMonth.split("-").map(Number);
  const txDate = `${year}-${String(month).padStart(2, "0")}-05`;
  const cashWallet: WalletRow = {
    id: "demo-cash",
    user_id: "demo",
    name: "Tiền mặt",
    type: "cash",
    balance: 1200000,
    currency: "VND",
    color: "#34d399",
    icon: null,
    is_active: true,
    provider: null,
    account_last4: null,
    credit_limit: null,
    statement_day: null,
    due_day: null,
    goal_id: null,
    note: null,
    created_at: nowIso,
  };
  const bankWallet: WalletRow = {
    ...cashWallet,
    id: "demo-bank",
    name: "VCB chính",
    type: "bank",
    balance: 8500000,
    color: "#22d3ee",
    provider: "Vietcombank",
    account_last4: "2408",
  };
  const payLaterWallet: WalletRow = {
    ...cashWallet,
    id: "demo-paylater",
    name: "Ví trả sau",
    type: "credit",
    balance: 0,
    color: "#f59e0b",
    provider: "MoMo",
    credit_limit: 5000000,
    statement_day: 20,
    due_day: 28,
  };

  return {
    selectedMonth,
    wallets: [bankWallet, cashWallet, payLaterWallet],
    transactions: [
      {
        id: "demo-tx-1",
        user_id: "demo",
        wallet_id: bankWallet.id,
        destination_wallet_id: null,
        goal_id: null,
        tx_date: txDate,
        type: "expense",
        amount: 85000,
        category: "food",
        merchant: "Cơm trưa",
        note: null,
        receipt_url: null,
        transfer_group_id: null,
        created_at: nowIso,
      },
      {
        id: "demo-tx-2",
        user_id: "demo",
        wallet_id: payLaterWallet.id,
        destination_wallet_id: null,
        goal_id: null,
        tx_date: txDate,
        type: "expense",
        amount: 320000,
        category: "shopping",
        merchant: "Mua sắm",
        note: "Thanh toán vào cuối tháng",
        receipt_url: null,
        transfer_group_id: null,
        created_at: nowIso,
      },
    ],
    budgets: [
      {
        id: "demo-budget",
        user_id: "demo",
        category: "food",
        budget_amount: 3000000,
        month,
        year,
        created_at: nowIso,
      },
    ],
    financeGoals: [],
    supabaseReady: false,
  };
}

export async function getFinancePageData(
  requestedMonth?: string,
): Promise<FinancePageData> {
  const selectedMonth = isValidMonth(requestedMonth)
    ? requestedMonth!
    : getBangkokMonthString();
  const [year, month] = selectedMonth.split("-").map(Number);

  if (!hasSupabaseConfig()) {
    return demoData(selectedMonth);
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [walletsResult, transactionsResult, budgetsResult, goalsResult] =
    await Promise.all([
      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("tx_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", year)
        .eq("month", month)
        .order("category", { ascending: true }),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", "finance")
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false }),
    ]);

  return {
    selectedMonth,
    wallets: walletsResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    budgets: budgetsResult.data ?? [],
    financeGoals: goalsResult.data ?? [],
    supabaseReady: true,
  };
}
