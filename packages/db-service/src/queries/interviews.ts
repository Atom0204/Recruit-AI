import type { InterviewQuestion, ShadowJobDescription } from "@recruitai/shared";
import { createSupabaseClient } from "../client";

export const createInterview = async (
  candidateId: string,
  shadowJd: ShadowJobDescription,
  questionScript: InterviewQuestion[]
): Promise<string> => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      candidate_id: candidateId,
      shadow_jd: shadowJd,
      question_script: questionScript,
      status: "scheduled"
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create interview: ${error.message}`);
  }

  return data.id;
};

export const setInterviewStatus = async (interviewId: string, status: "in_progress" | "completed"): Promise<void> => {
  const supabase = createSupabaseClient();

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("interviews")
    .update({
      status,
      started_at: status === "in_progress" ? now : null,
      ended_at: status === "completed" ? now : null
    })
    .eq("id", interviewId);

  if (error) {
    throw new Error(`Failed to update interview: ${error.message}`);
  }
};
