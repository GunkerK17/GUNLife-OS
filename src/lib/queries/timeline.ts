import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoalCategory,
  SkillDailyTaskRow,
  TaskStatus,
  TimelineCategory,
  TimelineLogRow,
  TimelineTemplateRow,
  WorkoutPlanRow,
} from "@/lib/supabase/database.types";

export type TimelinePageData = {
  selectedDate: string;
  logs: TimelineLogRow[];
  templates: TimelineTemplateRow[];
  workoutPlans: WorkoutPlanRow[];
  generated: boolean;
  supabaseReady: boolean;
};

type TimelineInsert = Partial<TimelineLogRow> & {
  user_id: string;
  log_date: string;
  title: string;
  category: TimelineCategory;
  status: TaskStatus;
};

function goalTimelineCategory(category: GoalCategory | undefined) {
  if (category === "health") {
    return "gym" as const;
  }

  if (category === "learning") {
    return "study" as const;
  }

  if (category === "career" || category === "finance") {
    return "work" as const;
  }

  return "other" as const;
}

function linkedGoalId(description: string | null) {
  return description?.match(/\[goal:([a-f0-9-]+)\]/i)?.[1] ?? null;
}

const demoLogs: TimelineLogRow[] = [
  {
    id: "demo-1",
    user_id: "demo",
    template_id: null,
    source_type: null,
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Morning Routine",
    category: "rest",
    start_time: "06:30",
    duration_min: 15,
    status: "done",
    note: "Meditation • 15 min",
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo",
    template_id: null,
    source_type: "workout_plan",
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Workout",
    category: "gym",
    start_time: "07:00",
    duration_min: 75,
    status: "done",
    note: "Upper Body Strength",
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo",
    template_id: null,
    source_type: null,
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Work / Study",
    category: "study",
    start_time: "08:30",
    duration_min: 120,
    status: "done",
    note: "Deep Work Session",
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    user_id: "demo",
    template_id: null,
    source_type: null,
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Review & Planning",
    category: "work",
    start_time: "10:30",
    duration_min: 45,
    status: "pending",
    note: "Review tasks and plan",
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    user_id: "demo",
    template_id: null,
    source_type: null,
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Lunch",
    category: "meal",
    start_time: "12:30",
    duration_min: 45,
    status: "done",
    note: "Healthy & Balanced",
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    user_id: "demo",
    template_id: null,
    source_type: null,
    source_id: null,
    log_date: getBangkokDateString(),
    title: "Project Work",
    category: "work",
    start_time: "14:00",
    duration_min: 120,
    status: "pending",
    note: "LifeOS Development",
    completed_at: null,
    created_at: new Date().toISOString(),
  },
];

