"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  MonthlyBudgetRow,
  TransactionRow,
  TransactionType,
  WalletRow,
  WalletType,
} from "@/lib/supabase/database.types";

export type FinanceActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const walletTypes = [
  "cash",
  "bank",
  "credit",
  "e-wallet",
  "investment",
] as const satisfies readonly WalletType[];

const transactionTypes = [
  "income",
  "expense",
  "transfer",
] as const satisfies readonly TransactionType[];

const optionalText = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.string().trim().optional(),
);

const optionalNumber = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    schema.optional(),
  );

const walletSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên tài khoản."),
    type: z.enum(walletTypes),
    balance: z.coerce.number().min(0, "Số dư đầu kỳ không thể âm."),
    currency: z.string().trim().min(3).max(3).default("VND"),
    provider: optionalText,
    account_last4: optionalText,
    credit_limit: optionalNumber(z.coerce.number().min(0)),
    statement_day: optionalNumber(z.coerce.number().int().min(1).max(28)),
    due_day: optionalNumber(z.coerce.number().int().min(1).max(28)),
    goal_id: optionalText,
    note: optionalText,
  })
  .superRefine((value, context) => {
    if (
      value.type === "credit" &&
      (!value.credit_limit || !value.statement_day || !value.due_day)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Ví trả sau cần hạn mức, ngày chốt sao kê và ngày thanh toán.",
        path: ["credit_limit"],
      });
    }
  });

const transactionSchema = z
  .object({
    tx_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(transactionTypes),
    wallet_id: z.string().uuid(),
    destination_wallet_id: optionalText,
    goal_id: optionalText,
    amount: z.coerce.number().positive("Số tiền phải lớn hơn 0."),
    category: z.string().trim().min(1, "Vui lòng chọn danh mục."),
    merchant: optionalText,
    note: optionalText,
  })
  .superRefine((value, context) => {
    if (value.type !== "transfer") {
      return;
    }

    if (!value.destination_wallet_id) {
      context.addIssue({
        code: "custom",
        message: "Vui lòng chọn tài khoản nhận.",
        path: ["destination_wallet_id"],
      });
    }

    if (value.destination_wallet_id === value.wallet_id) {
      context.addIssue({
        code: "custom",
        message: "Tài khoản gửi và nhận phải khác nhau.",
        path: ["destination_wallet_id"],
      });
    }
  });

const budgetSchema = z.object({
  category: z.string().trim().min(1),
  budget_amount: z.coerce.number().positive("Ngân sách phải lớn hơn 0."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2200),
});

async function getAuthedSupabase() {
  if (!hasSupabaseConfig()) {
    return { ok: false, error: "Supabase chưa được cấu hình." } as const;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập trước." } as const;
  }

  return { ok: true, supabase, user } as const;
}

function refreshFinance() {
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");
}

const walletColors: Record<WalletType, string> = {
  bank: "#22d3ee",
  cash: "#34d399",
  credit: "#f59e0b",
  "e-wallet": "#a78bfa",
  investment: "#fb7185",
};

async function applyGoalDelta({
  delta,
  goalId,
  supabase,
  userId,
}: {
  delta: number;
  goalId: string | null | undefined;
  supabase: ReturnType<typeof createSupabaseServerClient>;
  userId: string;
}) {
  if (!goalId) {
    return;
  }

  const { data: goal } = await supabase
    .from("goals")
    .select("id,current_value")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!goal) {
    return;
  }

  await supabase
    .from("goals")
    .update({ current_value: Math.max(0, (goal.current_value ?? 0) + delta) })
    .eq("id", goal.id)
    .eq("user_id", userId);
}

function goalDelta(type: TransactionType, amount: number) {
  if (type === "expense") {
    return -amount;
  }

  return amount;
}

