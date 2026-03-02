import { NextResponse } from "next/server";
import { getInterviewSession } from "../../../../lib/interview-memory-store";

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: ParamsContext): Promise<NextResponse> {
  const { id } = await context.params;
  const session = getInterviewSession(id);

  if (!session) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  return NextResponse.json({
    interview: {
      id: session.id,
      candidateName: session.candidateName,
      role: session.role,
      questions: session.questions,
      status: session.status,
      createdAt: session.createdAt
    }
  });
}
