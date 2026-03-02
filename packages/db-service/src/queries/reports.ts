import type { CandidateFitReport } from "@recruitai/shared";
import { createSupabaseClient } from "../client";

export const createReport = async (interviewId: string, report: CandidateFitReport): Promise<string> => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("reports")
    .insert({
      interview_id: interviewId,
      overall_score: report.overallScore,
      verdict: report.verdict,
      category_scores: report.categoryScores,
      sentiment_analysis: report.sentimentAnalysis,
      proctoring_log: report.proctoringLog
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return data.id;
};