export async function createWallet(
  formData: FormData,
): Promise<FinanceActionResult<{ wallet: WalletRow }>> {
  const parsed = walletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance") || 0,
    currency: formData.get("currency") || "VND",
    provider: formData.get("provider"),
    account_last4: formData.get("account_last4"),
    credit_limit: formData.get("credit_limit"),
    statement_day: formData.get("statement_day"),
    due_day: formData.get("due_day"),
    goal_id: formData.get("goal_id"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("wallets")
    .insert({
      ...parsed.data,
      user_id: auth.user.id,
      color: walletColors[parsed.data.type],
      icon: parsed.data.type,
      goal_id: parsed.data.goal_id || null,
      provider: parsed.data.provider ?? null,
      account_last4: parsed.data.account_last4?.slice(-4) ?? null,
      credit_limit: parsed.data.credit_limit ?? null,
      statement_day: parsed.data.statement_day ?? null,
      due_day: parsed.data.due_day ?? null,
      note: parsed.data.note ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message.includes("credit_limit") ||
        error?.message.includes("provider")
          ? "Hãy chạy migration 008_finance_management.sql trước."
          : error?.message ?? "Không thể tạo tài khoản.",
    };
  }

  refreshFinance();
  return { ok: true, data: { wallet: data } };
}

export async function updateWallet(
  formData: FormData,
): Promise<FinanceActionResult<{ wallet: WalletRow }>> {
  const walletId = z.string().uuid().safeParse(formData.get("id"));
  const parsed = walletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance") || 0,
    currency: formData.get("currency") || "VND",
    provider: formData.get("provider"),
    account_last4: formData.get("account_last4"),
    credit_limit: formData.get("credit_limit"),
    statement_day: formData.get("statement_day"),
    due_day: formData.get("due_day"),
    goal_id: formData.get("goal_id"),
    note: formData.get("note"),
  });

  if (!walletId.success || !parsed.success) {
    return {
      ok: false,
      error: parsed.success
        ? "Tài khoản không hợp lệ."
        : parsed.error.issues[0].message,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("wallets")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      balance: parsed.data.balance,
      currency: parsed.data.currency,
      color: walletColors[parsed.data.type],
      icon: parsed.data.type,
      provider: parsed.data.provider ?? null,
      account_last4: parsed.data.account_last4?.slice(-4) ?? null,
      credit_limit:
        parsed.data.type === "credit"
          ? (parsed.data.credit_limit ?? null)
          : null,
      statement_day:
        parsed.data.type === "credit"
          ? (parsed.data.statement_day ?? null)
          : null,
      due_day:
        parsed.data.type === "credit" ? (parsed.data.due_day ?? null) : null,
      goal_id: parsed.data.goal_id ?? null,
      note: parsed.data.note ?? null,
    })
    .eq("id", walletId.data)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Không thể sửa tài khoản." };
  }

  refreshFinance();
  return { ok: true, data: { wallet: data } };
}

