import type {
  BranchDecision,
  CandidateResponse,
  InterviewQuestion,
  InterviewState,
  ParsedResume,
  ShadowJobDescription
} from "@recruitai/shared";

/* ──────────────────────────────────────────────────────────────────
   Question builder — generates resume-specific questions that
   progress from basic → intermediate → advanced → expert.
   ────────────────────────────────────────────────────────────────── */

const safe = (value: string | undefined, fallback: string): string =>
  value && value.trim().length > 0 ? value.trim() : fallback;

export const buildInterviewScript = async (
  resume: ParsedResume,
  jd: ShadowJobDescription
): Promise<InterviewQuestion[]> => {
  const questions: InterviewQuestion[] = [];
  let qIndex = 0;
  const qId = () => `q${++qIndex}`;

  const primary = resume.skills.primary;
  const secondary = resume.skills.secondary;
  const allSkills = [...primary, ...secondary];
  const projects = resume.projects;
  const experience = resume.experience;
  const education = resume.education;

  const skill1 = safe(primary[0], "your primary technology");
  const skill2 = safe(primary[1], safe(secondary[0], "your secondary skill"));
  const skill3 = safe(primary[2], safe(secondary[1], "backend systems"));

  const project1 = projects[0];
  const project2 = projects[1];
  const exp1 = experience[0];
  const exp2 = experience[1];

  /* ── 1. ICEBREAKER (difficulty 1) — warm up, reference their background ── */
  if (exp1) {
    questions.push({
      id: qId(),
      type: "icebreaker",
      prompt: `I see you worked at ${exp1.company} as ${exp1.role}. Walk me through what you did there day-to-day and what you're most proud of from that experience.`,
      expectedSignals: ["Clarity", "Ownership", "Impact awareness", "Communication"],
      difficulty: 1,
      timeLimitSeconds: 180
    });
  } else if (project1) {
    questions.push({
      id: qId(),
      type: "icebreaker",
      prompt: `Tell me about your project "${project1.name}". What problem were you solving, what did you build, and what was the outcome?`,
      expectedSignals: ["Clarity", "Ownership", "Technical context", "Impact"],
      difficulty: 1,
      timeLimitSeconds: 180
    });
  } else {
    questions.push({
      id: qId(),
      type: "icebreaker",
      prompt: `Walk me through your background and what motivated you to apply for a ${jd.title} role. What's a piece of work you're most proud of?`,
      expectedSignals: ["Self-awareness", "Motivation", "Communication"],
      difficulty: 1,
      timeLimitSeconds: 180
    });
  }

  /* ── 2. BASIC TECHNICAL (difficulty 1-2) — fundamentals of their primary skill ── */
  questions.push({
    id: qId(),
    type: "technical",
    prompt: buildBasicTechnicalQuestion(skill1),
    expectedSignals: ["Fundamental understanding", "Correct terminology", "Conceptual clarity"],
    difficulty: 1,
    timeLimitSeconds: 240
  });

  /* ── 3. INTERMEDIATE TECHNICAL (difficulty 2) — apply skill to a real scenario ── */
  if (project1) {
    const techCtx = project1.techStack.length > 0 ? ` (using ${project1.techStack.slice(0, 3).join(", ")})` : "";
    questions.push({
      id: qId(),
      type: "technical",
      prompt: `In your project "${project1.name}"${techCtx}, what was the hardest technical challenge you faced? Walk me through how you identified the problem, what solutions you considered, and why you picked the approach you did.`,
      expectedSignals: ["Debugging methodology", "Trade-off analysis", "Technical depth", "Decision rationale"],
      difficulty: 2,
      timeLimitSeconds: 300
    });
  } else {
    questions.push({
      id: qId(),
      type: "technical",
      prompt: `You listed ${skill1} and ${skill2} on your resume. Describe a time you had to choose between two approaches using these technologies. What were the trade-offs and how did you decide?`,
      expectedSignals: ["Trade-off analysis", "Practical experience", "Decision-making"],
      difficulty: 2,
      timeLimitSeconds: 300
    });
  }

  /* ── 4. SECOND SKILL DEEP-DIVE (difficulty 2) ── */
  questions.push({
    id: qId(),
    type: "technical",
    prompt: buildIntermediateTechnicalQuestion(skill2, skill1),
    expectedSignals: ["Breadth of knowledge", "Practical application", "Integration thinking"],
    difficulty: 2,
    timeLimitSeconds: 300
  });

  /* ── 5. PROJECT-SPECIFIC or EXPERIENCE-SPECIFIC (difficulty 2-3) ── */
  if (project2) {
    questions.push({
      id: qId(),
      type: "problem_solving",
      prompt: `Let's talk about "${project2.name}". ${project2.description ? `You described it as: "${project2.description.slice(0, 150)}".` : ""} If you had to rebuild this from scratch today with everything you've learned, what would you change architecturally and why?`,
      expectedSignals: ["Reflection", "Growth mindset", "Architectural reasoning", "Self-critique"],
      difficulty: 3,
      timeLimitSeconds: 360
    });
  } else if (exp2) {
    questions.push({
      id: qId(),
      type: "problem_solving",
      prompt: `At ${exp2.company}, what was a production incident or critical bug you dealt with? Take me through the timeline: detection, diagnosis, fix, and how you prevented it from happening again.`,
      expectedSignals: ["Incident response", "Root cause analysis", "Prevention mindset"],
      difficulty: 3,
      timeLimitSeconds: 360
    });
  } else {
    questions.push({
      id: qId(),
      type: "problem_solving",
      prompt: `Describe the most complex bug or performance issue you've debugged. Walk me through your debugging process step by step — tools used, hypotheses tested, and the final root cause.`,
      expectedSignals: ["Debugging methodology", "Systematic thinking", "Tool awareness"],
      difficulty: 3,
      timeLimitSeconds: 360
    });
  }

  /* ── 6. SYSTEM DESIGN (difficulty 3) — tied to their actual tech stack ── */
  const designStack = allSkills.slice(0, 4).join(", ") || "the technologies you work with";
  questions.push({
    id: qId(),
    type: "system_design",
    prompt: `Design a simplified version of a system relevant to your experience — using ${designStack}. It should handle: user authentication, real-time data processing, and a dashboard with analytics. Walk me through your architecture, data flow, and how you'd handle failures.`,
    expectedSignals: ["Architecture clarity", "Scalability thinking", "Failure handling", "Data modeling"],
    difficulty: 3,
    timeLimitSeconds: 480
  });

  /* ── 7. ADVANCED TECHNICAL (difficulty 3-4) — push depth on their strongest skill ── */
  questions.push({
    id: qId(),
    type: "technical",
    prompt: buildAdvancedTechnicalQuestion(skill1),
    expectedSignals: ["Deep expertise", "Edge case awareness", "Performance optimization", "Production readiness"],
    difficulty: 4,
    timeLimitSeconds: 360
  });

  /* ── 8. PROBLEM SOLVING — ALGORITHMIC (difficulty 3) ── */
  questions.push({
    id: qId(),
    type: "problem_solving",
    prompt: `Given a scenario where you need to process ${skill3 !== "backend systems" ? `data from a ${skill3} pipeline` : "a large stream of incoming events"} and detect anomalies in near-real-time: how would you approach this? Explain your algorithm, data structures, and the time/space complexity trade-offs.`,
    expectedSignals: ["Algorithmic thinking", "Complexity analysis", "Practical optimization"],
    difficulty: 3,
    timeLimitSeconds: 360
  });

  /* ── 9. BEHAVIORAL / CULTURE (difficulty 2) ── */
  questions.push({
    id: qId(),
    type: "culture_fit",
    prompt: resume.seniorityLevel === "senior" || resume.seniorityLevel === "staff" || resume.seniorityLevel === "principal"
      ? "Tell me about a time you had to push back on a technical decision from leadership or a senior colleague. How did you handle the disagreement, and what was the outcome?"
      : "Tell me about a time you were stuck on a problem and had to ask for help. How did you approach it, what did you learn, and how did it change how you work?",
    expectedSignals: ["Self-awareness", "Collaboration", "Growth mindset", "Conflict resolution"],
    difficulty: 2,
    timeLimitSeconds: 240
  });

  /* ── 10. CLOSING — REFLECTION (difficulty 1) ── */
  const techList = allSkills.slice(0, 3).join(", ") || "your skills";
  questions.push({
    id: qId(),
    type: "culture_fit",
    prompt: `Last question: Looking at your experience with ${techList} — what's one area where you feel you still have the most to learn? And what are you doing about it?`,
    expectedSignals: ["Self-awareness", "Learning orientation", "Honesty", "Growth trajectory"],
    difficulty: 1,
    timeLimitSeconds: 180
  });

  return questions;
};

