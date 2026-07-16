"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingDown,
  WalletCards,
  X,
} from "lucide-react";
import {
  archiveWallet,
  createFinanceTransaction,
  createWallet,
  deleteFinanceTransaction,
  upsertMonthlyBudget,
  updateFinanceTransaction,
  updateWallet,
} from "@/app/(dashboard)/dashboard/finance/actions";
import { useI18n } from "@/components/providers/i18n-provider";
import { localizeActionError } from "@/lib/localize-action-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { FinancePageData } from "@/lib/queries/finance";
import type {
  TransactionRow,
  TransactionType,
  WalletRow,
  WalletType,
} from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type FinanceClientProps = FinancePageData & {
  initialAction?: "save" | "withdraw" | null;
  initialGoalId?: string | null;
};
type DialogType = "account" | "budget" | "transaction" | null;
type TransactionMode = TransactionType | "saving";

const walletTypes: Array<{ type: WalletType; vi: string; en: string }> = [
  { type: "bank", vi: "Ngân hàng", en: "Bank" },
  { type: "cash", vi: "Tiền mặt", en: "Cash" },
  { type: "e-wallet", vi: "Ví điện tử", en: "E-wallet" },
  { type: "credit", vi: "Thẻ / Ví trả sau", en: "Card / Pay later" },
  {
    type: "investment",
    vi: "Tiết kiệm / Đầu tư",
    en: "Savings / Investment",
  },
];

const categories = [
  { value: "food", vi: "Ăn uống", en: "Food" },
  { value: "transport", vi: "Di chuyển", en: "Transport" },
  { value: "shopping", vi: "Mua sắm", en: "Shopping" },
  { value: "bills", vi: "Hóa đơn", en: "Bills" },
  { value: "health", vi: "Sức khỏe", en: "Health" },
  { value: "education", vi: "Học tập", en: "Education" },
  { value: "entertainment", vi: "Giải trí", en: "Entertainment" },
  { value: "salary", vi: "Lương", en: "Salary" },
  { value: "freelance", vi: "Thu nhập thêm", en: "Side income" },
  { value: "saving", vi: "Tiết kiệm", en: "Savings" },
  { value: "other", vi: "Khác", en: "Other" },
];

