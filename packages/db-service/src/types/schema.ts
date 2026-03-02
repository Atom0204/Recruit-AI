export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string | null;
          resume_url: string | null;
          parsed_resume: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email?: string | null;
          resume_url?: string | null;
          parsed_resume?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string | null;
          resume_url?: string | null;
          parsed_resume?: unknown;
          created_at?: string;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          candidate_id: string;
          shadow_jd: unknown;
          question_script: unknown;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          scheduled_at: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          shadow_jd?: unknown;
          question_script?: unknown;
          status: "scheduled" | "in_progress" | "completed" | "cancelled";
          scheduled_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          shadow_jd?: unknown;
          question_script?: unknown;
          status?: "scheduled" | "in_progress" | "completed" | "cancelled";
          scheduled_at?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          interview_id: string;
          overall_score: number | null;
          verdict: string | null;
          category_scores: unknown;
          sentiment_analysis: unknown;
          proctoring_log: unknown;
          report_pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          overall_score?: number | null;
          verdict?: string | null;
          category_scores?: unknown;
          sentiment_analysis?: unknown;
          proctoring_log?: unknown;
          report_pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          overall_score?: number | null;
          verdict?: string | null;
          category_scores?: unknown;
          sentiment_analysis?: unknown;
          proctoring_log?: unknown;
          report_pdf_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
