export type SeniorityLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal";

export interface ParsedResume {
  candidate: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  seniorityLevel: SeniorityLevel;
  skills: {
    primary: string[];
    secondary: string[];
    soft: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    techUsed: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    techStack: string[];
    impact?: string;
  }>;
  certifications?: string[];
  publications?: string[];
  confidence: number;
}
