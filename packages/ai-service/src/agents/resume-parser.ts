import type { ParsedResume, SeniorityLevel } from "@recruitai/shared";

const inferSeniority = (text: string): SeniorityLevel => {
  const normalized = text.toLowerCase();
  if (normalized.includes("principal") || normalized.includes("architect")) {
    return "principal";
  }
  if (normalized.includes("staff")) {
    return "staff";
  }
  if (normalized.includes("senior")) {
    return "senior";
  }
  if (normalized.includes("lead") || normalized.includes("5+ years")) {
    return "mid";
  }
  if (normalized.includes("intern")) {
    return "intern";
  }
  return "junior";
};

const parseName = (text: string): string => {
  const firstLine = text.split("\n").map((line) => line.trim()).find(Boolean);
  return firstLine ?? "Unknown Candidate";
};

const parseEmail = (text: string): string => {
  const matched = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return matched?.[0] ?? "unknown@example.com";
};

const extractSkills = (text: string): string[] => {
  const knownSkills = [
    "typescript",
    "javascript",
    "react",
    "next.js",
    "node.js",
    "postgresql",
    "python",
    "docker",
    "aws",
    "redis"
  ];
  const normalized = text.toLowerCase();
  return knownSkills
    .filter((skill) => normalized.includes(skill))
    .map((skill) => (skill === "next.js" ? "Next.js" : skill.replace(/(^\w)/, (c) => c.toUpperCase())));
};

export const parseResumeFromText = async (rawText: string): Promise<ParsedResume> => {
  const skills = extractSkills(rawText);

  return {
    candidate: {
      name: parseName(rawText),
      email: parseEmail(rawText)
    },
    summary: rawText.slice(0, 400).trim(),
    seniorityLevel: inferSeniority(rawText),
    skills: {
      primary: skills.slice(0, 5),
      secondary: skills.slice(5),
      soft: ["Communication", "Collaboration"]
    },
    experience: [],
    education: [],
    projects: [],
    confidence: 0.68
  };
};
