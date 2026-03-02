import type { ParsedResume } from "@recruitai/shared";
import { createSupabaseClient } from "../client";

interface CreateCandidateInput {
  userId?: string;
  name: string;
  email?: string;
  resumeUrl?: string;
  parsedResume: ParsedResume;
}

export const createCandidate = async (input: CreateCandidateInput) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      user_id: input.userId ?? null,
      name: input.name,
      email: input.email ?? null,
      resume_url: input.resumeUrl ?? null,
      parsed_resume: input.parsedResume
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create candidate: ${error.message}`);
  }

  return data.id;
};
