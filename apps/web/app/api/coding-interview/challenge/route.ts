import type { DifficultyLevel, CodingChallenge } from "@recruitai/shared";
import { buildCodingChallengePrompt } from "@recruitai/ai-service";
import { geminiModel } from "../../../../lib/gemini";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  topic: z.string().min(1).max(60),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium")
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { topic, difficulty } = parsed.data;

    // Build the prompt for Gemini
    const prompt = buildCodingChallengePrompt(topic, difficulty as DifficultyLevel);

    // Call Gemini to generate the challenge
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (handle markdown code fences if present)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const challengeData = JSON.parse(jsonStr);

    // Validate and construct the challenge object
    const challenge: CodingChallenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prompt: challengeData.prompt || "Coding Challenge",
      description: challengeData.description || "Solve this problem",
      category: challengeData.category || "algorithm",
      difficulty: difficulty as DifficultyLevel,
      language: challengeData.language || "typescript",
      starterCode: challengeData.starterCode || "export function solve(input: any): any {\n  return null;\n}",
      testCases: (challengeData.testCases || []).map((tc: any) => ({
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
        explanation: tc.explanation
      })),
      timeLimit: challengeData.timeLimit || 900,
      subtopic: challengeData.subtopic || topic,
      aiObservation: challengeData.aiObservation ?? true,
      evaluationCriteria: challengeData.evaluationCriteria || {
        correctness: 0.6,
        efficiency: 0.25,
        codeQuality: 0.15
      }
    };

    return NextResponse.json({
      success: true,
      challenge,
      topic,
      difficulty
    });
  } catch (error) {
    console.error("Coding challenge generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate coding challenge",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
