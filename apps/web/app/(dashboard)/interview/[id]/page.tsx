import { buildInterviewScript } from "@recruitai/ai-service";
import type { ParsedResume, ShadowJobDescription } from "@recruitai/shared";
import { InterviewRoom } from "../../../../components/interview/interview-room";
import { PageTransition } from "../../../../components/page-transition";
import { getInterviewSession } from "../../../../lib/interview-memory-store";

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

const demoResume: ParsedResume = {
  candidate: {
    name: "Demo Candidate",
    email: "demo@candidate.dev"
  },
  summary: "Full-stack engineer with strong backend and distributed systems experience.",
  seniorityLevel: "senior",
  skills: {
    primary: ["TypeScript", "Next.js", "PostgreSQL", "Redis"],
    secondary: ["AWS", "Docker"],
    soft: ["Communication", "Leadership"]
  },
  experience: [],
  education: [],
  projects: [],
  confidence: 0.82
};

const demoJd: ShadowJobDescription = {
  title: "Senior Full-Stack Engineer",
  company: "Northstar Systems",
  department: "Engineering",
  responsibilities: ["Build reliable APIs", "Mentor engineers", "Drive architecture decisions"],
  requiredSkills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
  niceToHaveSkills: ["Redis", "Kafka", "Kubernetes"],
  evaluationRubric: [
    { category: "Technical Depth", weight: 0.35, criteria: ["Fundamentals", "Debugging", "Trade-offs"] },
    { category: "System Design", weight: 0.25, criteria: ["Scalability", "Reliability"] },
    { category: "Problem Solving", weight: 0.2, criteria: ["Clarity", "Correctness"] },
    { category: "Communication", weight: 0.2, criteria: ["Structure", "Collaboration"] }
  ],
  interviewFocus: ["Architecture", "Execution", "Leadership"],
  difficultyLevel: "hard"
};

export default async function InterviewPage({ params }: InterviewPageProps) {
  const resolvedParams = await params;
  const session = getInterviewSession(resolvedParams.id);
  const questions = session ? session.questions : await buildInterviewScript(demoResume, demoJd);
  const candidateName = session?.candidateName ?? demoResume.candidate.name;
  const role = session?.role ?? demoJd.title;

  return (
    <PageTransition state="interview">
      <InterviewRoom interviewId={resolvedParams.id} candidateName={candidateName} role={role} questions={questions} />
    </PageTransition>
  );
}