/* ── Helper: generate skill-specific questions at different difficulty tiers ── */

function buildBasicTechnicalQuestion(skill: string): string {
  const s = skill.toLowerCase();

  if (s.includes("react") || s.includes("next"))
    return `Let's start with the basics of ${skill}. Explain the component lifecycle, how state management works, and the difference between client-side and server-side rendering. When would you choose one over the other?`;

  if (s.includes("typescript") || s.includes("javascript"))
    return `Walk me through the fundamentals of ${skill}. Explain the event loop, closures, and prototypal inheritance. How does ${skill}'s type system help you catch bugs?`;

  if (s.includes("python"))
    return `Let's cover ${skill} fundamentals. Explain the GIL, how memory management works, and the difference between a list, tuple, and set. When would you use each?`;

  if (s.includes("node"))
    return `Explain how ${skill} handles concurrency. What's the event loop, how do streams work, and what's the difference between worker threads and child processes?`;

  if (s.includes("docker") || s.includes("kubernetes"))
    return `Explain the core concepts of ${skill}. What problem does containerization solve? Walk me through creating a production-ready container — layers, multi-stage builds, and how you'd handle secrets.`;

  if (s.includes("aws") || s.includes("gcp") || s.includes("azure"))
    return `You listed ${skill} on your resume. Explain the core services you've used — compute, storage, networking. How do you approach IAM and least-privilege access in your deployments?`;

  if (s.includes("postgres") || s.includes("mysql") || s.includes("sql"))
    return `Let's talk ${skill} fundamentals. Explain indexing strategies, the difference between a B-tree and a hash index, and when you'd use transactions vs. eventual consistency.`;

  if (s.includes("mongo"))
    return `Explain when you'd choose ${skill} over a relational database. How does the document model affect your schema design, and what are the trade-offs with denormalization?`;

  if (s.includes("redis"))
    return `What data structures does ${skill} offer beyond simple key-value? Explain how you'd use sorted sets, pub/sub, and streams. What are the eviction policies and when do they matter?`;

  if (s.includes("java") || s.includes("kotlin"))
    return `Cover the fundamentals of ${skill}. Explain the JVM memory model, garbage collection strategies, and the difference between concurrency primitives like synchronized, volatile, and locks.`;

  if (s.includes("go") || s.includes("golang"))
    return `Explain goroutines vs OS threads, channels, and how ${skill}'s runtime scheduler works. How does the garbage collector differ from more traditional VMs?`;

  if (s.includes("rust"))
    return `Explain ${skill}'s ownership model, borrowing rules, and lifetimes. Why do these matter for memory safety, and how do they compare to garbage-collected languages?`;

  if (s.includes("machine learning") || s.includes("ml") || s.includes("deep learning"))
    return `Let's start with ${skill} basics. Explain the bias-variance tradeoff, overfitting vs underfitting, and how you decide between different model architectures for a given problem.`;

  if (s.includes("graphql"))
    return `Explain the core differences between ${skill} and REST. How do resolvers work, what's the N+1 problem in ${skill}, and how do you handle authorization at the field level?`;

  if (s.includes("vue") || s.includes("angular") || s.includes("svelte"))
    return `Walk me through the core concepts of ${skill} — reactivity system, component lifecycle, and state management. How does ${skill} handle rendering compared to React?`;

  // Generic fallback
  return `Let's verify your fundamentals in ${skill}. Explain the core concepts, common patterns, and a typical mistake beginners make. How would you explain ${skill} to someone new to it?`;
}