export async function archiveWallet(
  walletId: string,
): Promise<FinanceActionResult<{ walletId: string }>> {
  const parsed = z.string().uuid().safeParse(walletId);
  if (!parsed.success) {
    return { ok: false, error: "Tài khoản không hợp lệ." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("wallets")
    .update({ is_active: false })
    .eq("id", parsed.data)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshFinance();
  return { ok: true, data: { walletId: parsed.data } };
}

export async function createFinanceTransaction(
  formData: FormData,
): Promise<FinanceActionResult<{ transaction: TransactionRow }>> {
  const parsed = transactionSchema.safeParse({
    tx_date: formData.get("tx_date"),
    type: formData.get("type"),
    wallet_id: formData.get("wallet_id"),
    destination_wallet_id: formData.get("destination_wallet_id"),
    goal_id: formData.get("goal_id"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    merchant: formData.get("merchant"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const walletIds = [
    parsed.data.wallet_id,
    parsed.data.destination_wallet_id,
  ].filter(Boolean) as string[];
  const { data: ownedWallets, error: walletError } = await auth.supabase
    .from("wallets")
    .select("id,goal_id")
    .eq("user_id", auth.user.id)
    .in("id", walletIds);

  if (walletError || (ownedWallets?.length ?? 0) !== walletIds.length) {
    return { ok: false, error: "Tài khoản gửi hoặc nhận không hợp lệ." };
  }

  const destinationWallet = ownedWallets?.find(
    (wallet) => wallet.id === parsed.data.destination_wallet_id,
  );
  const sourceWallet = ownedWallets?.find(
    (wallet) => wallet.id === parsed.data.wallet_id,
  );
  const effectiveGoalId =
    parsed.data.goal_id ??
    destinationWallet?.goal_id ??
    (parsed.data.type === "expense" || parsed.data.type === "income"
      ? sourceWallet?.goal_id
      : null) ??
    null;
  const transferGroupId =
    parsed.data.type === "transfer" ? crypto.randomUUID() : null;
  const { data, error } = await auth.supabase
    .from("transactions")
    .insert({
      user_id: auth.user.id,
      tx_date: parsed.data.tx_date,
      type: parsed.data.type,
      wallet_id: parsed.data.wallet_id,
      destination_wallet_id: parsed.data.destination_wallet_id ?? null,
      goal_id: effectiveGoalId,
      amount: parsed.data.amount,
      category:
        parsed.data.type === "transfer" ? "transfer" : parsed.data.category,
      merchant: parsed.data.merchant ?? null,
      note: parsed.data.note ?? null,
      receipt_url: null,
      transfer_group_id: transferGroupId,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message.includes("destination_wallet_id") ||
        error?.message.includes("merchant")
          ? "Hãy chạy migration 008_finance_management.sql trước."
          : error?.message ?? "Không thể lưu giao dịch.",
    };
  }

  await applyGoalDelta({
    delta: goalDelta(parsed.data.type, parsed.data.amount),
    goalId: effectiveGoalId,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  refreshFinance();
  return { ok: true, data: { transaction: data } };
}

export async function updateFinanceTransaction(
  formData: FormData,
): Promise<FinanceActionResult<{ transaction: TransactionRow }>> {
  const transactionId = z.string().uuid().safeParse(formData.get("id"));
  const parsed = transactionSchema.safeParse({
    tx_date: formData.get("tx_date"),
    type: formData.get("type"),
    wallet_id: formData.get("wallet_id"),
    destination_wallet_id: formData.get("destination_wallet_id"),
    goal_id: formData.get("goal_id"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    merchant: formData.get("merchant"),
    note: formData.get("note"),
  });

  if (!transactionId.success || !parsed.success) {
    return {
      ok: false,
      error: parsed.success
        ? "Giao dịch không hợp lệ."
        : parsed.error.issues[0].message,
    };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: previousTransaction, error: previousError } =
    await auth.supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId.data)
      .eq("user_id", auth.user.id)
      .single();

  if (previousError || !previousTransaction) {
    return { ok: false, error: "Không tìm thấy giao dịch." };
  }

  const walletIds = [
    parsed.data.wallet_id,
    parsed.data.destination_wallet_id,
  ].filter(Boolean) as string[];
  const { data: ownedWallets, error: walletError } = await auth.supabase
    .from("wallets")
    .select("id,goal_id")
    .eq("user_id", auth.user.id)
    .in("id", walletIds);

  if (walletError || (ownedWallets?.length ?? 0) !== walletIds.length) {
    return { ok: false, error: "Tài khoản gửi hoặc nhận không hợp lệ." };
  }

  const destinationWallet = ownedWallets?.find(
    (wallet) => wallet.id === parsed.data.destination_wallet_id,
  );
  const sourceWallet = ownedWallets?.find(
    (wallet) => wallet.id === parsed.data.wallet_id,
  );
  const effectiveGoalId =
    parsed.data.goal_id ??
    destinationWallet?.goal_id ??
    (parsed.data.type === "expense" || parsed.data.type === "income"
      ? sourceWallet?.goal_id
      : null) ??
    null;
  const { data, error } = await auth.supabase
    .from("transactions")
    .update({
      tx_date: parsed.data.tx_date,
      type: parsed.data.type,
      wallet_id: parsed.data.wallet_id,
      destination_wallet_id: parsed.data.destination_wallet_id ?? null,
      goal_id: effectiveGoalId,
      amount: parsed.data.amount,
      category:
        parsed.data.type === "transfer" ? "transfer" : parsed.data.category,
      merchant: parsed.data.merchant ?? null,
      note: parsed.data.note ?? null,
      transfer_group_id:
        parsed.data.type === "transfer"
          ? previousTransaction.transfer_group_id ?? crypto.randomUUID()
          : null,
    })
    .eq("id", transactionId.data)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Không thể sửa giao dịch." };
  }

  await applyGoalDelta({
    delta: -goalDelta(previousTransaction.type, previousTransaction.amount),
    goalId: previousTransaction.goal_id,
    supabase: auth.supabase,
    userId: auth.user.id,
  });
  await applyGoalDelta({
    delta: goalDelta(parsed.data.type, parsed.data.amount),
    goalId: effectiveGoalId,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  refreshFinance();
  return { ok: true, data: { transaction: data } };
}

export async function deleteFinanceTransaction(
  transactionId: string,
): Promise<FinanceActionResult<{ transactionId: string }>> {
  const parsed = z.string().uuid().safeParse(transactionId);
  if (!parsed.success) {
    return { ok: false, error: "Giao dịch không hợp lệ." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: transaction, error: findError } = await auth.supabase
    .from("transactions")
    .select("*")
    .eq("id", parsed.data)
    .eq("user_id", auth.user.id)
    .single();

  if (findError || !transaction) {
    return { ok: false, error: "Không tìm thấy giao dịch." };
  }

  const { error } = await auth.supabase
    .from("transactions")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await applyGoalDelta({
    delta: -goalDelta(transaction.type, transaction.amount),
    goalId: transaction.goal_id,
    supabase: auth.supabase,
    userId: auth.user.id,
  });

  refreshFinance();
  return { ok: true, data: { transactionId: parsed.data } };
}

export async function upsertMonthlyBudget(
  formData: FormData,
): Promise<FinanceActionResult<{ budget: MonthlyBudgetRow }>> {
  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    budget_amount: formData.get("budget_amount"),
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("monthly_budgets")
    .upsert(
      {
        ...parsed.data,
        user_id: auth.user.id,
      },
      { onConflict: "user_id,category,month,year" },
    )
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Không thể lưu ngân sách." };
  }

  refreshFinance();
  return { ok: true, data: { budget: data } };
}
