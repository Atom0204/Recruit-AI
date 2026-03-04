export const PROMPTS = {
  resumeParsing:
    "Extract structured data from resume text: candidate info (name, email, phone, links), skills (primary, secondary, soft), experience (company, role, duration, highlights, tech used), education, projects, certifications. Return valid JSON matching the ParsedResume contract.",
  shadowJd:
    "Generate a resume-aware job description with responsibilities derived from actual experience, skill-specific evaluation rubric with normalized weights, and interview focus areas targeting the candidate's listed projects and tech stack.",
  interviewer:
    "Generate 10 interview questions that progress from basic fundamentals → intermediate application → advanced deep-dives. Questions must reference the candidate's specific projects, skills, and experience. Include icebreaker, technical (per-skill), system design, problem solving, behavioral, and reflection questions. Adapt follow-ups based on answer quality using STAR-format requests, metric probing, and edge-case exploration.",
  report:
    "Generate a candidate fit report with: weighted category scoring based on signal analysis (technical depth, structure, specificity, collaboration), per-question sentiment tracking derived from actual answer content, context-aware recommended resources for weak areas, and communication quality assessment."
} as const;
