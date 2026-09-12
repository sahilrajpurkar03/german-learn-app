// Hand-written types matching supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked, if the schema evolves.

import type { PersonalFunctions, PersonalTables } from "../personal-database";

export type Level = "a1" | "a2" | "b1";
export type ItemType = "vocab" | "phrase";
export type ExerciseType = "speak" | "listen_type" | "word_bank" | "mcq" | "match";
export type SessionMode = "mixed" | "speaking" | "listening" | "vocab";

export interface Database {
  public: {
    Tables: PersonalTables & {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          current_level: Level;
          xp: number;
          streak_current: number;
          streak_longest: number;
          last_active_date: string | null;
          daily_goal_minutes: number;
          placement_completed: boolean;
          next_checkin_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          slug: string;
          title: string;
          level: Level;
          sort_order: number;
          icon: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["topics"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["topics"]["Row"]>;
        Relationships: [];
      };
      vocab_items: {
        Row: {
          id: string;
          topic_id: string | null;
          lemma: string;
          pos: string | null;
          translation_en: string;
          example_de: string | null;
          example_en: string | null;
          level: Level;
          source_ref: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["vocab_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vocab_items"]["Row"]>;
        Relationships: [];
      };
      phrases: {
        Row: {
          id: string;
          topic_id: string | null;
          de_text: string;
          en_text: string;
          level: Level;
          situation: string | null;
          source_ref: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["phrases"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["phrases"]["Row"]>;
        Relationships: [];
      };
      item_progress: {
        Row: {
          id: string;
          user_id: string;
          item_type: ItemType;
          item_id: string;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          due_at: string;
          correct_count: number;
          wrong_count: number;
          last_result: "correct" | "wrong" | "partial" | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["item_progress"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["item_progress"]["Row"]>;
        Relationships: [];
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: SessionMode;
          started_at: string;
          ended_at: string | null;
          xp_earned: number;
        };
        Insert: Partial<Database["public"]["Tables"]["practice_sessions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["practice_sessions"]["Row"]>;
        Relationships: [];
      };
      session_events: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          item_type: ItemType;
          item_id: string;
          exercise_type: ExerciseType;
          correct: boolean;
          response_ms: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["session_events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["session_events"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: PersonalFunctions;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
