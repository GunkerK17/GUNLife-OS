import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  GraduationCap,
  Link2,
  SkipForward,
  Target,
} from "lucide-react";
import {
  setSkillTaskStatus,
  updateSkillTaskDetails,
} from "@/app/(dashboard)/dashboard/skills/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSkillTaskDetailData } from "@/lib/queries/skills";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { localizeGeneratedTaskDescription } from "@/lib/localize-generated-content";
import { parseSkillTaskDetailNote } from "@/lib/skill-task-detail";
import type { TaskStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type SkillTaskPageProps = {
  params: {
    taskId: string;
  };
};

const taskCopy = {
  en: {
    back: "Back to Skills",
    section: "Skill day detail",
    day: "Day",
    of: "of",
    timeline: "Timeline",
    goal: "Goal",
    demo: "Demo mode: add Supabase environment variables to save lesson details.",
    lessonPlan: "Lesson plan",
    question: "What exactly will you learn on this day?",
    plan: "Plan for this day *",
    planPlaceholder: "Day 1: Learn 20 food words and record two minutes of speaking...",
    planHint: "This line is shown in Skills, Timeline, and the Goal roadmap.",
    lessonLink: "Lesson link",
    lessonPlaceholder: "https://youtube.com/... or lesson URL",
    duration: "Duration",
    notes: "Study notes / vocabulary",
    notesPlaceholder: "New words, grammar points, listening, reading, questions...",
    result: "Result / mistakes / reflection",
    resultPlaceholder: "I learned..., mistakes..., next time I should...",
    save: "Save lesson details",
    openLesson: "Open lesson",
    quickStatus: "Quick status",
    markDone: "Mark done",
    skipToday: "Skip this day",
    resetPending: "Reset to pending",
    context: "Context",
    skill: "Skill",
    minutes: "minutes",
    plannedTime: "Planned practice time",
    linkedGoal: "Linked Goal",
    goalContribution: "This lesson contributes to the linked goal's progress.",
    linkLogic: "How it connects",
    logicGoal: "Goal is the overview. Skill Day is where you write the lesson details.",
    logicSync: "Saving here updates Skills and the linked Timeline block.",
    done: "Done",
    skipped: "Skipped",
    pending: "Pending",
  },
  vi: {
    back: "Quay lại Kỹ năng",
    section: "Nội dung ngày học",
    day: "Ngày",
    of: "trên",
    timeline: "Lịch ngày",
    goal: "Mục tiêu",
    demo: "Chế độ demo: thêm biến môi trường Supabase để lưu nội dung bài học.",
    lessonPlan: "Kế hoạch bài học",
    question: "Ngày này bạn sẽ học chính xác nội dung gì?",
    plan: "Việc cần làm trong ngày *",
    planPlaceholder: "Ngày 1: Học 20 từ vựng chủ đề đồ ăn và ghi âm nói trong 2 phút...",
    planHint: "Nội dung này sẽ hiển thị trong Kỹ năng, Lịch ngày và lộ trình Mục tiêu.",
    lessonLink: "Link bài học",
    lessonPlaceholder: "https://youtube.com/... hoặc đường dẫn bài học",
    duration: "Thời lượng",
    notes: "Ghi chú học tập / từ vựng",
    notesPlaceholder: "Từ mới, ngữ pháp, bài nghe, bài đọc, câu hỏi...",
    result: "Kết quả / lỗi sai / tự đánh giá",
    resultPlaceholder: "Tôi đã học..., lỗi sai..., lần sau cần...",
    save: "Lưu nội dung bài học",
    openLesson: "Mở bài học",
    quickStatus: "Trạng thái nhanh",
    markDone: "Đánh dấu hoàn thành",
    skipToday: "Bỏ qua ngày này",
    resetPending: "Đặt lại đang chờ",
    context: "Thông tin liên kết",
    skill: "Kỹ năng",
    minutes: "phút",
    plannedTime: "Thời gian luyện tập dự kiến",
    linkedGoal: "Mục tiêu liên kết",
    goalContribution: "Bài học này được tính vào tiến độ của mục tiêu liên kết.",
    linkLogic: "Cách liên kết",
    logicGoal: "Mục tiêu là nơi xem tổng quan. Ngày học là nơi ghi nội dung cụ thể.",
    logicSync: "Lưu tại đây sẽ cập nhật Kỹ năng và block tương ứng trong Lịch ngày.",
    done: "Hoàn thành",
    skipped: "Đã bỏ qua",
    pending: "Đang chờ",
  },
} as const;

async function updateSkillStatus(formData: FormData) {
  "use server";

  const taskId = formData.get("task_id");
  const status = formData.get("status");

  if (
    typeof taskId !== "string" ||
    (status !== "done" && status !== "skipped" && status !== "pending")
  ) {
    return;
  }

  await setSkillTaskStatus(taskId, status);
}

async function saveTaskDetails(formData: FormData) {
  "use server";

  await updateSkillTaskDetails(formData);
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
        "lifeos-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-black text-slate-200">{children}</Label>;
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

function statusClasses(status: TaskStatus) {
  return status === "done"
    ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
    : status === "skipped"
      ? "border-amber-300/25 bg-amber-400/10 text-amber-200"
      : "border-white/10 bg-white/[0.04] text-slate-300";
}

function StatusForm({
  children,
  status,
  taskId,
}: {
  children: React.ReactNode;
  status: TaskStatus;
  taskId: string;
}) {
  return (
    <form action={updateSkillStatus}>
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={status === "done" ? "default" : "outline"}
        className={cn(
          "h-11 rounded-xl px-4 font-black",
          status === "done"
            ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/25"
            : status === "skipped"
              ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
              : "border-white/10 bg-slate-950/60 text-slate-300",
        )}
      >
        {children}
      </Button>
    </form>
  );
}

export default async function SkillTaskPage({ params }: SkillTaskPageProps) {
  const localeCookie = cookies().get("lifeos.locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const text = taskCopy[locale];
  const data = await getSkillTaskDetailData(params.taskId);
  const detail = parseSkillTaskDetailNote(data.task.note);
  const dayNumber = data.taskIndex + 1;
  const timelineHref = `/dashboard/timeline?date=${data.task.task_date}`;
  const skillsHref = `/dashboard/skills?date=${data.task.task_date}`;

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1380px] space-y-4 overflow-hidden pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href={skillsHref}
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-cyan-100"
          >
            <ArrowLeft className="size-4" />
            {text.back}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-400/15 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                {text.section}
              </p>
              <h1 className="mt-1 text-[1.8rem] font-black leading-none tracking-tight text-white sm:text-3xl">
                {text.day} {dayNumber}: {data.skill.name}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {formatDisplayDate(data.task.task_date, locale)} · {text.day} {dayNumber} {text.of}{" "}
                {data.totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={timelineHref}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-black text-cyan-200"
          >
            {text.timeline} <ArrowRight className="size-4" />
          </Link>
          {data.goal ? (
            <Link
              href="/dashboard/goals"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-black text-emerald-200"
            >
              {text.goal} <Target className="size-4" />
            </Link>
          ) : null}
        </div>
      </header>

      {!data.supabaseReady ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {text.demo}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="overflow-hidden">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(15,23,42,0.4)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                  {text.lessonPlan}
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {text.question}
                </h2>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-black uppercase",
                  statusClasses(data.task.status),
                )}
              >
                {text[data.task.status]}
              </span>
            </div>
          </div>

          <form action={saveTaskDetails} className="space-y-4 p-4">
            <input type="hidden" name="task_id" value={data.task.id} />

            <div className="grid gap-2">
              <FieldLabel>{text.plan}</FieldLabel>
              <Textarea
                name="description"
                required
                defaultValue={localizeGeneratedTaskDescription(data.task.description, locale)}
                placeholder={text.planPlaceholder}
                className="min-h-28 border-white/10 bg-slate-950/70 text-white"
              />
              <p className="text-[11px] text-slate-500">
                {text.planHint}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
              <div className="grid gap-2">
                <FieldLabel>{text.lessonLink}</FieldLabel>
                <Input
                  name="lesson_url"
                  defaultValue={detail.lessonUrl}
                  placeholder={text.lessonPlaceholder}
                  className="h-11 border-white/10 bg-slate-950/70 text-white"
                />
              </div>
              <div className="grid gap-2">
                <FieldLabel>{text.duration}</FieldLabel>
                <Input
                  name="duration_min"
                  type="number"
                  min="0"
                  max="1440"
                  defaultValue={data.task.duration_min ?? 30}
                  className="h-11 border-white/10 bg-slate-950/70 text-white"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel>{text.notes}</FieldLabel>
              <Textarea
                name="notes"
                defaultValue={detail.notes}
                placeholder={text.notesPlaceholder}
                className="min-h-36 border-white/10 bg-slate-950/70 text-white"
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel>{text.result}</FieldLabel>
              <Textarea
                name="result"
                defaultValue={detail.result}
                placeholder={text.resultPlaceholder}
                className="min-h-28 border-white/10 bg-slate-950/70 text-white"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-[linear-gradient(135deg,#22d3ee,#22c55e)] font-black text-slate-950 hover:opacity-90"
              >
                {text.save}
              </Button>
              {detail.lessonUrl ? (
                <a
                  href={detail.lessonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-black text-cyan-200"
                >
                  <ExternalLink className="size-4" />
                  {text.openLesson}
                </a>
              ) : null}
            </div>
          </form>
        </Panel>

        <aside className="space-y-4">
          <Panel className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
              {text.quickStatus}
            </p>
            <div className="mt-4 grid gap-2">
              <StatusForm taskId={data.task.id} status="done">
                <Check className="mr-2 size-4" />
                {text.markDone}
              </StatusForm>
              <StatusForm taskId={data.task.id} status="skipped">
                <SkipForward className="mr-2 size-4" />
                {text.skipToday}
              </StatusForm>
              <StatusForm taskId={data.task.id} status="pending">
                {text.resetPending}
              </StatusForm>
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
              {text.context}
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <BookOpen className="size-4 text-cyan-300" />
                  {data.skill.name}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {data.skill.level} · {data.skill.category ?? text.skill}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <CalendarDays className="size-4 text-emerald-300" />
                  {text.day} {dayNumber} / {data.totalTasks}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDisplayDate(data.task.task_date, locale)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Clock3 className="size-4 text-violet-300" />
                  {data.task.duration_min ?? 30} {text.minutes}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {text.plannedTime}
                </p>
              </div>
            </div>
          </Panel>

          {data.goal ? (
            <Panel className="p-4">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">
                {text.linkedGoal}
              </p>
              <h2 className="mt-2 text-lg font-black text-white">
                {data.goal.title}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {text.goalContribution}
              </p>
            </Panel>
          ) : null}

          <Panel className="p-4">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
              {text.linkLogic}
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              <p className="flex gap-2">
                <Link2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                {text.logicGoal}
              </p>
              <p className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                {text.logicSync}
              </p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
