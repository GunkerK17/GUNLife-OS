"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoalCategory,
  GoalDailyTaskRow,
  GoalRow,
  GoalStatus,
  SkillDailyTaskRow,
  SkillLevel,
  SkillRow,
  TaskStatus,
} from "@/lib/supabase/database.types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const goalCategories = [
  "health",
  "learning",
  "finance",
  "career",
  "personal",
  "other",
] as const satisfies readonly GoalCategory[];

const goalStatuses = [
  "active",
  "completed",
  "paused",
  "abandoned",
] as const satisfies readonly GoalStatus[];

const taskStatuses = ["pending", "done", "skipped"] as const satisfies readonly TaskStatus[];
const skillLevels = ["beginner", "intermediate", "advanced"] as const satisfies readonly SkillLevel[];

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

const goalSchema = z
  .object({
    title: z.string().trim().min(2, "Goal title needs at least 2 characters."),
    description: optionalText,
    category: z.enum(goalCategories),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    target_days: z.coerce.number().int().min(1).max(365),
    target_value: optionalNumber(z.coerce.number().min(0).max(999999999)),
    unit: optionalText,
    current_value: optionalNumber(z.coerce.number().min(0).max(999999999)),
    daily_task: z.string().trim().min(2, "Daily action is required."),
    weekly_focus: optionalText,
    link_skill: z.string().optional(),
    skill_name: optionalText,
    skill_level: z.enum(skillLevels).optional(),
    skill_duration_min: optionalNumber(
      z.coerce.number().int().min(0).max(1440),
    ),
  })
  .superRefine((value, context) => {
    if (value.category === "finance" && !value.target_value) {
      context.addIssue({
        code: "custom",
        message: "Vui lòng nhập số tiền mục tiêu cần tiết kiệm.",
        path: ["target_value"],
      });
    }
  });

const progressSchema = z.object({
  goal_id: z.string().uuid(),
  current_value: optionalNumber(z.coerce.number().min(0).max(999999999)),
  target_value: optionalNumber(z.coerce.number().min(1).max(999999999)),
  status: z.enum(goalStatuses),
});

const taskDetailsSchema = z.object({
  task_id: z.string().uuid(),
  description: z.string().trim().min(2, "Task needs at least 2 characters."),
  note: optionalText,
});

async function getAuthedSupabase() {
  if (!hasSupabaseConfig()) {
    return { ok: false, error: "Supabase is not configured yet." } as const;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to sign in first." } as const;
  }

  return { ok: true, supabase, user } as const;
}

function revalidateGoals() {
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard/timeline");
  revalidatePath("/dashboard");
}

