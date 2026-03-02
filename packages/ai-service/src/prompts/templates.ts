export const PROMPTS = {
  resumeParsing:
    "Extract a strict JSON object from resume text. Return only valid JSON that matches the ParsedResume contract.",
  shadowJd:
    "Generate a realistic job description, evaluation rubric with normalized weights, and interview focus areas.",
  interviewer:
    "Generate interview questions that map to rubric categories and adapt follow-ups by answer quality.",
  report:
    "Generate a candidate fit report with weighted scoring and concise feedback."
} as const;
