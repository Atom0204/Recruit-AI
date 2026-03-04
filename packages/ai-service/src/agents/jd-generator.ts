import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { normalizeWeights } from "../utils/scoring";

const pickTitle = (resume: ParsedResume, targetRole?: string): string => {
  if (targetRole && targetRole.trim().length > 0) return targetRole.trim();
  const primarySkill = resume.skills.primary[0] ?? "Software";
  const seniority = resume.seniorityLevel.charAt(0).toUpperCase() + resume.seniorityLevel.slice(1);
  return `${seniority} ${primarySkill} Engineer`;
};

/** Build a rich, resume-aware shadow JD that drives question generation. */
export const generateShadowJobDescription = async (
  resume: ParsedResume,
  targetRole?: string
): Promise<ShadowJobDescription> => {
  const weights = normalizeWeights([0.35, 0.25, 0.2, 0.2]);
  const title = pickTitle(resume, targetRole);

  // Derive focus areas from actual resume content
  const projectNames = resume.projects.map((p) => p.name).filter(Boolean);
  const experienceHighlights = resume.experience.flatMap((e) => e.highlights).slice(0, 5);
  const techUsed = [...new Set(resume.experience.flatMap((e) => e.techUsed))].slice(0, 6);
  const allSkills = [...resume.skills.primary, ...resume.skills.secondary];

  // Build interview focus from real resume data
  const interviewFocus: string[] = [];
  if (projectNames.length > 0) interviewFocus.push(`Deep dive into projects: ${projectNames.slice(0, 3).join(", ")}`);
  if (techUsed.length > 0) interviewFocus.push(`Production experience with ${techUsed.slice(0, 4).join(", ")}`);
  if (allSkills.length >= 3) interviewFocus.push(`Core skill verification: ${allSkills.slice(0, 4).join(", ")}`);
  if (experienceHighlights.length > 0) interviewFocus.push("Real-world problem solving from past roles");
  if (interviewFocus.length === 0) interviewFocus.push("General engineering fundamentals", "Problem-solving approach");

  // Build responsibilities from experience context
  const responsibilities: string[] = [
    `Design, build, and maintain production systems using ${allSkills.slice(0, 3).join(", ") || "modern tech stack"}.`,
    "Own end-to-end delivery of features from design to monitoring in production.",
    "Collaborate with cross-functional teams to define requirements and ship iteratively."
  ];
  if (resume.seniorityLevel === "senior" || resume.seniorityLevel === "staff" || resume.seniorityLevel === "principal") {
    responsibilities.push("Mentor junior engineers and drive architectural decisions.");
  }

  return {
    title,
    company: "Northstar Systems",
    department: "Engineering",
    responsibilities,
    requiredSkills: resume.skills.primary.slice(0, 6),
    niceToHaveSkills: [...resume.skills.secondary.slice(0, 4), ...techUsed.slice(0, 2)].slice(0, 6),
    evaluationRubric: [
      {
        category: "Technical Depth",
        weight: weights[0] ?? 0.35,
        criteria: [
          "Core fundamentals of listed skills",
          "Debugging and troubleshooting approach",
          "Trade-off reasoning in real scenarios"
        ]
      },
      {
        category: "System Design",
        weight: weights[1] ?? 0.25,
        criteria: [
          "Architecture decisions in past projects",
          "Scalability and reliability thinking",
          "Data modeling and API design"
        ]
      },
      {
        category: "Problem Solving",
        weight: weights[2] ?? 0.2,
        criteria: [
          "Algorithmic thinking and edge case handling",
          "Iterative problem decomposition",
          "Real examples from projects/experience"
        ]
      },
      {
        category: "Communication",
        weight: weights[3] ?? 0.2,
        criteria: [
          "Structured, clear explanations",
          "Ability to explain technical decisions to non-technical stakeholders",
          "Collaboration mindset and conflict resolution"
        ]
      }
    ],
    interviewFocus,
    difficultyLevel:
      resume.seniorityLevel === "senior" || resume.seniorityLevel === "staff" || resume.seniorityLevel === "principal"
        ? "hard"
        : resume.seniorityLevel === "mid"
          ? "medium"
          : "easy"
  };
};
