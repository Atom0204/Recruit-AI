import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { normalizeWeights } from "../utils/scoring";

const pickTitle = (resume: ParsedResume, targetRole?: string): string => {
  if (targetRole && targetRole.trim().length > 0) {
    return targetRole.trim();
  }
  const primarySkill = resume.skills.primary[0] ?? "Software";
  const seniority = resume.seniorityLevel.charAt(0).toUpperCase() + resume.seniorityLevel.slice(1);
  return `${seniority} ${primarySkill} Engineer`;
};

export const generateShadowJobDescription = async (
  resume: ParsedResume,
  targetRole?: string
): Promise<ShadowJobDescription> => {
  const weights = normalizeWeights([0.35, 0.25, 0.2, 0.2]);

  return {
    title: pickTitle(resume, targetRole),
    company: "Northstar Systems",
    department: "Engineering",
    responsibilities: [
      "Build and maintain production-grade web services.",
      "Collaborate across product, design, and data teams.",
      "Improve reliability, testing, and deployment workflows."
    ],
    requiredSkills: resume.skills.primary.slice(0, 6),
    niceToHaveSkills: [...resume.skills.secondary.slice(0, 4), "Mentorship", "System Design"],
    evaluationRubric: [
      {
        category: "Technical Depth",
        weight: weights[0] ?? 0.35,
        criteria: ["Core fundamentals", "Debugging approach", "Trade-off reasoning"]
      },
      {
        category: "System Design",
        weight: weights[1] ?? 0.25,
        criteria: ["Scalability", "Reliability", "Data consistency"]
      },
      {
        category: "Problem Solving",
        weight: weights[2] ?? 0.2,
        criteria: ["Clarity", "Edge case handling", "Iteration speed"]
      },
      {
        category: "Communication",
        weight: weights[3] ?? 0.2,
        criteria: ["Structured responses", "Collaboration mindset", "Stakeholder awareness"]
      }
    ],
    interviewFocus: ["Architecture trade-offs", "API/backend depth", "Execution ownership"],
    difficultyLevel:
      resume.seniorityLevel === "senior" || resume.seniorityLevel === "staff" || resume.seniorityLevel === "principal"
        ? "hard"
        : "medium"
  };
};