const copy = {
  vi: {
    badge: "FINANCE OS",
    title: "Quản lý tài chính",
    subtitle: "Một nơi cho ngân hàng, ví điện tử, tiền mặt và ví trả sau.",
    addTransaction: "Thêm giao dịch",
    addAccount: "Thêm tài khoản",
    thisMonth: "Tháng này",
    netWorth: "Tài sản ròng",
    availableCash: "Tiền đang có",
    monthSpent: "Đã chi tháng này",
    payLaterDebt: "Nợ trả sau",
    income: "Thu",
    expense: "Chi",
    transfer: "Chuyển",
    saving: "Tiết kiệm",
    savingHint:
      "Chuyển vào ví đã gắn mục tiêu; tiến độ Goal sẽ tự tăng.",
    accounts: "Tài khoản & ví",
    accountHint: "Số dư được tính tự động từ toàn bộ giao dịch.",
    payLater: "Lịch trả sau",
    payLaterHint: "Ưu tiên các khoản gần đến hạn.",
    noDebt: "Chưa có ví trả sau hoặc không còn dư nợ.",
    savingsGoals: "Mục tiêu tiết kiệm",
    savingsGoalsHint:
      "Gắn Goal vào một ví, sau đó chuyển tiền vào ví đó.",
    saved: "đã góp",
    spendingTrend: "Dòng tiền theo ngày",
    trendHint: "Thu và chi trong tháng đang xem.",
    budgets: "Ngân sách",
    budgetHint: "Đặt hạn mức cho từng nhóm chi tiêu.",
    transactions: "Giao dịch gần đây",
    transactionsHint: "Chuyển tiền không được tính là chi tiêu.",
    all: "Tất cả",
    noTransactions: "Chưa có giao dịch trong tháng này.",
    smart: "Gợi ý thông minh",
    accountTitle: "Thêm tài khoản",
    editAccountTitle: "Sửa tài khoản",
    accountDescription:
      "Mỗi ngân hàng, ví hoặc nguồn tiền là một tài khoản riêng.",
    transactionTitle: "Ghi giao dịch",
    editTransactionTitle: "Sửa giao dịch",
    transactionDescription:
      "Chọn đúng nguồn tiền; LifeOS tự cập nhật số dư và báo cáo.",
    budgetTitle: "Đặt ngân sách tháng",
    budgetDescription: "Giới hạn một nhóm chi tiêu để tránh vượt tay.",
    save: "Lưu",
    name: "Tên tài khoản",
    provider: "Ngân hàng / nhà cung cấp",
    accountType: "Loại tài khoản",
    openingBalance: "Số dư ban đầu",
    openingDebt: "Dư nợ ban đầu",
    last4: "4 số cuối",
    creditLimit: "Hạn mức",
    statementDay: "Ngày chốt",
    dueDay: "Ngày thanh toán",
    linkedGoal: "Liên kết mục tiêu tiết kiệm",
    noGoal: "Không liên kết",
    note: "Ghi chú",
    date: "Ngày",
    amount: "Số tiền",
    source: "Từ tài khoản",
    destination: "Đến tài khoản",
    category: "Danh mục",
    merchant: "Nội dung / nơi chi",
    budgetAmount: "Hạn mức tháng",
    archive: "Ẩn tài khoản",
    available: "khả dụng",
    due: "thanh toán ngày",
    used: "đã dùng",
    spent: "đã chi",
    previousMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    demo: "Chế độ demo · kết nối Supabase để lưu dữ liệu tài chính.",
    goalLabel: "Mục tiêu",
    editTransactionAria: "Sửa giao dịch",
    deleteTransactionAria: "Xóa giao dịch",
    addBudgetAria: "Thêm ngân sách",
    providerPlaceholder: "Vietcombank, MoMo...",
    payLaterLabel: "Trả sau",
  },
  en: {
    badge: "FINANCE OS",
    title: "Money command center",
    subtitle: "One place for banks, e-wallets, cash and pay-later accounts.",
    addTransaction: "Add transaction",
    addAccount: "Add account",
    thisMonth: "This month",
    netWorth: "Net worth",
    availableCash: "Available cash",
    monthSpent: "Spent this month",
    payLaterDebt: "Pay-later debt",
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    saving: "Save",
    savingHint:
      "Transfer to a goal-linked wallet and Goal progress updates automatically.",
    accounts: "Accounts & wallets",
    accountHint: "Balances are calculated automatically from every transaction.",
    payLater: "Pay-later schedule",
    payLaterHint: "Prioritize bills closest to their due date.",
    noDebt: "No pay-later account or outstanding balance.",
    savingsGoals: "Savings goals",
    savingsGoalsHint: "Link a Goal to a wallet, then transfer money into it.",
    saved: "saved",
    spendingTrend: "Daily cash flow",
    trendHint: "Income and spending in the selected month.",
    budgets: "Budgets",
    budgetHint: "Set a limit for each spending group.",
    transactions: "Recent transactions",
    transactionsHint: "Transfers are excluded from spending.",
    all: "All",
    noTransactions: "No transactions in this month.",
    smart: "Smart insight",
    accountTitle: "Add account",
    editAccountTitle: "Edit account",
    accountDescription:
      "Treat each bank, wallet or source of money as a separate account.",
    transactionTitle: "Record transaction",
    editTransactionTitle: "Edit transaction",
    transactionDescription:
      "Choose the source and LifeOS updates balances and reports.",
    budgetTitle: "Set monthly budget",
    budgetDescription: "Cap one spending category before it gets out of hand.",
    save: "Save",
    name: "Account name",
    provider: "Bank / provider",
    accountType: "Account type",
    openingBalance: "Opening balance",
    openingDebt: "Opening debt",
    last4: "Last 4 digits",
    creditLimit: "Credit limit",
    statementDay: "Statement day",
    dueDay: "Due day",
    linkedGoal: "Linked savings goal",
    noGoal: "No link",
    note: "Note",
    date: "Date",
    amount: "Amount",
    source: "From account",
    destination: "To account",
    category: "Category",
    merchant: "Description / merchant",
    budgetAmount: "Monthly limit",
    archive: "Archive account",
    available: "available",
    due: "due on day",
    used: "used",
    spent: "spent",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    demo: "Demo mode · connect Supabase to save finance data.",
    goalLabel: "Goal",
    editTransactionAria: "Edit transaction",
    deleteTransactionAria: "Delete transaction",
    addBudgetAria: "Add budget",
    providerPlaceholder: "Vietcombank, MoMo...",
    payLaterLabel: "Pay later",
  },
} as const;

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "lifeos-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-200">{label}</Label>
      {children}
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-400/10";

function MoneyInput({
  defaultValue = 0,
  name,
  quick = true,
}: {
  defaultValue?: number;
  name: string;
  quick?: boolean;
}) {
  const [value, setValue] = useState(Math.max(0, Math.round(defaultValue)));
  const quickAmounts = [50000, 100000, 500000, 1000000];

  return (
    <div className="space-y-2">
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          inputMode="numeric"
          value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setValue(digits ? Number(digits) : 0);
          }}
          placeholder="0"
          className={cn(fieldClass, "pr-12 font-black")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
          ₫
        </span>
      </div>
      {quick ? (
        <div className="grid grid-cols-4 gap-1.5">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setValue((current) => current + amount)}
              className="h-8 rounded-lg border border-white/10 bg-white/[0.035] text-[10px] font-black text-slate-400 transition hover:border-cyan-300/25 hover:text-cyan-300"
            >
              +{amount >= 1000000 ? `${amount / 1000000}M` : `${amount / 1000}K`}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function walletIcon(type: WalletType) {
  if (type === "bank") return Landmark;
  if (type === "cash") return Banknote;
  if (type === "credit") return CreditCard;
  if (type === "investment") return PiggyBank;
  return WalletCards;
}

function walletMovement(walletId: string, transactions: TransactionRow[]) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "income" && transaction.wallet_id === walletId) {
      return total + transaction.amount;
    }
    if (transaction.type === "expense" && transaction.wallet_id === walletId) {
      return total - transaction.amount;
    }
    if (transaction.type === "transfer") {
      if (transaction.wallet_id === walletId) return total - transaction.amount;
      if (transaction.destination_wallet_id === walletId) {
        return total + transaction.amount;
      }
    }
    return total;
  }, 0);
}

function walletValue(wallet: WalletRow, transactions: TransactionRow[]) {
  const movement = walletMovement(wallet.id, transactions);
  return wallet.type === "credit"
    ? Math.max(0, wallet.balance - movement)
    : wallet.balance + movement;
}

function formatMoney(value: number, compact = false) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

