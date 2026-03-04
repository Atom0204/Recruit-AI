import type { ParsedResume, SeniorityLevel } from "@recruitai/shared";

/* ── helpers ─────────────────────────────────────────────────────── */

const inferSeniority = (text: string): SeniorityLevel => {
  const n = text.toLowerCase();
  if (n.includes("principal") || n.includes("architect") || n.includes("distinguished")) return "principal";
  if (n.includes("staff")) return "staff";
  if (/\bsenior\b/.test(n) || /\bsr\.?\b/.test(n) || /8\+?\s*years|9\+?\s*years|10\+?\s*years/.test(n)) return "senior";
  if (/\blead\b/.test(n) || /5\+?\s*years|6\+?\s*years|7\+?\s*years/.test(n)) return "mid";
  if (/\bintern\b/.test(n) || /\btrainee\b/.test(n)) return "intern";
  // Default: check for year-count signals
  if (/[3-4]\+?\s*years/.test(n)) return "mid";
  if (/[1-2]\+?\s*years/.test(n)) return "junior";
  return "junior";
};

const parseName = (text: string): string => {
  // Cleaned-up lines: skip blanks and very short / all-symbol lines
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 1);
  for (const line of lines.slice(0, 10)) {
    // Skip lines that look like section headers, emails, URLs, phone numbers
    if (/^(summary|experience|education|skills|projects|objective|contact|profile)/i.test(line)) continue;
    if (/^[+\d()\s-]{7,}$/.test(line)) continue; // phone-only line
    if (/^https?:\/\//i.test(line)) continue;
    if (/@/.test(line) && !/\s/.test(line)) continue; // lone email
    // A name is typically 2-4 words, all alphabetical (possibly with hyphens/dots)
    if (/^[A-Za-z][A-Za-z.\-' ]{1,60}$/.test(line) && line.split(/\s+/).length <= 5) {
      return line;
    }
  }
  return lines[0] ?? "Unknown Candidate";
};

const parseEmail = (text: string): string => {
  const matched = text.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  return matched?.[0] ?? "unknown@example.com";
};

const parsePhone = (text: string): string | undefined => {
  const matched = text.match(/(?:\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/);
  return matched?.[0]?.trim();
};

const parseLinkedIn = (text: string): string | undefined => {
  const matched = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-]+\/?/i);
  return matched?.[0];
};

const parseGitHub = (text: string): string | undefined => {
  const matched = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-]+\/?/i);
  return matched?.[0];
};

const parsePortfolio = (text: string): string | undefined => {
  // Match URLs not linkedin/github
  const urls = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return urls.find(
    (u) => !u.includes("linkedin.com") && !u.includes("github.com") && !u.includes("mailto:")
  );
};

/* ── skills (expanded) ───────────────────────────────────────────── */

const SKILL_MAP: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  react: "React",
  "react.js": "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  express: "Express",
  "express.js": "Express",
  python: "Python",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  java: "Java",
  kotlin: "Kotlin",
  "c++": "C++",
  "c#": "C#",
  rust: "Rust",
  go: "Go",
  golang: "Go",
  swift: "Swift",
  ruby: "Ruby",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  sass: "Sass",
  scss: "Sass",
  vue: "Vue.js",
  "vue.js": "Vue.js",
  angular: "Angular",
  svelte: "Svelte",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  firebase: "Firebase",
  supabase: "Supabase",
  prisma: "Prisma",
  drizzle: "Drizzle",
  graphql: "GraphQL",
  "rest api": "REST API",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  vercel: "Vercel",
  netlify: "Netlify",
  terraform: "Terraform",
  jenkins: "Jenkins",
  "ci/cd": "CI/CD",
  git: "Git",
  linux: "Linux",
  nginx: "Nginx",
  kafka: "Kafka",
  rabbitmq: "RabbitMQ",
  elasticsearch: "Elasticsearch",
  "machine learning": "Machine Learning",
  "deep learning": "Deep Learning",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  pandas: "Pandas",
  numpy: "NumPy",
  scikit: "Scikit-learn",
  opencv: "OpenCV",
  "natural language processing": "NLP",
  nlp: "NLP",
  langchain: "LangChain",
  openai: "OpenAI API",
  figma: "Figma",
  jira: "Jira",
  agile: "Agile",
  scrum: "Scrum",
};

const SOFT_SKILLS = [
  "leadership",
  "communication",
  "teamwork",
  "collaboration",
  "problem solving",
  "problem-solving",
  "critical thinking",
  "time management",
  "mentoring",
  "mentorship",
  "public speaking",
  "presentation",
  "analytical",
  "adaptability",
  "creativity",
];

const extractSkills = (text: string): { primary: string[]; secondary: string[]; soft: string[] } => {
  const normalized = text.toLowerCase();
  const found = new Set<string>();

  for (const [keyword, label] of Object.entries(SKILL_MAP)) {
    // Word-boundary check to avoid false positives (e.g. "go" inside "google")
    const re = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    if (re.test(normalized)) found.add(label);
  }

  const unique = [...found];
  const soft = SOFT_SKILLS.filter((s) => normalized.includes(s)).map(
    (s) => s.replace(/(^|\s)\w/g, (c) => c.toUpperCase())
  );

  return {
    primary: unique.slice(0, 8),
    secondary: unique.slice(8),
    soft: soft.length > 0 ? [...new Set(soft)] : ["Communication", "Collaboration"],
  };
};

