import { NextRequest, NextResponse } from "next/server";
import { getInterviewSessionForUser } from "../../../../lib/interview-memory-store";
import { getUserIdFromRequest } from "../../../../lib/auth";

interface ParamsContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: ParamsContext): Promise<NextResponse> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const session = getInterviewSessionForUser(id, userId);

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
