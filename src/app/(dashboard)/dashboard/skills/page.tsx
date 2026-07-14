import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { setSkillTaskStatus } from "@/app/(dashboard)/dashboard/skills/actions";
import { Button } from "@/components/ui/button";
import { getSkillsPageData } from "@/lib/queries/skills";
import type { SkillWithTasks } from "@/lib/queries/skills";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { localizeGeneratedTaskDescription } from "@/lib/localize-generated-content";
import type { TaskStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type SkillsPageProps = {
  searchParams?: {
    date?: string;
  };
};

const skillsCopy = {
  en: {
    section: "Skills",
    title: "Practice tracker",
    subtitle:
      "Skills created from active Goals appear here. Delete a Goal and its linked practice plan disappears too.",
    createFromGoals: "Create from Goals",
    demo: "Demo mode: add Supabase environment variables to save skills.",
    skills: "skills",
    practiceToday: "practice on this day",
    fromGoals: "from active goals",
    selectedDay: "Selected day",
    openTimeline: "Open Timeline",
    minute: "min",
    openDay: "Open day",
    noPractice: "No practice on this day",
    noPracticeHint: "Create a learning goal to generate daily skill practice tasks.",
    skill: "Skill",
    controlledByGoal: "Controlled by Goal",
    standalone: "Standalone skill",
    fromGoal: "From Goal",
    done: "Done",
    rate: "Rate",
    skipped: "Skipped",
    pending: "Pending",
    skip: "Skip",
    openStudyDay: "Open study day",
  },
  vi: {
    section: "Kỹ năng",
    title: "Theo dõi luyện tập",
    subtitle:
      "Kỹ năng từ Mục tiêu đang hoạt động sẽ xuất hiện tại đây. Khi xóa Mục tiêu, kế hoạch luyện tập liên kết cũng được xóa.",
    createFromGoals: "Tạo từ Mục tiêu",
    demo: "Chế độ demo: thêm biến môi trường Supabase để lưu kỹ năng.",
    skills: "kỹ năng",
    practiceToday: "luyện tập trong ngày",
    fromGoals: "từ mục tiêu đang chạy",
    selectedDay: "Ngày đang xem",
    openTimeline: "Mở Lịch ngày",
    minute: "phút",
    openDay: "Mở nội dung ngày",
    noPractice: "Ngày này chưa có bài luyện tập",
    noPracticeHint: "Tạo mục tiêu học tập để hệ thống sinh bài luyện tập theo từng ngày.",
    skill: "Kỹ năng",
    controlledByGoal: "Do Mục tiêu quản lý",
    standalone: "Kỹ năng độc lập",
    fromGoal: "Từ Mục tiêu",
    done: "Xong",
    rate: "Tỷ lệ",
    skipped: "Đã bỏ qua",
    pending: "Đang chờ",
    skip: "Bỏ qua",
    openStudyDay: "Mở ngày học",
  },
} as const;

async function updateSkillStatus(formData: FormData) {
  "use server";

  const taskId = formData.get("taskId");
  const status = formData.get("status");

  if (
    typeof taskId !== "string" ||
    (status !== "done" && status !== "skipped" && status !== "pending")
  ) {
    return;
  }

  await setSkillTaskStatus(taskId, status);
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 max-w-full rounded-2xl border border-white/10 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_55px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

function formatDisplayDate(dateString: string, locale: Locale) {
  const date = new Date(`${dateString}T00:00:00+07:00`);

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function completion(skill: SkillWithTasks) {
  const done = skill.tasks.filter((task) => task.status === "done").length;
  const skipped = skill.tasks.filter((task) => task.status === "skipped").length;
  const total = skill.tasks.length || skill.target_days || 1;

  return {
    done,
    skipped,
    total,
    rate: Math.round((done / total) * 100),
  };
}

function StatusForm({
  labels,
  status,
  taskId,
}: {
  labels: Pick<(typeof skillsCopy)[Locale], "done" | "skip">;
  status: TaskStatus;
  taskId: string;
}) {
  return (
    <form action={updateSkillStatus}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        size="sm"
        variant={status === "done" ? "default" : "outline"}
        className={cn(
          "h-8 rounded-lg text-xs font-black",
          status === "done"
            ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/25"
            : "border-amber-300/20 bg-amber-400/10 text-amber-200",
        )}
      >
        {status === "done" ? (
          <Check className="mr-1 size-3" />
        ) : (
          <SkipForward className="mr-1 size-3" />
        )}
        {status === "done" ? labels.done : labels.skip}
      </Button>
    </form>
  );
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text = skillsCopy[locale];
  const data = await getSkillsPageData(searchParams?.date);
  const todayTasks = data.skills.flatMap((skill) =>
    skill.tasks
      .filter((task) => task.task_date === data.selectedDate)
      .map((task) => ({ skill, task })),
  );

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1460px] space-y-4 overflow-hidden pb-20 lg:pb-0">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden size-11 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/15 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)] sm:grid">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
              {text.section}
            </p>
            <h1 className="mt-1 text-[1.8rem] font-black leading-none tracking-tight text-white sm:text-3xl">
              {text.title}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {text.subtitle}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/goals"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-5 text-sm font-black text-emerald-200"
        >
          {text.createFromGoals} <ArrowRight className="size-4" />
        </Link>
      </header>

      {!data.supabaseReady ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demo}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <GraduationCap className="size-5 text-cyan-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {data.skills.length}
          </p>
          <p className="text-xs text-slate-500">{text.skills}</p>
        </Panel>
        <Panel className="p-4">
          <Sparkles className="size-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {todayTasks.filter(({ task }) => task.status === "done").length}/
            {todayTasks.length}
          </p>
          <p className="text-xs text-slate-500">{text.practiceToday}</p>
        </Panel>
        <Panel className="p-4">
          <ArrowRight className="size-5 text-violet-300" />
          <p className="mt-3 text-2xl font-black text-white">
            {data.skills.filter((skill) => skill.linkedGoalId).length}
          </p>
          <p className="text-xs text-slate-500">{text.fromGoals}</p>
        </Panel>
      </div>

      <Panel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              {text.selectedDay}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              {formatDisplayDate(data.selectedDate, locale)}
            </h2>
          </div>
          <Link
            href={`/dashboard/timeline?date=${data.selectedDate}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-black text-cyan-200"
          >
            {text.openTimeline} <ArrowRight className="size-4" />
          </Link>
        </div>

        {todayTasks.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {todayTasks.map(({ skill, task }) => (
              <div
                key={task.id}
                className={cn(
                  "grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto]",
                  task.status === "done"
                    ? "border-emerald-300/25 bg-emerald-400/10"
                    : task.status === "skipped"
                      ? "border-amber-300/25 bg-amber-400/10"
                      : "border-white/10 bg-white/[0.03]",
                )}
              >
                <div>
                  <p className="font-black text-white">{skill.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {localizeGeneratedTaskDescription(task.description, locale)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {task.duration_min ?? 30} {text.minute} · {text[task.status]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/skills/task/${task.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-black text-cyan-200"
                  >
                    <BookOpen className="size-3" />
                    {text.openDay}
                  </Link>
                  <StatusForm taskId={task.id} status="done" labels={text} />
                  <StatusForm taskId={task.id} status="skipped" labels={text} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
            <GraduationCap className="mx-auto size-8 text-slate-500" />
            <p className="mt-3 font-black text-white">{text.noPractice}</p>
            <p className="mt-1 text-sm text-slate-400">
              {text.noPracticeHint}
            </p>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.skills.map((skill) => {
          const stats = completion(skill);
          const selectedTask =
            skill.tasks.find((task) => task.task_date === data.selectedDate) ??
            skill.tasks.find((task) => task.status === "pending") ??
            skill.tasks[0];

          return (
            <Panel key={skill.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                    {skill.category ?? text.skill}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {skill.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {skill.linkedGoalId ? text.controlledByGoal : text.standalone} ·{" "}
                    {skill.level}
                  </p>
                </div>
                {skill.linkedGoalId ? (
                  <Link
                    href="/dashboard/goals"
                    className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200"
                  >
                    {text.fromGoal}
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-xs text-slate-400">{text.done}</p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {stats.done}/{stats.total}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 p-3">
                  <p className="text-xs text-slate-400">{text.rate}</p>
                  <p className="mt-1 text-2xl font-black text-emerald-200">
                    {stats.rate}%
                  </p>
                </div>
                <div className="rounded-xl border border-amber-300/15 bg-amber-400/10 p-3">
                  <p className="text-xs text-slate-400">{text.skipped}</p>
                  <p className="mt-1 text-2xl font-black text-amber-200">
                    {stats.skipped}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#22c55e)]"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>

              {selectedTask ? (
                <Link
                  href={`/dashboard/skills/task/${selectedTask.id}`}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-black text-cyan-200"
                >
                  {text.openStudyDay} <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