function buildIntermediateTechnicalQuestion(skill: string, primarySkill: string): string {
  const s = skill.toLowerCase();

  if (s.includes("react") || s.includes("next") || s.includes("vue") || s.includes("angular") || s.includes("svelte"))
    return `How do you handle state that needs to be shared across deeply nested components in ${skill}? Compare the trade-offs between context/providers, state libraries, and URL-based state. What do you use in production and why?`;

  if (s.includes("docker") || s.includes("kubernetes") || s.includes("k8s"))
    return `How do you set up a CI/CD pipeline using ${skill}? Walk me through your approach to zero-downtime deployments, rollback strategies, and how you handle database migrations during deploys.`;

  if (s.includes("postgres") || s.includes("mysql") || s.includes("mongo") || s.includes("sql") || s.includes("redis"))
    return `How do you optimize ${skill} query performance in a production system? Walk me through your approach: profiling, indexing strategy, connection pooling, and how you detect slow queries before users notice.`;

  if (s.includes("aws") || s.includes("gcp") || s.includes("azure") || s.includes("terraform"))
    return `Describe how you'd design a multi-region deployment on ${skill}. How do you handle data replication, failover, and cost optimization? What monitoring would you set up?`;

  if (s.includes("python") || s.includes("django") || s.includes("flask") || s.includes("fastapi"))
    return `How do you structure a production ${skill} application for maintainability? Walk me through your approach to dependency management, testing strategy, and how you handle async operations.`;

  // Generic
  return `You listed both ${skill} and ${primarySkill}. How do these work together in your projects? Describe a scenario where integrating them was challenging and how you solved it.`;
}