function shiftDate(dateString: string, amount: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

type RoadmapStep = {
  label: string;
  action: string;
};

const goalRoadmaps: Record<GoalCategory, RoadmapStep[]> = {
  career: [
    { label: "Deep work", action: "Work on the highest-impact project task" },
    { label: "Skill upgrade", action: "Study one focused lesson and write notes" },
    { label: "Portfolio output", action: "Ship a small visible improvement" },
    { label: "Network", action: "Reach out, apply, or ask for feedback" },
    { label: "Review", action: "Fix one weak point from recent work" },
    { label: "Challenge", action: "Do a timed task or mock interview" },
    { label: "Weekly reset", action: "Review wins, blockers, and next week priority" },
  ],
  finance: [
    { label: "Money snapshot", action: "Check balances, debt, and the remaining target" },
    { label: "Save", action: "Transfer the planned amount into the linked savings wallet" },
    { label: "No-spend check", action: "Avoid one unnecessary expense today" },
    { label: "Income action", action: "Complete one action that can increase income" },
    { label: "Budget check", action: "Review spending categories and remaining limits" },
    { label: "Debt check", action: "Review pay-later debt and the next due date" },
    { label: "Weekly money review", action: "Summarize saved money, cash flow, and next action" },
  ],
  health: [
    { label: "Strength A", action: "Train main muscle group and log sets, reps, kg" },
    { label: "Cardio", action: "Walk, run, bike, or football and record calories/heart rate" },
    { label: "Nutrition check", action: "Hit protein, water, and record meals" },
    { label: "Strength B", action: "Train a different muscle group and log volume" },
    { label: "Body check", action: "Record weight, body photo, sleep, and energy" },
    { label: "Conditioning", action: "Do sport, core, mobility, or a lighter session" },
    { label: "Recovery review", action: "Stretch, recover, and plan next week" },
  ],
  learning: [
    { label: "Foundation", action: "Learn the key concept or vocabulary set" },
    { label: "Input", action: "Listen, read, or watch one focused lesson" },
    { label: "Practice", action: "Do drills and record mistakes" },
    { label: "Output", action: "Speak, write, code, or create a small result" },
    { label: "Review", action: "Recall from memory and fix weak points" },
    { label: "Challenge", action: "Do a mini test or real-world task" },
    { label: "Reflection", action: "Summarize progress and choose next focus" },
  ],
  other: [
    { label: "Start", action: "Do the smallest useful action" },
    { label: "Build", action: "Repeat the core habit with a small improvement" },
    { label: "Track", action: "Record proof, score, or notes" },
    { label: "Improve", action: "Remove one blocker or friction point" },
    { label: "Review", action: "Check what worked and what did not" },
    { label: "Stretch", action: "Try a harder version of the action" },
    { label: "Reset", action: "Prepare the next week clearly" },
  ],
  personal: [
    { label: "Clarity", action: "Write why this matters and what today needs" },
    { label: "Practice", action: "Do the core personal habit" },
    { label: "Reflect", action: "Journal what changed and what felt hard" },
    { label: "Environment", action: "Make the habit easier to repeat tomorrow" },
    { label: "Review", action: "Check progress and adjust expectations" },
    { label: "Connection", action: "Do one action that supports relationships or identity" },
    { label: "Reset", action: "Rest, organize, and plan the next cycle" },
  ],
};

const skillRoadmap: RoadmapStep[] = [
  { label: "Understand", action: "Study one lesson and write 3 useful notes" },
  { label: "Drill", action: "Practice the smallest repeatable exercise" },
  { label: "Apply", action: "Use the skill in one tiny real output" },
  { label: "Feedback", action: "Compare with a reference and fix mistakes" },
  { label: "Recall", action: "Review without notes and summarize from memory" },
  { label: "Challenge", action: "Do a timed challenge or mini project" },
  { label: "Reflect", action: "Log what improved and choose the next weak point" },
];

function roadmapPhase(dayIndex: number, targetDays: number) {
  const progress = (dayIndex + 1) / Math.max(targetDays, 1);

  if (progress <= 0.25) {
    return "Foundation";
  }

  if (progress <= 0.5) {
    return "Build";
  }

  if (progress <= 0.75) {
    return "Push";
  }

  return "Review";
}

function buildRoadmapGoalDescription({
  category,
  dailyTask,
  dayIndex,
  targetDays,
  weeklyFocus,
}: {
  category: GoalCategory;
  dailyTask: string;
  dayIndex: number;
  targetDays: number;
  weeklyFocus?: string;
}) {
  const roadmap = goalRoadmaps[category];
  const step = roadmap[dayIndex % roadmap.length];
  const day = dayIndex + 1;
  const week = Math.floor(dayIndex / 7) + 1;
  const phase = roadmapPhase(dayIndex, targetDays);
  const focus = weeklyFocus ? ` - Week ${week}: ${weeklyFocus}` : "";

  return `Day ${day} - ${phase} - ${step.label}: ${step.action}. Core: ${dailyTask}${focus}`;
}

function buildRoadmapSkillDescription({
  dailyTask,
  dayIndex,
  skillName,
  targetDays,
}: {
  dailyTask: string;
  dayIndex: number;
  skillName: string;
  targetDays: number;
}) {
  const step = skillRoadmap[dayIndex % skillRoadmap.length];
  const day = dayIndex + 1;
  const phase = roadmapPhase(dayIndex, targetDays);

  return `Day ${day} - ${phase} - ${step.label}: ${step.action} for ${skillName}. Core: ${dailyTask}`;
}

function buildRoadmapGoalTasks({
  category,
  dailyTask,
  goalId,
  startDate,
  targetDays,
  userId,
  weeklyFocus,
}: {
  category: GoalCategory;
  dailyTask: string;
  goalId: string;
  startDate: string;
  targetDays: number;
  userId: string;
  weeklyFocus?: string;
}): Array<Partial<GoalDailyTaskRow>> {
  return Array.from({ length: targetDays }, (_, index) => ({
    user_id: userId,
    goal_id: goalId,
    task_date: shiftDate(startDate, index),
    description: buildRoadmapGoalDescription({
      category,
      dailyTask,
      dayIndex: index,
      targetDays,
      weeklyFocus,
    }),
    status: "pending",
    note: null,
  }));
}

function buildRoadmapSkillTasks({
  dailyTask,
  durationMin,
  skillId,
  skillName,
  startDate,
  targetDays,
  userId,
}: {
  dailyTask: string;
  durationMin?: number;
  skillId: string;
  skillName: string;
  startDate: string;
  targetDays: number;
  userId: string;
}): Array<Partial<SkillDailyTaskRow>> {
  return Array.from({ length: targetDays }, (_, index) => ({
    user_id: userId,
    skill_id: skillId,
    task_date: shiftDate(startDate, index),
    description: buildRoadmapSkillDescription({
      dailyTask,
      dayIndex: index,
      skillName,
      targetDays,
    }),
    duration_min: durationMin ?? 30,
    status: "pending",
    note: null,
  }));
}

function parseGoalForm(formData: FormData) {
  const parsed = goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    start_date: formData.get("start_date"),
    target_days: formData.get("target_days"),
    target_value: formData.get("target_value"),
    unit: formData.get("unit"),
    current_value: formData.get("current_value"),
    daily_task: formData.get("daily_task"),
    weekly_focus: formData.get("weekly_focus"),
    link_skill: formData.get("link_skill") || undefined,
    skill_name: formData.get("skill_name"),
    skill_level: formData.get("skill_level") || "beginner",
    skill_duration_min: formData.get("skill_duration_min"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
    return { ok: false, error: `${field}${issue.message}` } as const;
  }

  return { ok: true, data: parsed.data } as const;
}

export async function createGoalPlan(
  formData: FormData,
): Promise<ActionResult<{ goal: GoalRow; skill: SkillRow | null }>> {
  const parsed = parseGoalForm(formData);

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const endDate = shiftDate(parsed.data.start_date, parsed.data.target_days - 1);
  const { data: goal, error: goalError } = await auth.supabase
    .from("goals")
    .insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      target_days: parsed.data.target_days,
      start_date: parsed.data.start_date,
      end_date: endDate,
      status: "active",
      target_value: parsed.data.target_value ?? parsed.data.target_days,
      current_value: parsed.data.current_value ?? 0,
      unit: parsed.data.unit ?? (parsed.data.category === "finance" ? "VND" : "days"),
      color: categoryColor(parsed.data.category),
      icon: categoryIcon(parsed.data.category),
    })
    .select("*")
    .single();

  if (goalError || !goal) {
    return { ok: false, error: goalError?.message ?? "Could not create goal." };
  }

  if (parsed.data.category !== "finance") {
    const goalTasks = buildRoadmapGoalTasks({
      category: parsed.data.category,
      dailyTask: parsed.data.daily_task,
      goalId: goal.id,
      startDate: parsed.data.start_date,
      targetDays: parsed.data.target_days,
      userId: auth.user.id,
      weeklyFocus: parsed.data.weekly_focus,
    });

    const { error: taskError } = await auth.supabase
      .from("goal_daily_tasks")
      .insert(goalTasks);

    if (taskError) {
      await auth.supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", auth.user.id);
      return { ok: false, error: taskError.message };
    }
  }

  let skill: SkillRow | null = null;
  const shouldCreateSkill =
    parsed.data.category === "learning" &&
    parsed.data.link_skill === "on";

  if (shouldCreateSkill) {
    const skillName = parsed.data.skill_name ?? parsed.data.title;
    const { data: createdSkill, error: skillError } = await auth.supabase
      .from("skills")
      .insert({
        user_id: auth.user.id,
        name: skillName,
        category: parsed.data.category === "learning" ? "Learning" : "Goal support",
        description: `[goal:${goal.id}] ${parsed.data.title}`,
        level: parsed.data.skill_level ?? "beginner",
        started_at: parsed.data.start_date,
        target_days: parsed.data.target_days,
        color: categoryColor(parsed.data.category),
      })
      .select("*")
      .single();

    if (skillError || !createdSkill) {
      await auth.supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", auth.user.id);
      return { ok: false, error: skillError?.message ?? "Could not create skill." };
    }

    skill = createdSkill;

    const skillTasks = buildRoadmapSkillTasks({
      dailyTask: parsed.data.daily_task,
      durationMin: parsed.data.skill_duration_min,
      skillId: createdSkill.id,
      skillName,
      startDate: parsed.data.start_date,
      targetDays: parsed.data.target_days,
      userId: auth.user.id,
    });

    const { error: skillTaskError } = await auth.supabase
      .from("skill_daily_tasks")
      .insert(skillTasks);

    if (skillTaskError) {
      await auth.supabase
        .from("skills")
        .delete()
        .eq("id", createdSkill.id)
        .eq("user_id", auth.user.id);
      await auth.supabase
        .from("goals")
        .delete()
        .eq("id", goal.id)
        .eq("user_id", auth.user.id);
      return { ok: false, error: skillTaskError.message };
    }
  }

  revalidateGoals();

  return { ok: true, data: { goal, skill } };
}

