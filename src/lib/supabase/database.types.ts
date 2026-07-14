export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type TimelineCategory =
  | "sleep"
  | "gym"
  | "work"
  | "study"
  | "sport"
  | "meal"
  | "rest"
  | "other";

export type TaskStatus = "pending" | "done" | "skipped";
export type ActivityType =
  | "football"
  | "running"
  | "walking"
  | "cycling"
  | "tabata"
  | "swimming"
  | "other";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type GoalCategory =
  | "health"
  | "learning"
  | "finance"
  | "career"
  | "personal"
  | "other";
export type GoalStatus = "active" | "completed" | "paused" | "abandoned";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Mood = "great" | "good" | "okay" | "bad" | "terrible";
export type JournalWellbeing = {
  deepWorkMin?: number;
  habits?: string[];
  quickReviewDone?: boolean;
  quickStimuli?: Record<string, number>;
  rewardClaimed?: boolean;
  rewardKey?: string;
  rewardNote?: string;
  sleepHours?: number;
  socialMediaMin?: number;
  trigger?: string;
  urgeLevel?: number;
};
export type WalletType =
  | "cash"
  | "bank"
  | "credit"
  | "e-wallet"
  | "investment";
export type TransactionType = "income" | "expense" | "transfer";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type OwnedRow = {
  id: string;
  user_id: string;
  created_at: string;
};

export type TimelineTemplateRow = OwnedRow & {
  title: string;
  category: TimelineCategory;
  start_time: string;
  duration_min: number;
  repeat_days: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
};

export type TimelineLogRow = OwnedRow & {
  template_id: string | null;
  source_type: string | null;
  source_id: string | null;
  log_date: string;
  title: string;
  category: TimelineCategory;
  start_time: string | null;
  duration_min: number | null;
  status: TaskStatus;
  note: string | null;
  completed_at: string | null;
};

export type TimelineGenerationSuppressionRow = OwnedRow & {
  log_date: string;
  reason: string | null;
};

export type WorkoutPlanRow = OwnedRow & {
  name: string;
  day_of_week: string;
  description: string | null;
  is_active: boolean;
};

export type WorkoutExerciseRow = OwnedRow & {
  plan_id: string;
  exercise_name: string;
  muscle_group: string | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  rest_sec: number | null;
  order_index: number;
  note: string | null;
};

export type WorkoutLogRow = OwnedRow & {
  plan_id: string | null;
  log_date: string;
  calories_burned: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  duration_min: number | null;
  note: string | null;
  image_url: string | null;
};

export type ActivityRow = OwnedRow & {
  log_date: string;
  type: ActivityType;
  duration_min: number | null;
  calories_burned: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  distance_km: number | null;
  note: string | null;
  image_url: string | null;
};

export type NutritionLogRow = OwnedRow & {
  log_date: string;
  meal_type: MealType;
  food_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  image_url: string | null;
};

export type WeightLogRow = OwnedRow & {
  log_date: string;
  weight_kg: number;
  body_fat_pct: number | null;
  muscle_kg: number | null;
  visceral_fat: number | null;
  note: string | null;
  image_url: string | null;
};

export type BodyMeasurementRow = OwnedRow & {
  measured_at: string;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  note: string | null;
  image_url: string | null;
};

export type GoalRow = OwnedRow & {
  title: string;
  description: string | null;
  category: GoalCategory;
  target_days: number | null;
  start_date: string;
  end_date: string | null;
  status: GoalStatus;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  color: string | null;
  icon: string | null;
};

export type GoalDailyTaskRow = OwnedRow & {
  goal_id: string;
  task_date: string;
  description: string;
  status: TaskStatus;
  note: string | null;
};

export type SkillRow = OwnedRow & {
  name: string;
  category: string | null;
  description: string | null;
  level: SkillLevel;
  started_at: string;
  target_days: number | null;
  color: string | null;
};

export type SkillDailyTaskRow = OwnedRow & {
  skill_id: string;
  task_date: string;
  description: string;
  duration_min: number | null;
  status: TaskStatus;
  note: string | null;
};

export type JournalRow = OwnedRow & {
  log_date: string;
  content: string | null;
  mood: Mood | null;
  wellbeing: JournalWellbeing | null;
  updated_at: string;
};

export type WalletRow = OwnedRow & {
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  provider: string | null;
  account_last4: string | null;
  credit_limit: number | null;
  statement_day: number | null;
  due_day: number | null;
  goal_id: string | null;
  note: string | null;
};

export type TransactionRow = OwnedRow & {
  wallet_id: string;
  destination_wallet_id: string | null;
  goal_id: string | null;
  tx_date: string;
  type: TransactionType;
  amount: number;
  category: string;
  merchant: string | null;
  note: string | null;
  receipt_url: string | null;
  transfer_group_id: string | null;
};

export type MonthlyBudgetRow = OwnedRow & {
  category: string;
  budget_amount: number;
  month: number;
  year: number;
};

export type UserProfileRow = OwnedRow & {
  bio: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  target_weight_kg: number | null;
  job_title: string | null;
  company: string | null;
  education: string | null;
  skills_list: Json | null;
  assets: Json | null;
  certificates: Json | null;
  notes: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
};

export type AiConversationCategory =
  | "general"
  | "daily"
  | "health"
  | "goals"
  | "finance"
  | "learning";

export type AiConversationRow = OwnedRow & {
  category: AiConversationCategory;
  is_pinned: boolean;
  title: string | null;
  messages: Json;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: TableDefinition<UserRow>;
      timeline_templates: TableDefinition<TimelineTemplateRow>;
      timeline_logs: TableDefinition<TimelineLogRow>;
      timeline_generation_suppression: TableDefinition<TimelineGenerationSuppressionRow>;
      workout_plans: TableDefinition<WorkoutPlanRow>;
      workout_exercises: TableDefinition<WorkoutExerciseRow>;
      workout_logs: TableDefinition<WorkoutLogRow>;
      activities: TableDefinition<ActivityRow>;
      nutrition_logs: TableDefinition<NutritionLogRow>;
      weight_logs: TableDefinition<WeightLogRow>;
      body_measurements: TableDefinition<BodyMeasurementRow>;
      goals: TableDefinition<GoalRow>;
      goal_daily_tasks: TableDefinition<GoalDailyTaskRow>;
      skills: TableDefinition<SkillRow>;
      skill_daily_tasks: TableDefinition<SkillDailyTaskRow>;
      journals: TableDefinition<JournalRow>;
      wallets: TableDefinition<WalletRow>;
      transactions: TableDefinition<TransactionRow>;
      monthly_budgets: TableDefinition<MonthlyBudgetRow>;
      user_profiles: TableDefinition<UserProfileRow>;
      ai_conversations: TableDefinition<AiConversationRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      activity_type: ActivityType;
      goal_category: GoalCategory;
      goal_status: GoalStatus;
      meal_type: MealType;
      mood: Mood;
      skill_level: SkillLevel;
      task_status: TaskStatus;
      timeline_category: TimelineCategory;
      transaction_type: TransactionType;
      wallet_type: WalletType;
    };
    CompositeTypes: Record<string, never>;
  };
};
