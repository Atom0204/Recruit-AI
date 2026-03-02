import type {
  BranchDecision,
  CandidateResponse,
  InterviewQuestion,
  InterviewState,
  ParsedResume,
  ShadowJobDescription
} from "@recruitai/shared";

export const buildInterviewScript = async (
  resume: ParsedResume,
  jd: ShadowJobDescription
): Promise<InterviewQuestion[]> => {
  const primarySkill = resume.skills.primary[0] ?? "software engineering";
  const secondarySkill = resume.skills.secondary[0] ?? jd.requiredSkills[0] ?? "system design";
  const leadershipSignal = resume.skills.soft[0] ?? "cross-functional communication";
  const focusA = jd.interviewFocus[0] ?? "architecture";
  const focusB = jd.interviewFocus[1] ?? "execution";
  const requiredA = jd.requiredSkills[0] ?? primarySkill;
  const requiredB = jd.requiredSkills[1] ?? secondarySkill;
  const requiredC = jd.requiredSkills[2] ?? "distributed systems";
  const candidateSummary = resume.summary.slice(0, 180);

  return [
    {
      id: "q1",
      type: "icebreaker",
      prompt: `Your resume highlights: "${candidateSummary}". Walk me through one project that best proves you're ready for ${jd.title} at ${jd.company}.`,
      expectedSignals: ["Ownership", "Clarity", "Impact", "Business outcome"],
      difficulty: 1,
      timeLimitSeconds: 240
    },
    {
      id: "q2",
      type: "technical",
      prompt: `Deep dive into a production issue in ${requiredA} or ${requiredB}. I want root cause, instrumentation used, and the final trade-off decision.`,
      expectedSignals: ["Technical depth", "Debugging", "Trade-offs", "Reliability mindset"],
      difficulty: 2,
      timeLimitSeconds: 360
    },
    {
      id: "q3",
      type: "system_design",
      prompt: `Design a ${focusA}-heavy system for ${jd.title}: support real-time interview sessions, anti-cheating telemetry, and report generation for hiring managers.`,
      expectedSignals: ["Scalability", "Reliability", "Data model", "Failure handling"],
      difficulty: 3,
      timeLimitSeconds: 480
    },
    {
      id: "q4",
      type: "problem_solving",
      prompt: `Implement an approach to rank candidates by weighted rubric scores where ${requiredC} and ${primarySkill} have higher influence for this role. Explain complexity and edge cases.`,
      expectedSignals: ["Algorithmic clarity", "Edge cases", "Complexity", "Prioritization logic"],
      difficulty: 3,
      timeLimitSeconds: 420
    },
    {
      id: "q5",
      type: "culture_fit",
      prompt: `For ${focusB} and leadership expectations, describe a disagreement you handled that improved team delivery quality. What would you change now?`,
      expectedSignals: ["Collaboration", "Empathy", "Accountability", leadershipSignal],
      difficulty: 2,
      timeLimitSeconds: 240
    }
  ];
};

const estimateAnswerQuality = (response: CandidateResponse): number => {
  const wordCount = response.text.trim().split(/\s+/).filter(Boolean).length;
  const latencyPenalty = response.responseLatencyMs > 18000 ? 0.15 : 0;
  const conciseBonus = wordCount > 60 ? 0.1 : 0;
  const baseline = Math.min(1, wordCount / 120);
  return Math.max(0, Math.min(1, baseline + conciseBonus - latencyPenalty));
};

export const decideBranch = (state: InterviewState, latestResponse: CandidateResponse): BranchDecision => {
  const quality = estimateAnswerQuality(latestResponse);
  const mentionsMetrics = /%|latency|throughput|sla|slo|p99|downtime|kpi/i.test(latestResponse.text);
  const unclearStructure = !/first|second|finally|because|therefore|trade-?off/i.test(latestResponse.text);

  if (quality < 0.35) {
    return { type: "SIMPLIFY", reason: "Response missed core signals; lowering complexity." };
  }

  if (quality < 0.55 && unclearStructure) {
    return {
      type: "FOLLOW_UP",
      question: "Re-answer in STAR format (situation, task, action, result) and include one measurable outcome."
    };
  }

  if (quality > 0.82) {
    return { type: "PROBE_DEEPER", reason: "Strong response; increase depth to validate consistency." };
  }

  if (quality > 0.68 && !mentionsMetrics) {
    return {
      type: "FOLLOW_UP",
      question: "Good depth. Add measurable impact metrics and how you verified correctness in production."
    };
  }

  if (/redis|kafka|rust|go/i.test(latestResponse.text)) {
    const matchedTopic = latestResponse.text.match(/redis|kafka|rust|go/i)?.[0] ?? "backend systems";
    return { type: "PIVOT_TOPIC", newTopic: matchedTopic, reason: "Candidate mentioned adjacent expertise." };
  }

  if (state.currentQuestionIndex < state.questions.length - 1) {
    return { type: "PROCEED", reason: "Sufficient signal captured for this question." };
  }

  return { type: "FOLLOW_UP", question: "Any final example that demonstrates measurable impact?" };
};