function buildAdvancedTechnicalQuestion(skill: string): string {
  const s = skill.toLowerCase();

  if (s.includes("react") || s.includes("next"))
    return `Let's go deep on ${skill} performance. Explain the reconciliation algorithm, how React Fiber works, and your strategies for avoiding unnecessary re-renders in a large app. How do you profile and fix render bottlenecks?`;

  if (s.includes("typescript"))
    return `Walk me through advanced ${skill}: conditional types, template literal types, and the infer keyword. Give me a real example where the type system caught a bug that unit tests wouldn't have.`;

  if (s.includes("javascript"))
    return `Explain the V8 engine's optimization pipeline — hidden classes, inline caching, and deoptimization. How do you write ${skill} that the JIT compiler can optimize well?`;

  if (s.includes("python"))
    return `How would you optimize a CPU-bound ${skill} workload for production? Compare multiprocessing, asyncio, and C extensions. Walk me through profiling a real bottleneck.`;

  if (s.includes("node"))
    return `How do you handle backpressure in ${skill} streams? Explain the internal buffering mechanism, highWaterMark, and how you'd build a production pipeline that processes millions of records without running out of memory.`;

  if (s.includes("postgres") || s.includes("sql"))
    return `Explain query planning in ${skill}. How do you read and optimize an EXPLAIN ANALYZE output? Walk through a real scenario where you improved a slow query and the thought process behind your index choices.`;

  if (s.includes("docker") || s.includes("kubernetes"))
    return `How do you handle stateful workloads in ${skill}? Explain persistent volumes, StatefulSets, and the challenges of running databases in containers. When would you avoid containerizing a service?`;

  if (s.includes("aws"))
    return `Design a cost-optimized, highly available architecture on ${skill} for a write-heavy application with 10K requests/second. Cover compute, storage, caching, and how you'd handle a region-level outage.`;

  // Generic
  return `What's the most advanced or unusual thing you've built with ${skill}? Walk me through the architecture, the hardest problem you solved, and what you'd do differently with 20/20 hindsight.`;
}

/* ──────────────────────────────────────────────────────────────────
   Branch decision — adaptive follow-ups based on answer quality
   ────────────────────────────────────────────────────────────────── */

