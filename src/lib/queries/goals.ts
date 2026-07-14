import "server-only";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoalDailyTaskRow,
  GoalRow,
  SkillDailyTaskRow,
  SkillRow,
  TransactionRow,
  WalletRow,
} from "@/lib/supabase/database.types";

export type GoalWithTasks = GoalRow & {
  tasks: GoalDailyTaskRow[];
  linkedSkills: Array<SkillRow & { tasks: SkillDailyTaskRow[] }>;
  contributions: TransactionRow[];
  linkedWallets: WalletRow[];
};

export type GoalsPageData = {
  selectedDate: string;
  goals: GoalWithTasks[];
  skills: Array<SkillRow & { tasks: SkillDailyTaskRow[] }>;
  supabaseReady: boolean;
};

const nowIso = new Date().toISOString();

export function getBangkokDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "year")?.value}-${parts.find(
    (part) => part.type === "month",
  )?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

export function isValidGoalDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function demoGoal(selectedDate: string): GoalWithTasks {
  const demoRoadmap = [
    "Day 1 - Foundation - Vocabulary: Learn survival words and write 5 example sentences. Core: Learn 20 words + speak 20 min",
    "Day 2 - Foundation - Input: Listen to one short conversation and shadow it. Core: Learn 20 words + speak 20 min",
    "Day 3 - Foundation - Practice: Speak for 2 minutes and record mistakes. Core: Learn 20 words + speak 20 min",
    "Day 4 - Build - Output: Write a short self-introduction and read it aloud. Core: Learn 20 words + speak 20 min",
    "Day 5 - Build - Review: Recall vocabulary without notes and fix weak points. Core: Learn 20 words + speak 20 min",
    "Day 6 - Build - Challenge: Hold a 5-minute topic practice. Core: Learn 20 words + speak 20 min",
    "Day 7 - Review - Reflection: Summarize progress and plan the next week. Core: Learn 20 words + speak 20 min",
  ];
  const tasks: GoalDailyTaskRow[] = Array.from({ length: 30 }, (_, index) => ({
    id: `demo-goal-task-${index + 1}`,
    user_id: "demo",
    goal_id: "demo-goal",
    task_date: shiftDate(selectedDate, index),
    description: demoRoadmap[index % demoRoadmap.length],
    status: index === 0 ? "pending" : "pending",
    note: null,
    created_at: nowIso,
  }));

  const skill: SkillRow & { tasks: SkillDailyTaskRow[] } = {
    id: "demo-skill",
    user_id: "demo",
    name: "English communication",
    category: "Learning",
    description: "[goal:demo-goal] Linked to 30-day English goal",
    level: "beginner",
    started_at: selectedDate,
    target_days: 30,
    color: "#22d3ee",
    created_at: nowIso,
    tasks: tasks.map((task) => ({
      id: `demo-skill-task-${task.id}`,
      user_id: "demo",
      skill_id: "demo-skill",
      task_date: task.task_date,
      description: task.description,
      duration_min: 30,
      status: task.status,
      note: null,
      created_at: nowIso,
    })),
  };

  return {
    id: "demo-goal",
    user_id: "demo",
    title: "Speak English in 30 days",
    description: "Daily small practice linked with Skills and Timeline.",
    category: "learning",
    target_days: 30,
    start_date: selectedDate,
    end_date: shiftDate(selectedDate, 29),
    status: "active",
    target_value: 30,
    current_value: 0,
    unit: "days",
    color: "#22d3ee",
    icon: "graduation",
    created_at: nowIso,
    tasks,
    linkedSkills: [skill],
    contributions: [],
    linkedWallets: [],
  };
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

function extractGoalId(description: string | null) {
  return description?.match(/\[goal:([a-f0-9-]+|demo-goal)\]/i)?.[1] ?? null;
}

export async function getGoalsPageData(
  requestedDate?: string,
): Promise<GoalsPageData> {
  const selectedDate = isValidGoalDate(requestedDate)
    ? requestedDate!
    : getBangkokDateString();

  if (!hasSupabaseConfig()) {
    const goal = demoGoal(selectedDate);

    return {
      selectedDate,
      goals: [goal],
      skills: goal.linkedSkills,
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

  const [goalsResult, skillsResult] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (goalsResult.error || skillsResult.error) {
    return {
      selectedDate,
      goals: [],
      skills: [],
      supabaseReady: true,
    };
  }

  const goals = goalsResult.data ?? [];
  const skills = skillsResult.data ?? [];
  const goalIds = goals.map((goal) => goal.id);
  const skillIds = skills.map((skill) => skill.id);

  const [goalTasksResult, skillTasksResult, contributionsResult, walletsResult] =
    await Promise.all([
    goalIds.length
      ? supabase
          .from("goal_daily_tasks")
          .select("*")
          .eq("user_id", user.id)
          .in("goal_id", goalIds)
          .order("task_date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    skillIds.length
      ? supabase
          .from("skill_daily_tasks")
          .select("*")
          .eq("user_id", user.id)
          .in("skill_id", skillIds)
          .order("task_date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    goalIds.length
      ? supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .in("goal_id", goalIds)
          .order("tx_date", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    goalIds.length
      ? supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .in("goal_id", goalIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const goalTasks = goalTasksResult.data ?? [];
  const skillTasks = skillTasksResult.data ?? [];
  const contributions = contributionsResult.data ?? [];
  const linkedWallets = walletsResult.data ?? [];
  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
  const financeGoalIds = goals
    .filter((goal) => goal.category === "finance")
    .map((goal) => goal.id);
  const financeTaskIds = goalTasks
    .filter((task) => financeGoalIds.includes(task.goal_id))
    .map((task) => task.id);

  if (financeTaskIds.length > 0) {
    await Promise.all([
      supabase
        .from("timeline_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("source_type", "goal_daily_task")
        .in("source_id", financeTaskIds),
      supabase
        .from("goal_daily_tasks")
        .delete()
        .eq("user_id", user.id)
        .in("id", financeTaskIds),
    ]);
  }

  const legacyFinanceGoals = goals.filter(
    (goal) =>
      goal.category === "finance" &&
      goal.target_value === goal.target_days &&
      (goal.target_value ?? 0) <= 365,
  );

  await Promise.all(
    legacyFinanceGoals.map(async (goal) => {
      goal.target_value = null;
      await supabase
        .from("goals")
        .update({ target_value: null })
        .eq("id", goal.id)
        .eq("user_id", user.id);
    }),
  );
  const invalidSkillIds = skills
    .filter((skill) => {
      const linkedGoalId = extractGoalId(skill.description);
      const linkedGoal = linkedGoalId ? goalsById.get(linkedGoalId) : null;

      return Boolean(linkedGoal && linkedGoal.category !== "learning");
    })
    .map((skill) => skill.id);
  const invalidSkillTaskIds = skillTasks
    .filter((task) => invalidSkillIds.includes(task.skill_id))
    .map((task) => task.id);

  if (invalidSkillTaskIds.length > 0) {
    await supabase
      .from("timeline_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("source_type", "skill_daily_task")
      .in("source_id", invalidSkillTaskIds);
  }

  if (invalidSkillIds.length > 0) {
    await supabase
      .from("skills")
      .delete()
      .eq("user_id", user.id)
      .in("id", invalidSkillIds);
  }

  const validSkills = skills.filter(
    (skill) => !invalidSkillIds.includes(skill.id),
  );
  const validSkillTasks = skillTasks.filter(
    (task) => !invalidSkillIds.includes(task.skill_id),
  );
  const validGoalTasks = goalTasks.filter(
    (task) => !financeGoalIds.includes(task.goal_id),
  );

  const skillsWithTasks = validSkills.map((skill) => ({
    ...skill,
    tasks: validSkillTasks.filter((task) => task.skill_id === skill.id),
  }));

  const goalsWithTasks = goals.map((goal) => ({
    ...goal,
    tasks: validGoalTasks.filter((task) => task.goal_id === goal.id),
    linkedSkills:
      goal.category === "learning"
        ? skillsWithTasks.filter(
            (skill) => extractGoalId(skill.description) === goal.id,
          )
        : [],
    contributions: contributions.filter(
      (transaction) => transaction.goal_id === goal.id,
    ),
    linkedWallets: linkedWallets.filter((wallet) => wallet.goal_id === goal.id),
  }));

  return {
    selectedDate,
    goals: goalsWithTasks,
    skills: skillsWithTasks,
    supabaseReady: true,
  };
}
