export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type PersonalTables = {
  personal_chapters: Table<{ id: string; user_id: string; blueprint: Json; created_at: string }>;
  personal_chapter_progress: Table<{ chapter_id: string; user_id: string; variant: string; turn_index: number; correct: number; completed: boolean; updated_at: string }>;
  personal_chapter_reviews: Table<{ chapter_id: string; user_id: string; target_index: number; ease_factor: number; interval_days: number; repetitions: number; due_at: string; updated_at: string }>;
  personal_chapter_jobs: Table<{ id: string; user_id: string; kind: string; input_digest: string; status: string; audio_path: string | null; output: Json | null; created_at: string; expires_at: string }>;
};

export type PersonalFunctions = {
  reserve_personal_chapter_job: {
    Args: { actor: string; job_id: string; job_kind: string; digest: string; audio_extension?: string | null };
    Returns: string;
  };
};