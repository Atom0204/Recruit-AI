import type { CodingChallenge, DifficultyLevel, ResumeSkilledChallenge } from "@recruitai/shared";
import type { ParsedResume } from "@recruitai/shared";

/* ─────────────────────────────────────────────────────────────────
   Challenge Bank - Pre-curated challenges for different skills
   ───────────────────────────────────────────────────────────────── */

const CHALLENGE_BANK: Omit<CodingChallenge, "id">[] = [
  // TypeScript / JavaScript challenges
  {
    prompt: "Implement a function to reverse a string",
    description: "Write a function that takes a string and returns it reversed.",
    category: "strings",
    difficulty: "easy",
    language: "typescript",
    starterCode: `export function reverseString(str: string): string {\n  return "";\n}`,
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', explanation: "Reverse each character" },
      { input: '"world"', expectedOutput: '"dlrow"', explanation: "Works for any string" }
    ],
    timeLimit: 600,
    subtopic: "String Manipulation",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.6, efficiency: 0.2, codeQuality: 0.2 }
  },

  {
    prompt: "Find the two sum - Return indices of numbers that add up to target",
    description:
      "Given an array of integers and a target, find two numbers that add up to the target and return their indices.",
    category: "arrays",
    difficulty: "medium",
    language: "typescript",
    starterCode: `export function twoSum(nums: number[], target: number): number[] {\n  return [];\n}`,
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", explanation: "2 + 7 = 9" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", explanation: "2 + 4 = 6" }
    ],
    timeLimit: 900,
    subtopic: "Hash Map / Arrays",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.5, efficiency: 0.35, codeQuality: 0.15 }
  },

  {
    prompt: "Validate balanced parentheses",
    description: "Check if parentheses/brackets are balanced in a string.",
    category: "algorithm",
    difficulty: "medium",
    language: "typescript",
    starterCode: `export function isValid(s: string): boolean {\n  return true;\n}`,
    testCases: [
      { input: '"()"', expectedOutput: "true", explanation: "Simple pair" },
      { input: '"([{}])"', expectedOutput: "true", explanation: "Nested pairs" },
      { input: '"([])}"', expectedOutput: "false", explanation: "Unbalanced" }
    ],
    timeLimit: 900,
    subtopic: "Stack / String",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.6, efficiency: 0.25, codeQuality: 0.15 }
  },

  // Database / SQL challenges
  {
    prompt: "Write SQL query to find top 5 customers by purchase amount",
    description: "Query customers with highest total spending in last 90 days.",
    category: "database",
    difficulty: "medium",
    language: "javascript",
    starterCode: `const query = \`
  SELECT *
  FROM customers
  WHERE 1=1
  LIMIT 5;
\`;`,
    testCases: [
      {
        input: "customers(id, name, spending)",
        expectedOutput: "Returns top 5 by spending",
        explanation: "Order by spending DESC"
      }
    ],
    timeLimit: 1200,
    subtopic: "SQL Query Optimization",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.7, efficiency: 0.2, codeQuality: 0.1 }
  },

  // React / Frontend challenges
  {
    prompt: "Create a React component for a search input with debouncing",
    description: "Build a SearchBox component that debounces API calls.",
    category: "web",
    difficulty: "hard",
    language: "typescript",
    starterCode: `import { useState, useEffect } from 'react';

export function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  return <input type="text" />;
}`,
    testCases: [
      {
        input: "User types 'hello' quickly",
        expectedOutput: "API called only once after delay",
        explanation: "Debounce prevents spam requests"
      }
    ],
    timeLimit: 1800,
    subtopic: "React Hooks & Performance",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.5, efficiency: 0.2, codeQuality: 0.3 }
  },

  // Python challenges
  {
    prompt: "Implement a function to find longest substring without repeating characters",
    description: "Return the length of the longest substring without duplicate characters.",
    category: "strings",
    difficulty: "hard",
    language: "python",
    starterCode: `def lengthOfLongestSubstring(s: str) -> int:\n    return 0`,
    testCases: [
      { input: '"abcabcbb"', expectedOutput: "3", explanation: "abc" },
      { input: '"bbbbb"', expectedOutput: "1", explanation: "b" },
      { input: '"pwwkew"', expectedOutput: "3", explanation: "wke" }
    ],
    timeLimit: 1200,
    subtopic: "Sliding Window",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.6, efficiency: 0.3, codeQuality: 0.1 }
  },

  // System Design / Architecture
  {
    prompt: "Design a URL shortener system architecture",
    description: "Outline the architecture for a service like bit.ly. Include DB schema, API design, and scaling.",
    category: "system_design",
    difficulty: "hard",
    language: "typescript",
    starterCode: `/*
  Design a URL Shortener System
  
  Requirements:
  - Generate short URLs from long URLs
  - Redirect short URLs to original
  - Track analytics (clicks, referrer)
  - Scale to 1M URLs/day
  
  Write your design:
*/`,
    testCases: [
      {
        input: "POST /shorten { url: 'https://example.com/very/long/path' }",
        expectedOutput: '{ shortUrl: "http://short.url/abc123" }',
        explanation: "Generates unique short code"
      }
    ],
    timeLimit: 2400, // 40 min
    subtopic: "System Design",
    aiObservation: true,
    evaluationCriteria: { correctness: 0.4, efficiency: 0.3, codeQuality: 0.3 }
  }
];