export function getBangkokDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function isValidDateString(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getWeekday(dateString: string) {
  return new Date(`${dateString}T00:00:00+07:00`).getDay();
}

function includesWeekday(value: string | null | undefined, weekday: number) {
  if (!value) {
    return false;
  }

  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .includes(String(weekday));
}

function timeAt(hour: number, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function sortLogs(logs: TimelineLogRow[]) {
  return [...logs].sort((firstLog, secondLog) =>
    (firstLog.start_time ?? "99:99").localeCompare(
      secondLog.start_time ?? "99:99",
    ),
  );
}

async function generateTimelineLogsForDate(userId: string, dateString: string) {
  const supabase = createSupabaseServerClient();

  const [goalTasksResult, skillTasksResult] = await Promise.all([
    supabase
      .from("goal_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", dateString),
    supabase
      .from("skill_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", dateString),
  ]);

  if (goalTasksResult.error || skillTasksResult.error) {
    return [];
  }

  const goalTasks = goalTasksResult.data ?? [];
  const skillTasks = skillTasksResult.data ?? [];
  const goalIds = Array.from(
    new Set(goalTasks.map((task) => task.goal_id)),
  );
  const skillIds = Array.from(
    new Set(skillTasks.map((task) => task.skill_id)),
  );
  const [goalsResult, skillsResult] = await Promise.all([
    goalIds.length
      ? supabase
          .from("goals")
          .select("id,category")
          .eq("user_id", userId)
          .in("id", goalIds)
      : Promise.resolve({ data: [], error: null }),
    skillIds.length
      ? supabase
          .from("skills")
          .select("id,description")
          .eq("user_id", userId)
          .in("id", skillIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const goalCategoryById = new Map(
    (goalsResult.data ?? []).map((goal) => [goal.id, goal.category]),
  );
  const skills = skillsResult.data ?? [];
  const linkedGoalIds = skills
    .map((skill) => linkedGoalId(skill.description))
    .filter((goalId): goalId is string => Boolean(goalId));
  const linkedGoalsResult = linkedGoalIds.length
    ? await supabase
        .from("goals")
        .select("id,category")
        .eq("user_id", userId)
        .in("id", linkedGoalIds)
    : { data: [], error: null };
  const linkedGoalCategoryById = new Map(
    (linkedGoalsResult.data ?? []).map((goal) => [goal.id, goal.category]),
  );
  const validSkillIds = new Set(
    skills
      .filter((skill) => {
        const goalId = linkedGoalId(skill.description);
        return !goalId || linkedGoalCategoryById.get(goalId) === "learning";
      })
      .map((skill) => skill.id),
  );

  const linkedLearningGoalIds = new Set(
    skills
      .filter((skill) => validSkillIds.has(skill.id))
      .map((skill) => linkedGoalId(skill.description))
      .filter((goalId): goalId is string => Boolean(goalId)),
  );

  const goalLogs: TimelineInsert[] = goalTasks
    .filter((task) => !linkedLearningGoalIds.has(task.goal_id))
    .map((task, index) => ({
      user_id: userId,
      template_id: null,
      source_type: "goal_daily_task",
      source_id: task.id,
      log_date: dateString,
      title: task.description,
      category: goalTimelineCategory(goalCategoryById.get(task.goal_id)),
      start_time: timeAt(14 + Math.floor(index / 2), index % 2 === 0 ? 0 : 30),
      duration_min: 45,
      status: task.status,
      note: "Goal daily task",
    }));

  const skillLogs: TimelineInsert[] = skillTasks
    .filter((task) => validSkillIds.has(task.skill_id))
    .map(
    (task: SkillDailyTaskRow, index) => ({
      user_id: userId,
      template_id: null,
      source_type: "skill_daily_task",
      source_id: task.id,
      log_date: dateString,
      title: task.description,
      category: "study",
      start_time: timeAt(20 + Math.floor(index / 2), index % 2 === 0 ? 0 : 30),
      duration_min: task.duration_min ?? 45,
      status: task.status,
      note: "Skill daily task",
    }),
  );

  const logsToInsert = [
    ...goalLogs,
    ...skillLogs,
  ];

  if (logsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("timeline_logs")
    .insert(logsToInsert)
    .select("*");

  if (error) {
    return [];
  }

  return sortLogs(data ?? []);
}

async function cleanupPresetGeneratedLogs(
  userId: string,
  dateString: string,
  logs: TimelineLogRow[],
) {
  const staleTemplateLogs = logs.filter(
    (log) => log.template_id && log.status === "pending",
  );

  if (staleTemplateLogs.length === 0) {
    return logs;
  }

  const supabase = createSupabaseServerClient();
  const staleIds = staleTemplateLogs.map((log) => log.id);
  const { error } = await supabase
    .from("timeline_logs")
    .delete()
    .eq("user_id", userId)
    .eq("log_date", dateString)
    .in("id", staleIds);

  if (error) {
    return logs;
  }

  return logs.filter((log) => !staleIds.includes(log.id));
}

async function hasTimelineGenerationSuppression(
  userId: string,
  dateString: string,
) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("timeline_generation_suppression")
    .select("id")
    .eq("user_id", userId)
    .eq("log_date", dateString)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function getTimelinePageData(
  requestedDate?: string,
): Promise<TimelinePageData> {
  const selectedDate = isValidDateString(requestedDate)
    ? requestedDate!
    : getBangkokDateString();

  if (!hasSupabaseConfig()) {
    return {
      selectedDate,
      logs: demoLogs.map((log) => ({ ...log, log_date: selectedDate })),
      templates: [],
      workoutPlans: [],
      generated: false,
      supabaseReady: false,
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [logsResult, templatesResult, workoutPlansResult] = await Promise.all([
    supabase
      .from("timeline_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", selectedDate)
      .order("start_time", { ascending: true }),
    supabase
      .from("timeline_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true }),
    supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (logsResult.error || templatesResult.error || workoutPlansResult.error) {
    return {
      selectedDate,
      logs: [],
      templates: [],
      workoutPlans: [],
      generated: false,
      supabaseReady: true,
    };
  }

  const selectedWeekday = getWeekday(selectedDate);
  const workoutPlans = (workoutPlansResult.data ?? []).filter(
    (plan: WorkoutPlanRow) => includesWeekday(plan.day_of_week, selectedWeekday),
  );

  const logs = await cleanupPresetGeneratedLogs(
    user.id,
    selectedDate,
    logsResult.data ?? [],
  );

  if (logs.length > 0) {
    return {
      selectedDate,
      logs: sortLogs(logs),
      templates: templatesResult.data ?? [],
      workoutPlans,
      generated: false,
      supabaseReady: true,
    };
  }

  if (await hasTimelineGenerationSuppression(user.id, selectedDate)) {
    return {
      selectedDate,
      logs: [],
      templates: templatesResult.data ?? [],
      workoutPlans,
      generated: false,
      supabaseReady: true,
    };
  }

  const generatedLogs = await generateTimelineLogsForDate(user.id, selectedDate);

  return {
    selectedDate,
    logs: generatedLogs,
    templates: templatesResult.data ?? [],
    workoutPlans,
    generated: generatedLogs.length > 0,
    supabaseReady: true,
  };
}