function shiftMonth(monthString: string, amount: number) {
  const [year, month] = monthString.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthString: string, locale: "vi" | "en") {
  const [year, month] = monthString.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function categoryLabel(value: string, locale: "vi" | "en") {
  const category = categories.find((item) => item.value === value);
  return category?.[locale] ?? value;
}

function monthDateRange(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${monthString}-01`,
    end: `${monthString}-${String(lastDay).padStart(2, "0")}`,
    days: lastDay,
  };
}

function transactionIcon(type: TransactionType) {
  if (type === "income") return ArrowDownLeft;
  if (type === "expense") return ArrowUpRight;
  return ArrowLeftRight;
}

type FormCopy = (typeof copy)["vi"] | (typeof copy)["en"];

function TransactionForm({
  copyText,
  financeGoals,
  initialMode: requestedMode,
  initialTransaction,
  locale,
  onClose,
  preselectedGoalId,
  selectedMonth,
  wallets,
}: {
  copyText: FormCopy;
  financeGoals: FinancePageData["financeGoals"];
  initialMode?: TransactionMode | null;
  initialTransaction?: TransactionRow | null;
  locale: "vi" | "en";
  onClose: () => void;
  preselectedGoalId?: string | null;
  selectedMonth: string;
  wallets: WalletRow[];
}) {
  const router = useRouter();
  const initialMode: TransactionMode =
    initialTransaction?.type === "transfer" && initialTransaction.goal_id
      ? "saving"
      : initialTransaction?.type ?? requestedMode ?? "expense";
  const preselectedGoalWallet = wallets.find(
    (wallet) => wallet.goal_id === preselectedGoalId,
  );
  const initialSourceId =
    initialTransaction?.wallet_id ??
    (initialMode === "saving"
      ? wallets.find((wallet) => wallet.id !== preselectedGoalWallet?.id)?.id
      : preselectedGoalWallet?.id) ??
    wallets[0]?.id ??
    "";
  const [mode, setMode] = useState<TransactionMode>(initialMode);
  const [sourceId, setSourceId] = useState(initialSourceId);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isGoalWithdrawal =
    !initialTransaction &&
    requestedMode === "expense" &&
    Boolean(preselectedGoalId);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  const defaultDate =
    initialTransaction?.tx_date ??
    (today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`);
  const type: TransactionType = mode === "saving" ? "transfer" : mode;
  const isTransfer = type === "transfer";
  const destinationWallets =
    mode === "saving"
      ? wallets.filter(
          (wallet) =>
            wallet.id !== sourceId &&
            Boolean(wallet.goal_id),
        )
      : wallets.filter((wallet) => wallet.id !== sourceId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = initialTransaction
        ? await updateFinanceTransaction(formData)
        : await createFinanceTransaction(formData);
      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {initialTransaction ? (
        <input type="hidden" name="id" value={initialTransaction.id} />
      ) : null}
      <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-slate-950/70 p-1.5">
        {(["expense", "income", "transfer", "saving"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "h-10 rounded-lg px-1 text-[11px] font-black transition sm:text-xs",
              mode === item
                ? item === "expense"
                  ? "bg-rose-400/15 text-rose-300"
                  : item === "income"
                    ? "bg-emerald-400/15 text-emerald-300"
                    : item === "saving"
                      ? "bg-violet-400/15 text-violet-300"
                      : "bg-cyan-400/15 text-cyan-300"
                : "text-slate-500 hover:text-white",
            )}
          >
            {copyText[item]}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />
      {mode === "saving" ? (
        <p className="rounded-xl border border-violet-300/20 bg-violet-400/[0.07] px-3 py-2 text-xs leading-5 text-violet-200">
          {destinationWallets.length
            ? copyText.savingHint
            : locale === "vi"
              ? "Chưa có ví tiết kiệm. Hãy sửa một tài khoản và liên kết nó với Goal tài chính trước."
              : "No savings wallet yet. Edit an account and link it to a finance Goal first."}
        </p>
      ) : null}
      {isGoalWithdrawal && mode === "expense" ? (
        <p className="rounded-xl border border-rose-300/20 bg-rose-400/[0.07] px-3 py-2 text-xs leading-5 text-rose-100">
          {locale === "vi"
            ? "Đây là khoản rút khỏi quỹ mục tiêu. Lưu giao dịch sẽ làm số tiền đã tiết kiệm và phần trăm Goal giảm tương ứng."
            : "This withdraws money from the goal fund. Saving it reduces the saved amount and Goal percentage."}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copyText.date}>
          <Input
            type="date"
            name="tx_date"
            defaultValue={defaultDate}
            required
            className={fieldClass}
          />
        </Field>
        <Field label={copyText.amount}>
          <MoneyInput
            name="amount"
            defaultValue={initialTransaction?.amount ?? 0}
          />
        </Field>
      </div>

      <div
        className={cn("grid gap-3", isTransfer && "sm:grid-cols-2")}
      >
        <Field label={copyText.source}>
          <select
            name="wallet_id"
            required
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
            className={fieldClass}
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </Field>
        {isTransfer ? (
          <Field label={copyText.destination}>
            <select
              name="destination_wallet_id"
              required
              defaultValue={
                initialTransaction?.destination_wallet_id ??
                preselectedGoalWallet?.id ??
                ""
              }
              className={fieldClass}
            >
              <option value="" disabled>
                —
              </option>
              {destinationWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                  {wallet.goal_id ? " · Goal" : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {!isTransfer ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copyText.category}>
            <select
              name="category"
              className={fieldClass}
              required
              defaultValue={
                initialTransaction?.category ??
                (isGoalWithdrawal ? "saving" : "food")
              }
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category[locale]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copyText.merchant}>
            <Input
              name="merchant"
              defaultValue={initialTransaction?.merchant ?? ""}
              placeholder={
                isGoalWithdrawal
                  ? locale === "vi"
                    ? "Lý do rút tiền..."
                    : "Withdrawal reason..."
                  : locale === "vi"
                    ? "Grab, ăn trưa..."
                    : "Grab, lunch..."
              }
              className={fieldClass}
            />
          </Field>
        </div>
      ) : (
        <input type="hidden" name="category" value="transfer" />
      )}

      {financeGoals.length ? (
        <Field label={copyText.linkedGoal}>
          <select
            name="goal_id"
            className={fieldClass}
            defaultValue={
              initialTransaction?.goal_id ?? preselectedGoalId ?? ""
            }
          >
            <option value="">{copyText.noGoal}</option>
            {financeGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label={copyText.note}>
        <Textarea
          name="note"
          defaultValue={initialTransaction?.note ?? ""}
          className="min-h-20 rounded-xl border-white/10 bg-slate-950/80 text-white"
        />
      </Field>
      {error ? (
        <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={
          pending ||
          !wallets.length ||
          (mode === "saving" && !destinationWallets.length)
        }
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
      >
        {pending ? "..." : copyText.save}
      </Button>
    </form>
  );
}

function AccountForm({
  copyText,
  financeGoals,
  initialWallet,
  locale,
  onClose,
  preselectedGoalId,
}: {
  copyText: FormCopy;
  financeGoals: FinancePageData["financeGoals"];
  initialWallet?: WalletRow | null;
  locale: "vi" | "en";
  onClose: () => void;
  preselectedGoalId?: string | null;
}) {
  const router = useRouter();
  const [type, setType] = useState<WalletType>(
    initialWallet?.type ??
      (preselectedGoalId ? "investment" : "bank"),
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = initialWallet
        ? await updateWallet(formData)
        : await createWallet(formData);
      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {initialWallet ? (
        <input type="hidden" name="id" value={initialWallet.id} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={copyText.name}>
          <Input
            name="name"
            defaultValue={initialWallet?.name ?? ""}
            placeholder={
              type === "cash"
                ? locale === "vi"
                  ? "Ví tiền mặt"
                  : "Cash wallet"
                : locale === "vi"
                  ? "VCB chính"
                  : "Main bank"
            }
            required
            className={fieldClass}
          />
        </Field>
        <Field label={copyText.accountType}>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as WalletType)}
            className={fieldClass}
          >
            {walletTypes.map((walletType) => (
              <option key={walletType.type} value={walletType.type}>
                {walletType[locale]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {type !== "cash" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copyText.provider}>
            <Input
              name="provider"
              defaultValue={initialWallet?.provider ?? ""}
              placeholder={copyText.providerPlaceholder}
              className={fieldClass}
            />
          </Field>
          <Field label={copyText.last4}>
            <Input
              name="account_last4"
              defaultValue={initialWallet?.account_last4 ?? ""}
              maxLength={4}
              placeholder="2408"
              className={fieldClass}
            />
          </Field>
        </div>
      ) : null}
      <Field
        label={
          type === "credit"
            ? copyText.openingDebt
            : type === "cash"
              ? locale === "vi"
                ? "Tiền mặt hiện có"
                : "Cash on hand"
              : copyText.openingBalance
        }
      >
        <MoneyInput
          name="balance"
          defaultValue={initialWallet?.balance ?? 0}
        />
      </Field>
      <input type="hidden" name="currency" value="VND" />

      {type === "credit" ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
            <CreditCard className="size-4" />
            {copyText.payLaterLabel}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={copyText.creditLimit}>
              <MoneyInput
                name="credit_limit"
                defaultValue={initialWallet?.credit_limit ?? 0}
                quick={false}
              />
            </Field>
            <Field label={copyText.statementDay}>
              <Input
                type="number"
                name="statement_day"
                min="1"
                max="28"
                required
                defaultValue={initialWallet?.statement_day ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label={copyText.dueDay}>
              <Input
                type="number"
                name="due_day"
                min="1"
                max="28"
                required
                defaultValue={initialWallet?.due_day ?? ""}
                className={fieldClass}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {financeGoals.length ? (
        <Field label={copyText.linkedGoal}>
          <select
            name="goal_id"
            className={fieldClass}
            defaultValue={initialWallet?.goal_id ?? preselectedGoalId ?? ""}
          >
            <option value="">{copyText.noGoal}</option>
            {financeGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label={copyText.note}>
        <Textarea
          name="note"
          defaultValue={initialWallet?.note ?? ""}
          className="min-h-16 rounded-xl border-white/10 bg-slate-950/80 text-white"
        />
      </Field>
      {error ? (
        <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950"
      >
        {pending ? "..." : copyText.save}
      </Button>
    </form>
  );
}

function BudgetForm({
  copyText,
  locale,
  onClose,
  selectedMonth,
}: {
  copyText: FormCopy;
  locale: "vi" | "en";
  onClose: () => void;
  selectedMonth: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [year, month] = selectedMonth.split("-").map(Number);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await upsertMonthlyBudget(formData);
      if (!result.ok) {
        setError(localizeActionError(result.error, locale));
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="year" value={year} />
      <Field label={copyText.category}>
        <select name="category" className={fieldClass}>
          {categories
            .filter(
              (category) =>
                !["salary", "freelance", "saving"].includes(category.value),
            )
            .map((category) => (
              <option key={category.value} value={category.value}>
                {category[locale]}
              </option>
            ))}
        </select>
      </Field>
      <Field label={copyText.budgetAmount}>
        <MoneyInput name="budget_amount" />
      </Field>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-emerald-400 font-black text-slate-950 hover:bg-emerald-300"
      >
        {pending ? "..." : copyText.save}
      </Button>
    </form>
  );
}

export function FinanceClient({
  budgets,
  financeGoals,
  initialAction = null,
  initialGoalId = null,
  selectedMonth,
  supabaseReady,
  transactions,
  wallets,
}: FinanceClientProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const text = copy[locale];
  const [dialog, setDialog] = useState<DialogType>(
    initialAction ? "transaction" : null,
  );
  const [editingWallet, setEditingWallet] = useState<WalletRow | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow | null>(null);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);
  const [prefillAction, setPrefillAction] = useState(initialAction);
  const [prefillGoalId, setPrefillGoalId] = useState(initialGoalId);
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [busyId, setBusyId] = useState("");
  const [, startTransition] = useTransition();
  const range = monthDateRange(selectedMonth);
  const monthTransactions = transactions.filter(
    (transaction) =>
      transaction.tx_date >= range.start && transaction.tx_date <= range.end,
  );
  const activeWallets = wallets.filter((wallet) => wallet.is_active);
  const walletBalances = useMemo(
    () =>
      activeWallets.map((wallet) => ({
        wallet,
        value: walletValue(wallet, transactions),
      })),
    [activeWallets, transactions],
  );
  const assets = walletBalances
    .filter(({ wallet }) => wallet.type !== "credit")
    .reduce((total, item) => total + item.value, 0);
  const debt = walletBalances
    .filter(({ wallet }) => wallet.type === "credit")
    .reduce((total, item) => total + item.value, 0);
  const monthIncome = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const monthExpense = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const spendingByCategory = categories
    .map((category) => ({
      ...category,
      amount: monthTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.category === category.value,
        )
        .reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const dailyFlow = Array.from({ length: range.days }, (_, index) => {
    const day = index + 1;
    const date = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return {
      day,
      income: monthTransactions
        .filter((item) => item.tx_date === date && item.type === "income")
        .reduce((total, item) => total + item.amount, 0),
      expense: monthTransactions
        .filter((item) => item.tx_date === date && item.type === "expense")
        .reduce((total, item) => total + item.amount, 0),
    };
  });
  const maxDaily = Math.max(
    1,
    ...dailyFlow.flatMap((day) => [day.income, day.expense]),
  );
  const filteredTransactions = monthTransactions.filter(
    (transaction) => filter === "all" || transaction.type === filter,
  );
  const topCategory = spendingByCategory[0];
  const payLaterExpense = monthTransactions
    .filter((item) => {
      const wallet = wallets.find(
        (candidate) => candidate.id === item.wallet_id,
      );
      return item.type === "expense" && wallet?.type === "credit";
    })
    .reduce((total, item) => total + item.amount, 0);
  const payLaterShare = monthExpense
    ? Math.round((payLaterExpense / monthExpense) * 100)
    : 0;

  function navigateMonth(nextMonth: string) {
    router.push(`/dashboard/finance?month=${nextMonth}`);
  }

  function removeTransaction(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deleteFinanceTransaction(id);
      setBusyId("");
      router.refresh();
    });
  }

  function hideWallet(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await archiveWallet(id);
      setBusyId("");
      router.refresh();
    });
  }

  const summaryCards = [
    {
      label: text.netWorth,
      value: formatMoney(assets - debt, true),
      detail: `${text.availableCash}: ${formatMoney(assets, true)}`,
      icon: CircleDollarSign,
      accent: "text-emerald-300",
    },
    {
      label: text.monthSpent,
      value: formatMoney(monthExpense, true),
      detail: `${text.income}: ${formatMoney(monthIncome, true)}`,
      icon: TrendingDown,
      accent: "text-rose-300",
    },
    {
      label: text.payLaterDebt,
      value: formatMoney(debt, true),
      detail: `${payLaterShare}% ${
        locale === "vi" ? "chi tiêu tháng" : "of monthly spend"
      }`,
      icon: CreditCard,
      accent: "text-amber-300",
    },
    {
      label: locale === "vi" ? "Dòng tiền ròng" : "Net cash flow",
      value: formatMoney(monthIncome - monthExpense, true),
      detail: monthIncome >= monthExpense ? "On track" : "Needs attention",
      icon: ArrowLeftRight,
      accent:
        monthIncome >= monthExpense ? "text-cyan-300" : "text-amber-300",
    },
  ];

  return (
    <div className="min-w-0 w-full max-w-none space-y-4 overflow-hidden lg:-mt-[30px] lg:ml-[10px] lg:w-[calc(100%-10px)]">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-300">
            <WalletCards className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
              {text.badge}
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              {text.title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{text.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
            <button
              onClick={() => navigateMonth(shiftMonth(selectedMonth, -1))}
              className="grid h-full w-10 place-items-center text-slate-400 hover:bg-white/[0.06] hover:text-white"
              aria-label={text.previousMonth}
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex h-full min-w-36 items-center justify-center gap-2 border-x border-white/10 px-3 text-sm font-black text-white">
              <CalendarDays className="size-4 text-emerald-300" />
              {monthLabel(selectedMonth, locale)}
            </div>
            <button
              onClick={() => navigateMonth(shiftMonth(selectedMonth, 1))}
              className="grid h-full w-10 place-items-center text-slate-400 hover:bg-white/[0.06] hover:text-white"
              aria-label={text.nextMonth}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              navigateMonth(
                new Intl.DateTimeFormat("en-CA", {
                  year: "numeric",
                  month: "2-digit",
                  timeZone: "Asia/Bangkok",
                }).format(new Date()),
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-slate-300"
          >
            {text.thisMonth}
          </Button>
          <Button
            onClick={() => {
              setEditingWallet(null);
              setLinkingGoalId(null);
              setDialog("account");
            }}
            variant="ghost"
            className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-white"
          >
            <Plus className="mr-2 size-4" />
            {text.addAccount}
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setPrefillAction(null);
              setPrefillGoalId(null);
              setDialog("transaction");
            }}
            disabled={!activeWallets.length}
            className="h-11 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] px-4 font-black text-slate-950 hover:opacity-90"
          >
            <Plus className="mr-2 size-4" />
            {text.addTransaction}
          </Button>
        </div>
      </header>

      {!supabaseReady ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demo}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Panel key={card.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    {card.label}
                  </p>
                  <p className={cn("mt-2 text-2xl font-black", card.accent)}>
                    {card.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {card.detail}
                  </p>
                </div>
                <Icon className={cn("size-5", card.accent)} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]">
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="font-black text-white">{text.accounts}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {text.accountHint}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-400">
                {activeWallets.length}
              </span>
            </div>
            <div className="grid gap-2.5 p-3 md:grid-cols-2">
              {walletBalances.map(({ value, wallet }) => {
                const Icon = walletIcon(wallet.type);
                const isCredit = wallet.type === "credit";
                const linkedGoal = financeGoals.find(
                  (goal) => goal.id === wallet.goal_id,
                );
                const available = isCredit
                  ? Math.max(0, (wallet.credit_limit ?? 0) - value)
                  : value;
                return (
                  <div
                    key={wallet.id}
                    className="lifeos-subpanel group p-3 transition hover:border-emerald-300/25 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-xl border bg-slate-950/70"
                          style={{
                            borderColor: `${wallet.color ?? "#34d399"}55`,
                            color: wallet.color ?? "#34d399",
                          }}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {wallet.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {[
                              wallet.provider,
                              wallet.account_last4
                                ? `••${wallet.account_last4}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") ||
                              walletTypes.find(
                                (item) => item.type === wallet.type,
                              )?.[locale]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            setEditingWallet(wallet);
                            setLinkingGoalId(null);
                            setDialog("account");
                          }}
                          title={
                            locale === "vi"
                              ? "Sửa tài khoản"
                              : "Edit account"
                          }
                          className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => hideWallet(wallet.id)}
                          disabled={busyId === wallet.id}
                          title={text.archive}
                          className="grid size-8 place-items-center rounded-lg text-slate-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p
                          className={cn(
                            "text-xl font-black",
                            isCredit ? "text-amber-300" : "text-white",
                          )}
                        >
                          {formatMoney(value)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {isCredit
                            ? `${formatMoney(available, true)} ${text.available}`
                            : text.available}
                        </p>
                      </div>
                      {isCredit ? (
                        <p className="text-right text-[11px] text-amber-200/70">
                          {text.due} {wallet.due_day ?? "—"}
                        </p>
                      ) : null}
                    </div>
                    {linkedGoal ? (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-300/15 bg-violet-400/[0.06] px-2.5 py-2 text-[11px] font-bold text-violet-200">
                        <PiggyBank className="size-3.5" />
                        {text.goalLabel}: {linkedGoal.title}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!activeWallets.length ? (
                <button
                  onClick={() => setDialog("account")}
                  className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-slate-400 hover:border-emerald-300/25 hover:text-emerald-300"
                >
                  <Plus className="mx-auto mb-2 size-5" />
                  {text.addAccount}
                </button>
              ) : null}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-white">{text.spendingTrend}</h2>
                <p className="mt-1 text-xs text-slate-500">{text.trendHint}</p>
              </div>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <i className="size-2 rounded-full bg-emerald-300" />
                  {text.income}
                </span>
                <span className="flex items-center gap-1.5 text-rose-300">
                  <i className="size-2 rounded-full bg-rose-300" />
                  {text.expense}
                </span>
              </div>
            </div>
            <div className="mt-5 min-w-0 overflow-hidden pb-1">
              <div className="grid h-40 min-w-0 grid-cols-[repeat(31,minmax(0,1fr))] items-end gap-px rounded-xl border border-white/10 bg-slate-950/60 px-2 pt-4 sm:gap-1 sm:px-3">
                {dailyFlow.map((day) => (
                  <div
                    key={day.day}
                    className="group flex h-full min-w-0 flex-col justify-end"
                  >
                    <div className="relative flex flex-1 items-end justify-center gap-px">
                      <div
                        className="w-[42%] rounded-t-sm bg-emerald-400/70 transition group-hover:bg-emerald-300"
                        style={{
                          height: `${Math.max(
                            day.income ? 4 : 0,
                            (day.income / maxDaily) * 100,
                          )}%`,
                        }}
                        title={`${text.income}: ${formatMoney(day.income)}`}
                      />
                      <div
                        className="w-[42%] rounded-t-sm bg-rose-400/70 transition group-hover:bg-rose-300"
                        style={{
                          height: `${Math.max(
                            day.expense ? 4 : 0,
                            (day.expense / maxDaily) * 100,
                          )}%`,
                        }}
                        title={`${text.expense}: ${formatMoney(day.expense)}`}
                      />
                    </div>
                    <span
                      className={cn(
                        "h-6 pt-1 text-center text-[9px] text-slate-600",
                        day.day % 5 === 0 && "text-slate-400",
                      )}
                    >
                      {day.day % 5 === 0 ||
                      day.day === 1 ||
                      day.day === range.days
                        ? day.day
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <h2 className="font-black text-white">{text.savingsGoals}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {text.savingsGoalsHint}
              </p>
            </div>
            <div className="space-y-2 p-3">
              {financeGoals.map((goal) => {
                const linkedWallet = activeWallets.find(
                  (wallet) => wallet.goal_id === goal.id,
                );
                const goalPercent = goal.target_value
                  ? Math.min(
                      100,
                      Math.round(
                        ((goal.current_value ?? 0) / goal.target_value) * 100,
                      ),
                    )
                  : 0;
                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-violet-300/15 bg-violet-400/[0.05] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">
                          {goal.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {linkedWallet
                            ? linkedWallet.name
                            : locale === "vi"
                              ? "Chưa gắn ví"
                              : "No linked wallet"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-violet-300">
                        {goalPercent}%
                      </p>
                    </div>
                    <Progress
                      value={goalPercent}
                      className="mt-3 h-1.5 bg-white/[0.06]"
                    />
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        {formatMoney(goal.current_value ?? 0, true)} /{" "}
                        {formatMoney(goal.target_value ?? 0, true)} {text.saved}
                      </span>
                      {!linkedWallet ? (
                        <button
                          onClick={() => {
                            setEditingWallet(null);
                            setLinkingGoalId(goal.id);
                            setDialog("account");
                          }}
                          className="font-black text-cyan-300 hover:text-cyan-200"
                        >
                          {locale === "vi" ? "Gắn với ví →" : "Link a wallet →"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {!financeGoals.length ? (
                <button
                  onClick={() => router.push("/dashboard/goals")}
                  className="w-full rounded-xl border border-dashed border-white/10 p-5 text-sm font-bold text-slate-500 hover:border-violet-300/20 hover:text-violet-300"
                >
                  <PiggyBank className="mx-auto mb-2 size-5" />
                  {locale === "vi"
                    ? "Tạo Goal tài chính trước"
                    : "Create a finance Goal first"}
                </button>
              ) : null}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-white">{text.transactions}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {text.transactionsHint}
                </p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-slate-950/60 p-1">
                {(["all", "expense", "income", "transfer"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={cn(
                        "h-8 rounded-lg px-3 text-[11px] font-black transition",
                        filter === item
                          ? "bg-white/[0.08] text-white"
                          : "text-slate-500 hover:text-slate-300",
                      )}
                    >
                      {item === "all" ? text.all : text[item]}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredTransactions.slice(0, 12).map((transaction) => {
                const Icon = transactionIcon(transaction.type);
                const source = wallets.find(
                  (wallet) => wallet.id === transaction.wallet_id,
                );
                const destination = wallets.find(
                  (wallet) =>
                    wallet.id === transaction.destination_wallet_id,
                );
                return (
                  <div
                    key={transaction.id}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-white/[0.025]"
                  >
                    <div
                      className={cn(
                        "grid size-9 place-items-center rounded-xl border",
                        transaction.type === "income"
                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                          : transaction.type === "expense"
                            ? "border-rose-300/20 bg-rose-400/10 text-rose-300"
                            : "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {transaction.type === "transfer"
                          ? `${source?.name ?? "—"} → ${
                              destination?.name ?? "—"
                            }`
                          : transaction.merchant ||
                            categoryLabel(transaction.category, locale)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {transaction.tx_date} · {source?.name ?? "—"} ·{" "}
                        {categoryLabel(transaction.category, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-black",
                          transaction.type === "income"
                            ? "text-emerald-300"
                            : transaction.type === "expense"
                              ? "text-rose-300"
                              : "text-cyan-300",
                        )}
                      >
                        {transaction.type === "income"
                          ? "+"
                          : transaction.type === "expense"
                            ? "−"
                            : ""}
                        {formatMoney(transaction.amount)}
                      </p>
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setPrefillAction(null);
                          setPrefillGoalId(null);
                          setDialog("transaction");
                        }}
                        className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                        aria-label={text.editTransactionAria}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => removeTransaction(transaction.id)}
                        disabled={busyId === transaction.id}
                        className="grid size-8 place-items-center rounded-lg text-rose-400/65 transition hover:bg-rose-400/12 hover:text-rose-300 disabled:opacity-40"
                        aria-label={text.deleteTransactionAria}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {!filteredTransactions.length ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  <ReceiptText className="mx-auto mb-2 size-6" />
                  {text.noTransactions}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <h2 className="font-black text-white">{text.payLater}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {text.payLaterHint}
              </p>
            </div>
            <div className="space-y-2 p-3">
              {walletBalances
                .filter(
                  ({ wallet, value }) =>
                    wallet.type === "credit" && value > 0,
                )
                .map(({ value, wallet }) => {
                  const limit = wallet.credit_limit ?? 0;
                  const percent = limit
                    ? Math.min(100, (value / limit) * 100)
                    : 0;
                  return (
                    <div
                      key={wallet.id}
                      className="rounded-xl border border-amber-300/15 bg-amber-400/[0.05] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{wallet.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {wallet.provider || text.payLaterLabel} · {text.due}{" "}
                            {wallet.due_day ?? "—"}
                          </p>
                        </div>
                        <p className="text-sm font-black text-amber-300">
                          {formatMoney(value)}
                        </p>
                      </div>
                      <Progress
                        value={percent}
                        className="mt-3 h-1.5 bg-white/[0.06]"
                      />
                      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                        <span>
                          {Math.round(percent)}% {text.used}
                        </span>
                        <span>{formatMoney(limit, true)}</span>
                      </div>
                    </div>
                  );
                })}
              {!walletBalances.some(
                ({ wallet, value }) =>
                  wallet.type === "credit" && value > 0,
              ) ? (
                <p className="p-4 text-center text-sm text-slate-500">
                  {text.noDebt}
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h2 className="font-black text-white">{text.budgets}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {text.budgetHint}
                </p>
              </div>
              <button
                onClick={() => setDialog("budget")}
                className="grid size-9 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                aria-label={text.addBudgetAria}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              {budgets.map((budget) => {
                const spent =
                  spendingByCategory.find(
                    (item) => item.value === budget.category,
                  )?.amount ?? 0;
                const percent = budget.budget_amount
                  ? Math.round((spent / budget.budget_amount) * 100)
                  : 0;
                return (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-slate-300">
                        {categoryLabel(budget.category, locale)}
                      </span>
                      <span
                        className={cn(
                          "font-black",
                          percent > 100 ? "text-rose-300" : "text-slate-400",
                        )}
                      >
                        {formatMoney(spent, true)} /{" "}
                        {formatMoney(budget.budget_amount, true)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percent, 100)}
                      className="mt-2 h-2 bg-white/[0.06]"
                    />
                    <p className="mt-1 text-right text-[10px] text-slate-600">
                      {percent}% {text.spent}
                    </p>
                  </div>
                );
              })}
              {!budgets.length ? (
                <button
                  onClick={() => setDialog("budget")}
                  className="w-full rounded-xl border border-dashed border-white/10 p-5 text-sm font-bold text-slate-500 hover:border-emerald-300/20 hover:text-emerald-300"
                >
                  <Plus className="mx-auto mb-2 size-4" />
                  {text.budgetTitle}
                </button>
              ) : null}
            </div>
          </Panel>

          <Panel className="border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_45%),rgba(2,6,23,0.66)] p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="size-4" />
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                {text.smart}
              </p>
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-200">
              {topCategory
                ? locale === "vi"
                  ? `${topCategory.vi} đang là khoản chi lớn nhất (${formatMoney(
                      topCategory.amount,
                    )}). ${payLaterShare}% tổng chi đi qua ví trả sau.`
                  : `${topCategory.en} is your biggest category (${formatMoney(
                      topCategory.amount,
                    )}). ${payLaterShare}% of spending used pay later.`
                : locale === "vi"
                  ? "Chưa đủ giao dịch để phân tích thói quen tháng này."
                  : "Not enough transactions to analyze this month yet."}
            </p>
            {monthExpense > monthIncome && monthExpense > 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {locale === "vi"
                  ? `Chi đang cao hơn thu ${formatMoney(
                      monthExpense - monthIncome,
                    )}. Nên giảm nhóm chi lớn nhất hoặc đặt ngân sách.`
                  : `Spending exceeds income by ${formatMoney(
                      monthExpense - monthIncome,
                    )}. Reduce the top category or set a budget.`}
              </div>
            ) : null}
          </Panel>
        </div>
      </div>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setEditingWallet(null);
            setEditingTransaction(null);
            setLinkingGoalId(null);
            setPrefillAction(null);
            setPrefillGoalId(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border border-cyan-300/25 bg-[linear-gradient(145deg,#071423,#020617)] p-0 text-white sm:max-w-xl">
          <DialogHeader className="border-b border-white/10 bg-white/[0.035] p-5 pr-12">
            <DialogTitle className="text-xl font-black">
              {dialog === "account"
                ? editingWallet
                  ? text.editAccountTitle
                  : text.accountTitle
                : dialog === "budget"
                  ? text.budgetTitle
                  : editingTransaction
                    ? text.editTransactionTitle
                    : text.transactionTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {dialog === "account"
                ? text.accountDescription
                : dialog === "budget"
                  ? text.budgetDescription
                  : text.transactionDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            {dialog === "account" ? (
              <AccountForm
                copyText={text}
                financeGoals={financeGoals}
                initialWallet={editingWallet}
                locale={locale}
                preselectedGoalId={linkingGoalId}
                onClose={() => {
                  setDialog(null);
                  setEditingWallet(null);
                  setLinkingGoalId(null);
                }}
              />
            ) : null}
            {dialog === "transaction" ? (
              <TransactionForm
                copyText={text}
                financeGoals={financeGoals}
                initialMode={
                  prefillAction === "save"
                    ? "saving"
                    : prefillAction === "withdraw"
                      ? "expense"
                      : null
                }
                initialTransaction={editingTransaction}
                locale={locale}
                onClose={() => {
                  setDialog(null);
                  setEditingTransaction(null);
                  setPrefillAction(null);
                  setPrefillGoalId(null);
                }}
                preselectedGoalId={prefillGoalId}
                selectedMonth={selectedMonth}
                wallets={activeWallets}
              />
            ) : null}
            {dialog === "budget" ? (
              <BudgetForm
                copyText={text}
                locale={locale}
                onClose={() => setDialog(null)}
                selectedMonth={selectedMonth}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
