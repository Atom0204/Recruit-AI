import type { ParsedResume } from "@recruitai/shared";
import { matchChallengesToResume, generateChallengeLevelFromSeniority } from "@recruitai/ai-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { resume, count = 3 }: { resume: ParsedResume; count?: number } = await req.json();

    if (!resume) {
      return NextResponse.json({ error: "Resume data required" }, { status: 400 });
    }

    const challenges = matchChallengesToResume(resume, count);

    return NextResponse.json({
      success: true,
      challenges,
      difficulty: generateChallengeLevelFromSeniority(resume.seniorityLevel),
      candidateName: resume.candidate.name
    });
  } catch (error) {
    console.error("Challenge generation error:", error);
    return NextResponse.json({ error: "Failed to generate challenges" }, { status: 500 });
  }
}