export async function setGoalTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ActionResult<{ task: GoalDailyTaskRow }>> {
  if (!z.string().uuid().safeParse(taskId).success || !taskStatuses.includes(status)) {
    return { ok: false, error: "Invalid task status request." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: task, error } = await auth.supabase
    .from("goal_daily_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Could not update task." };
  }

  await auth.supabase
    .from("timeline_logs")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("user_id", auth.user.id)
    .eq("source_type", "goal_daily_task")
    .eq("source_id", taskId);

  revalidateGoals();

  return { ok: true, data: { task } };
}

export async function updateGoalTaskDetails(
  formData: FormData,
): Promise<ActionResult<{ task: GoalDailyTaskRow }>> {
  const parsed = taskDetailsSchema.safeParse({
    task_id: formData.get("task_id"),
    description: formData.get("description"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: task, error } = await auth.supabase
    .from("goal_daily_tasks")
    .update({
      description: parsed.data.description,
      note: parsed.data.note ?? null,
    })
    .eq("id", parsed.data.task_id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Could not update task." };
  }

  await auth.supabase
    .from("timeline_logs")
    .update({
      title: parsed.data.description,
      note: parsed.data.note ?? null,
    })
    .eq("user_id", auth.user.id)
    .eq("source_type", "goal_daily_task")
    .eq("source_id", parsed.data.task_id);

  revalidateGoals();

  return { ok: true, data: { task } };
}

export async function updateGoalProgress(
  formData: FormData,
): Promise<ActionResult<{ goal: GoalRow }>> {
  const parsed = progressSchema.safeParse({
    goal_id: formData.get("goal_id"),
    current_value: formData.get("current_value"),
    target_value: formData.get("target_value"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const updatePayload: {
    current_value?: number | null;
    target_value?: number | null;
    status: GoalStatus;
  } = {
    status: parsed.data.status,
  };

  if (parsed.data.current_value !== undefined) {
    updatePayload.current_value = parsed.data.current_value;
  }
  if (parsed.data.target_value !== undefined) {
    updatePayload.target_value = parsed.data.target_value;
  }

  const { data, error } = await auth.supabase
    .from("goals")
    .update(updatePayload)
    .eq("id", parsed.data.goal_id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update goal." };
  }

  revalidateGoals();

  return { ok: true, data: { goal: data } };
}

export async function deleteGoal(goalId: string): Promise<ActionResult<{ id: string }>> {
  if (!z.string().uuid().safeParse(goalId).success) {
    return { ok: false, error: "Invalid goal id." };
  }

  const auth = await getAuthedSupabase();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data: tasks } = await auth.supabase
    .from("goal_daily_tasks")
    .select("id")
    .eq("goal_id", goalId)
    .eq("user_id", auth.user.id);
  const taskIds = (tasks ?? []).map((task) => task.id);

  const { data: linkedSkills } = await auth.supabase
    .from("skills")
    .select("id")
    .eq("user_id", auth.user.id)
    .like("description", `%[goal:${goalId}]%`);
  const linkedSkillIds = (linkedSkills ?? []).map((skill) => skill.id);

  const { data: linkedSkillTasks } = linkedSkillIds.length
    ? await auth.supabase
        .from("skill_daily_tasks")
        .select("id")
        .eq("user_id", auth.user.id)
        .in("skill_id", linkedSkillIds)
    : { data: [] };
  const linkedSkillTaskIds = (linkedSkillTasks ?? []).map((task) => task.id);

  const { error } = await auth.supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  if (taskIds.length > 0) {
    await auth.supabase
      .from("timeline_logs")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("source_type", "goal_daily_task")
      .in("source_id", taskIds);
  }

  if (linkedSkillTaskIds.length > 0) {
    await auth.supabase
      .from("timeline_logs")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("source_type", "skill_daily_task")
      .in("source_id", linkedSkillTaskIds);
  }

  if (linkedSkillIds.length > 0) {
    const { error: skillDeleteError } = await auth.supabase
      .from("skills")
      .delete()
      .eq("user_id", auth.user.id)
      .in("id", linkedSkillIds);

    if (skillDeleteError) {
      return { ok: false, error: skillDeleteError.message };
    }
  }

  revalidateGoals();

  return { ok: true, data: { id: goalId } };
}

function categoryColor(category: GoalCategory) {
  const colors: Record<GoalCategory, string> = {
    career: "#a78bfa",
    finance: "#fbbf24",
    health: "#34d399",
    learning: "#22d3ee",
    other: "#94a3b8",
    personal: "#fb7185",
  };

  return colors[category];
}

function categoryIcon(category: GoalCategory) {
  const icons: Record<GoalCategory, string> = {
    career: "briefcase",
    finance: "wallet",
    health: "heart",
    learning: "graduation",
    other: "target",
    personal: "sparkles",
  };

  return icons[category];
}
