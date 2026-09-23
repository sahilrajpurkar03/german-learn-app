// Hand-written row types for supabase/migrations/0006_learning_v2.sql and 0007_push_reminders.sql.
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type LearnerSettingsRow = {
  user_id: string;
  daily_goal_xp: number;
  timezone: string;
  reminder_hour: number | null;
  sound_on: boolean;
  motivation: string | null;
  start_unit: number;
  placed_at: string | null;
  legacy_imported_at: string | null;
  updated_at: string;
};

export type LearnerItemRow = {
  user_id: string;
  item_key: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  strength: number;
  lapses: number;
  seen_count: number;
  correct_count: number;
  introduced_at: string;
  last_seen_at: string;
  source: "course" | "conversation" | "custom" | "legacy";
};

export type LearningEventRow = {
  attempt_id: string;
  user_id: string;
  run_id: string;
  lesson_id: string;
  step_id: string;
  item_keys: string[];
  exercise_type: string;
  verdict: "correct" | "close" | "wrong" | "seen" | "complete";
  retry: boolean;
  xp: number;
  answer: string | null;
  response_ms: number | null;
  occurred_at: string;
  received_at: string;
};

export type DailyActivityRow = {
  user_id: string;
  local_date: string;
  xp: number;
  graded_steps: number;
  lessons: number;
  reviews: number;
  goal_xp: number;
  goal_met: boolean;
  freeze_used: boolean;
};

export type LessonProgressRow = {
  user_id: string;
  lesson_id: string;
  status: "started" | "completed";
  step_index: number;
  best_score: number | null;
  completed_count: number;
  last_run_id: string | null;
  updated_at: string;
  completed_at: string | null;
};

export type LearnerStatsRow = {
  user_id: string;
  xp_total: number;
  streak_current: number;
  streak_longest: number;
  streak_last_date: string | null;
  freezes: number;
  freeze_progress: number;
  updated_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  last_sent_on: string | null;
  last_recap_on: string | null;
  failures: number;
};

export type LearningTables = {
  learner_settings: Table<LearnerSettingsRow, "user_id">;
  learner_items: Table<LearnerItemRow, "user_id" | "item_key">;
  learning_events: Table<LearningEventRow, "attempt_id" | "user_id" | "run_id" | "lesson_id" | "step_id" | "exercise_type" | "verdict" | "occurred_at">;
  daily_activity: Table<DailyActivityRow, "user_id" | "local_date">;
  lesson_progress: Table<LessonProgressRow, "user_id" | "lesson_id" | "status">;
  learner_stats: Table<LearnerStatsRow, "user_id">;
  push_subscriptions: Table<PushSubscriptionRow, "user_id" | "endpoint" | "p256dh" | "auth">;
};

export type LearningFunctions = {
  prune_learning_events: { Args: Record<string, never>; Returns: number };
};