/* ─────────────────────────────────────────────────────────────────
   Challenge Generator Service
   ───────────────────────────────────────────────────────────────── */

export function generateChallengeLevelFromSeniority(seniority: string): DifficultyLevel {
  switch (seniority.toLowerCase()) {
    case "intern":
    case "junior":
      return "easy";
    case "mid":
      return "medium";
    case "senior":
    case "staff":
    case "principal":
      return "hard";
    default:
      return "medium";
  }
}

/**
 * Match resume skills to challenges
 * Returns challenges tailored to candidate's background
 */
export function matchChallengesToResume(resume: ParsedResume, count: number = 3): ResumeSkilledChallenge[] {
  const allSkills = [...(resume.skills.primary || []), ...(resume.skills.secondary || [])];
  const difficultyLevel = generateChallengeLevelFromSeniority(resume.seniorityLevel);

  const matchedChallenges: ResumeSkilledChallenge[] = [];

  // Skill to challenge category mapping
  const skillToChallenges: Record<string, string[]> = {
    typescript: ["strings", "arrays", "algorithm"],
    javascript: ["strings", "arrays", "web"],
    react: ["web"],
    "node.js": ["algorithm", "database"],
    python: ["algorithm", "strings", "dp"],
    java: ["arrays", "algorithm", "system_design"],
    sql: ["database"],
    postgresql: ["database"],
    "system design": ["system_design"],
    "c++": ["algorithm", "arrays"],
    rust: ["algorithm"],
    go: ["algorithm", "system_design"]
  };

  // Match each skill to challenges
  for (const skill of allSkills) {
    const skillLower = skill.toLowerCase();
    const categories = skillToChallenges[skillLower] || ["algorithm"];

    for (const category of categories) {
      const matching = CHALLENGE_BANK.filter((c) => c.category === category && c.difficulty === difficultyLevel);

      if (matching.length > 0) {
        const challenge = matching[Math.floor(Math.random() * matching.length)]!;
        const withMeta: ResumeSkilledChallenge = {
          id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: challenge.prompt,
          description: challenge.description,
          category: challenge.category,
          difficulty: challenge.difficulty,
          language: challenge.language,
          starterCode: challenge.starterCode,
          testCases: challenge.testCases,
          timeLimit: challenge.timeLimit,
          subtopic: challenge.subtopic,
          aiObservation: challenge.aiObservation,
          evaluationCriteria: challenge.evaluationCriteria ?? { correctness: 0.6, efficiency: 0.2, codeQuality: 0.2 },
          resumeSkillMatch: skill,
          suitabilityScore: 0.8 + Math.random() * 0.2, // 0.8-1.0
          reasoningBrief: `Aligns with your ${skill} expertise at ${difficultyLevel} level`
        };

        if (!matchedChallenges.find((mc) => mc.id === challenge.prompt)) {
          matchedChallenges.push(withMeta);
        }
      }
    }

    if (matchedChallenges.length >= count) break;
  }

  // If not enough matched, add general challenges
  while (matchedChallenges.length < count) {
    const remaining = CHALLENGE_BANK.filter(
      (c) => c.difficulty === difficultyLevel && !matchedChallenges.find((mc) => mc.prompt === c.prompt)
    );
    if (remaining.length === 0) break;

    const challenge = remaining[Math.floor(Math.random() * remaining.length)]!;
    const withMeta: ResumeSkilledChallenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prompt: challenge.prompt,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      language: challenge.language,
      starterCode: challenge.starterCode,
      testCases: challenge.testCases,
      timeLimit: challenge.timeLimit,
      subtopic: challenge.subtopic,
      aiObservation: challenge.aiObservation,
      evaluationCriteria: challenge.evaluationCriteria ?? { correctness: 0.6, efficiency: 0.2, codeQuality: 0.2 },
      resumeSkillMatch: "General",
      suitabilityScore: 0.7,
      reasoningBrief: `Recommended at ${difficultyLevel} difficulty`
    };
    matchedChallenges.push(withMeta);
  }

  return matchedChallenges.slice(0, count);
}