/* ── section extraction helpers ──────────────────────────────────── */

const sectionRegex = (headers: string[]) =>
  new RegExp(`(?:^|\\n)\\s*(?:${headers.join("|")})\\s*[:\\n]`, "i");

const extractSection = (text: string, headers: string[]): string => {
  const startMatch = text.match(sectionRegex(headers));
  if (!startMatch || startMatch.index == null) return "";
  const start = startMatch.index + startMatch[0].length;
  // Find next section header
  const allHeaders = [
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "publications",
    "awards",
    "summary",
    "objective",
    "profile",
    "contact",
    "references",
    "achievements",
    "interests",
    "languages",
    "volunteer",
    "work history",
    "professional experience",
    "technical skills",
  ];
  const rest = text.slice(start);
  const endMatch = rest.match(
    new RegExp(`\\n\\s*(?:${allHeaders.filter((h) => !headers.includes(h)).join("|")})\\s*[:\\n]`, "i")
  );
  return rest.slice(0, endMatch?.index ?? rest.length).trim();
};

const parseExperience = (text: string): ParsedResume["experience"] => {
  const section = extractSection(text, [
    "experience",
    "work history",
    "professional experience",
    "employment",
    "work experience",
  ]);
  if (!section) return [];

  // Split on patterns like "Company Name" or date ranges
  const entries = section.split(/\n(?=[A-Z][^\n]{2,60}\n)/).filter(Boolean);
  return entries.slice(0, 5).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const company = lines[0] ?? "Unknown Company";
    const role = lines[1] ?? "";
    const duration = (lines.find((l) => /\d{4}|present|current/i.test(l)) ?? "").trim();
    const highlights = lines.slice(2).filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("–")).map((l) =>
      l.replace(/^[•\-–]\s*/, "")
    );
    return { company, role, duration, highlights, techUsed: [] };
  });
};

const parseEducation = (text: string): ParsedResume["education"] => {
  const section = extractSection(text, ["education", "academic", "academics"]);
  if (!section) return [];

  const entries = section.split(/\n(?=[A-Z])/).filter(Boolean);
  return entries.slice(0, 4).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const institution = lines[0] ?? "Unknown Institution";
    const degree = lines[1] ?? "";
    const yearMatch = block.match(/\b(19|20)\d{2}\b/);
    const gpaMatch = block.match(/(?:gpa|cgpa|grade)[:\s]*([0-9.]+)/i);
    return {
      institution,
      degree,
      year: yearMatch?.[0] ?? "",
      ...(gpaMatch?.[1] ? { gpa: gpaMatch[1] } : {}),
    };
  });
};

const parseProjects = (text: string): ParsedResume["projects"] => {
  const section = extractSection(text, ["projects", "personal projects", "side projects"]);
  if (!section) return [];

  const entries = section.split(/\n(?=[A-Z])/).filter(Boolean);
  return entries.slice(0, 5).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const name = lines[0] ?? "Untitled Project";
    const description = lines.slice(1, 3).join(" ");
    return { name, description, techStack: [] };
  });
};

const parseCertifications = (text: string): string[] | undefined => {
  const section = extractSection(text, ["certifications", "certificates", "licenses"]);
  if (!section) return undefined;
  const items = section.split("\n").map((l) => l.trim().replace(/^[•\-–]\s*/, "")).filter(Boolean);
  return items.length > 0 ? items.slice(0, 10) : undefined;
};

const buildSummary = (text: string): string => {
  // Try to find a summary/objective section first
  const summarySection = extractSection(text, ["summary", "objective", "profile", "about me", "about"]);
  if (summarySection) return summarySection.slice(0, 500).trim();

  // Fallback: use first ~400 chars of cleaned text (skip the name line)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(1, 8).join(" ").slice(0, 400).trim();
};

/* ── main export ─────────────────────────────────────────────────── */

export const parseResumeFromText = async (rawText: string): Promise<ParsedResume> => {
  const skills = extractSkills(rawText);
  const experience = parseExperience(rawText);
  const education = parseEducation(rawText);
  const projects = parseProjects(rawText);
  const certifications = parseCertifications(rawText);

  // Confidence heuristic: more sections found → higher confidence
  let confidence = 0.4;
  if (experience.length > 0) confidence += 0.15;
  if (education.length > 0) confidence += 0.1;
  if (skills.primary.length > 2) confidence += 0.1;
  if (projects.length > 0) confidence += 0.1;
  if (parseEmail(rawText) !== "unknown@example.com") confidence += 0.05;
  confidence = Math.min(confidence, 0.95);

  const candidate: ParsedResume["candidate"] = {
    name: parseName(rawText),
    email: parseEmail(rawText),
  };
  const phone = parsePhone(rawText);
  if (phone) candidate.phone = phone;
  const linkedIn = parseLinkedIn(rawText);
  if (linkedIn) candidate.linkedIn = linkedIn;
  const github = parseGitHub(rawText);
  if (github) candidate.github = github;
  const portfolio = parsePortfolio(rawText);
  if (portfolio) candidate.portfolio = portfolio;

  return {
    candidate,
    summary: buildSummary(rawText),
    seniorityLevel: inferSeniority(rawText),
    skills,
    experience,
    education,
    projects,
    ...(certifications ? { certifications } : {}),
    confidence: Math.round(confidence * 100) / 100,
  };
};