const estimateAnswerQuality = (response: CandidateResponse): number => {
  const text = response.text.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Very short or empty answers are poor
  if (wordCount < 10) return 0.1;

  let score = 0;

  // Length contributes (diminishing returns after 120 words)
  score += Math.min(0.3, (wordCount / 120) * 0.3);

  // Structure signals (STAR, numbered points, cause-and-effect)
  const structurePatterns = /\b(first|second|third|finally|because|therefore|as a result|for example|specifically|in particular|the reason|trade-?off|approach|solution|alternatively)\b/gi;
  const structureHits = (text.match(structurePatterns) ?? []).length;
  score += Math.min(0.2, structureHits * 0.04);

  // Technical depth signals
  const technicalPatterns = /\b(latency|throughput|cache|index|query|api|endpoint|architecture|database|schema|deploy|ci\/cd|monitoring|test|debug|profil|optimiz|algorithm|complex|o\(|big-?o|scale|concurrent|async|await|promise|thread|mutex|lock|queue|stack|heap|tree|graph|hash)\b/gi;
  const techHits = (text.match(technicalPatterns) ?? []).length;
  score += Math.min(0.25, techHits * 0.03);

  // Specificity signals (numbers, metrics, tool/technology names)
  const specificityPatterns = /\b(\d+%|\d+ms|\d+s|\d+x|\d+ users|\d+ requests|p95|p99|sla|slo|redis|postgres|kafka|docker|kubernetes|aws|gcp|react|node|python)\b/gi;
  const specificHits = (text.match(specificityPatterns) ?? []).length;
  score += Math.min(0.15, specificHits * 0.03);

  // Self-reflection / learning signals
  const reflectionPatterns = /\b(learned|mistake|improved|next time|differently|retrospect|hindsight|evolved|realized|discovered)\b/gi;
  const reflectHits = (text.match(reflectionPatterns) ?? []).length;
  score += Math.min(0.1, reflectHits * 0.03);

  // Latency penalty — very slow responses
  if (response.responseLatencyMs > 25000) score -= 0.1;
  else if (response.responseLatencyMs > 18000) score -= 0.05;

  return Math.max(0.05, Math.min(1, score));
};

export const decideBranch = (state: InterviewState, latestResponse: CandidateResponse): BranchDecision => {
  const quality = estimateAnswerQuality(latestResponse);
  const currentQ = state.questions[state.currentQuestionIndex];
  const difficulty = currentQ?.difficulty ?? 2;

  // Very weak answer — simplify
  if (quality < 0.25) {
    return {
      type: "SIMPLIFY",
      reason: "Response lacked depth or structure. Let me rephrase with a simpler angle."
    };
  }

  // Promising but unstructured — ask for STAR format
  if (quality < 0.45 && quality >= 0.25) {
    return {
      type: "FOLLOW_UP",
      question: "I'd like more specifics. Can you restructure your answer: what was the Situation, your Task, the Action you took, and the measurable Result?"
    };
  }

  // Excellent answer on a hard question — validate with edge case
  if (quality > 0.8 && difficulty >= 3) {
    return {
      type: "PROBE_DEEPER",
      reason: "Excellent depth. Probing edge cases to validate consistency."
    };
  }

  // Good but missing metrics
  const hasMetrics = /\d+%|\d+ms|\d+ users|\d+x|p99|p95|latency|throughput|uptime/i.test(latestResponse.text);
  if (quality > 0.6 && !hasMetrics) {
    return {
      type: "FOLLOW_UP",
      question: "Good explanation. Can you add specific numbers — response times, user counts, error rates, or any measurable impact?"
    };
  }

  // Candidate mentioned something interesting — pivot
  const interestingMention = latestResponse.text.match(
    /\b(microservices|event[- ]?driven|cqrs|saga|graphql|grpc|websocket|ssr|isr|edge computing|serverless|ml pipeline)\b/i
  );
  if (interestingMention) {
    return {
      type: "PIVOT_TOPIC",
      newTopic: interestingMention[0],
      reason: `Candidate brought up ${interestingMention[0]} — exploring that expertise.`
    };
  }

  // Move forward
  if (state.currentQuestionIndex < state.questions.length - 1) {
    return { type: "PROCEED", reason: "Good signal captured. Moving to next question." };
  }

  return { type: "FOLLOW_UP", question: "Final thought — any example of measurable impact you'd like to highlight?" };
};
