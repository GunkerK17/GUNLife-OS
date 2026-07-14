import "server-only";

import { notFound, redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  GoalRow,
  SkillDailyTaskRow,
  SkillRow,
} from "@/lib/supabase/database.types";
import { getBangkokDateString, isValidGoalDate } from "@/lib/queries/goals";

export type SkillWithTasks = SkillRow & {
  tasks: SkillDailyTaskRow[];
  linkedGoalId: string | null;
};

export type SkillsPageData = {
  selectedDate: string;
  skills: SkillWithTasks[];
  supabaseReady: boolean;
};

export type SkillTaskDetailData = {
  goal: GoalRow | null;
  skill: SkillWithTasks;
  supabaseReady: boolean;
  task: SkillDailyTaskRow;
  taskIndex: number;
  totalTasks: number;
};

const nowIso = new Date().toISOString();

function extractGoalId(description: string | null) {
  return description?.match(/\[goal:([a-f0-9-]+|demo-goal)\]/i)?.[1] ?? null;
}

function demoSkill(selectedDate: string): SkillWithTasks {
  return {
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
    linkedGoalId: "demo-goal",
    tasks: [
      {
        id: "demo-skill-task",
        user_id: "demo",
        skill_id: "demo-skill",
        task_date: selectedDate,
        description: "Day 1: Learn 20 words + speak 20 min",
        duration_min: 30,
        status: "pending",
        note: null,
        created_at: nowIso,
      },
    ],
  };
}

function demoTaskDetail(taskId: string): SkillTaskDetailData {
  const selectedDate = getBangkokDateString();
  const skill = demoSkill(selectedDate);
  const task =
    skill.tasks.find((skillTask) => skillTask.id === taskId) ?? skill.tasks[0];

  return {
    goal: {
      id: "demo-goal",
      user_id: "demo",
      title: "Speak English in 30 days",
      description: "Daily small practice linked with Skills and Timeline.",
      category: "learning",
      target_days: 30,
      start_date: selectedDate,
      end_date: selectedDate,
      status: "active",
      target_value: 30,
      current_value: 0,
      unit: "days",
      color: "#22d3ee",
      icon: "graduation",
      created_at: nowIso,
    },
    skill,
    supabaseReady: false,
    task,
    taskIndex: 0,
    totalTasks: 1,
  };
}

export async function getSkillsPageData(
  requestedDate?: string,
): Promise<SkillsPageData> {
  const selectedDate = isValidGoalDate(requestedDate)
    ? requestedDate!
    : getBangkokDateString();

  if (!hasSupabaseConfig()) {
    return {
      selectedDate,
      skills: [demoSkill(selectedDate)],
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

  const [skillsResult, goalsResult] = await Promise.all([
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("goals").select("id,category").eq("user_id", user.id),
  ]);

  if (skillsResult.error) {
    return {
      selectedDate,
      skills: [],
      supabaseReady: true,
    };
  }

  const goalsById = new Map(
    (goalsResult.data ?? []).map((goal) => [goal.id, goal]),
  );
  const skills = (skillsResult.data ?? []).filter((skill) => {
    const linkedGoalId = extractGoalId(skill.description);

    if (!linkedGoalId) {
      return true;
    }

    return goalsById.get(linkedGoalId)?.category === "learning";
  });
  const skillIds = skills.map((skill) => skill.id);
  const tasksResult = skillIds.length
    ? await supabase
        .from("skill_daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("skill_id", skillIds)
        .order("task_date", { ascending: true })
    : { data: [], error: null };

  const tasks = tasksResult.data ?? [];

  return {
    selectedDate,
    skills: skills.map((skill) => ({
      ...skill,
      linkedGoalId: extractGoalId(skill.description),
      tasks: tasks.filter((task) => task.skill_id === skill.id),
    })),
    supabaseReady: true,
  };
}

export async function getSkillTaskDetailData(
  taskId: string,
): Promise<SkillTaskDetailData> {
  if (!hasSupabaseConfig()) {
    return demoTaskDetail(taskId);
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: task, error: taskError } = await supabase
    .from("skill_daily_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError || !task) {
    notFound();
  }

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("*")
    .eq("id", task.skill_id)
    .eq("user_id", user.id)
    .single();

  if (skillError || !skill) {
    notFound();
  }

  const [tasksResult, goalsResult] = await Promise.all([
    supabase
      .from("skill_daily_tasks")
      .select("*")
      .eq("skill_id", skill.id)
      .eq("user_id", user.id)
      .order("task_date", { ascending: true }),
    supabase.from("goals").select("*").eq("user_id", user.id),
  ]);

  const tasks = tasksResult.data ?? [];
  const linkedGoalId = extractGoalId(skill.description);
  const goal =
    (goalsResult.data ?? []).find((goalItem) => goalItem.id === linkedGoalId) ??
    null;
  const taskIndex = Math.max(
    0,
    tasks.findIndex((skillTask) => skillTask.id === task.id),
  );

  return {
    goal,
    skill: {
      ...skill,
      linkedGoalId,
      tasks,
    },
    supabaseReady: true,
    task,
    taskIndex,
    totalTasks: tasks.length || skill.target_days || 1,
  };
}