/**
 * Get a single challenge by difficulty and skill
 */
export function getChallengeForSkill(skill: string, difficulty: DifficultyLevel): CodingChallenge {
  const skillKey = skill.trim().toLowerCase();
  const topicToCategories: Record<string, Array<CodingChallenge["category"]>> = {
    arrays: ["arrays", "sorting", "algorithm"],
    strings: ["strings", "algorithm"],
    trees: ["trees", "algorithm"],
    graphs: ["graphs", "algorithm"],
    "dynamic programming": ["dp", "algorithm"],
    sorting: ["sorting", "arrays", "algorithm"],
    dsa: ["arrays", "strings", "trees", "graphs", "dp", "sorting", "algorithm"]
  };

  const preferredCategories = topicToCategories[skillKey] ?? ["algorithm"];
  const categoryMatched = CHALLENGE_BANK.filter(
    (c) => c.difficulty === difficulty && preferredCategories.includes(c.category)
  );
  const filtered = categoryMatched.length > 0
    ? categoryMatched
    : CHALLENGE_BANK.filter((c) => c.difficulty === difficulty);

  if (filtered.length === 0) {
    // Fallback to any challenge
    const fallback = CHALLENGE_BANK[0]!;
    return {
      id: `challenge-fallback-${Date.now()}`,
      prompt: fallback.prompt,
      description: fallback.description,
      category: fallback.category,
      difficulty: fallback.difficulty,
      language: fallback.language,
      starterCode: fallback.starterCode,
      testCases: fallback.testCases,
      timeLimit: fallback.timeLimit,
      subtopic: fallback.subtopic,
      aiObservation: fallback.aiObservation,
      evaluationCriteria: fallback.evaluationCriteria ?? { correctness: 0.6, efficiency: 0.2, codeQuality: 0.2 }
    };
  }

  const selected = filtered[Math.floor(Math.random() * filtered.length)]!;
  return {
    id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    prompt: selected.prompt,
    description: selected.description,
    category: selected.category,
    difficulty: selected.difficulty,
    language: selected.language,
    starterCode: selected.starterCode,
    testCases: selected.testCases,
    timeLimit: selected.timeLimit,
    subtopic: selected.subtopic,
    aiObservation: selected.aiObservation,
    evaluationCriteria: selected.evaluationCriteria ?? { correctness: 0.6, efficiency: 0.2, codeQuality: 0.2 }
  };
}

/**
 * Generate interview script with coding challenges
 */
export function buildCodingInterviewScript(resume: ParsedResume): CodingChallenge[] {
  const difficulty = generateChallengeLevelFromSeniority(resume.seniorityLevel);
  const challenges = matchChallengesToResume(resume, 2);

  return challenges;
}

/**
 * Generate a coding challenge prompt for Gemini
 * Returns the prompt string that will be sent to Gemini API
 */
export function buildCodingChallengePrompt(topic: string, difficulty: DifficultyLevel): string {
  const difficultyDesc = {
    easy: "basic fundamentals, single concept, 1-2 operations",
    medium: "intermediate concepts, some edge cases, multiple operations",
    hard: "advanced algorithms, optimization focus, complex logic"
  };

  return `You are an expert programming instructor. Generate a single DSA (Data Structures & Algorithms) coding challenge.

Topic: ${topic}
Difficulty: ${difficulty} (${difficultyDesc[difficulty]})

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "prompt": "Brief problem title (max 80 chars)",
  "description": "Detailed problem description (2-3 sentences explaining what to implement)",
  "category": "arrays|strings|trees|graphs|dp|sorting|algorithm|system_design|database|web",
  "language": "typescript",
  "subtopic": "Specific algorithm/technique being tested",
  "starterCode": "export function solve(input: any): any {\\n  return null;\\n}",
  "testCases": [
    {
      "input": "example input value",
      "expectedOutput": "expected output value",
      "explanation": "why this output is correct"
    }
  ],
  "timeLimit": 600,
  "aiObservation": true,
  "evaluationCriteria": {
    "correctness": 0.6,
    "efficiency": 0.25,
    "codeQuality": 0.15
  }
}

Generate a fresh, original problem fitting the ${difficulty} level and ${topic} topic.`;
}
