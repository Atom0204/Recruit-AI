import { geminiModel } from "../../../../lib/gemini";
import { NextResponse } from "next/server";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.number(),
  question: z.string(),
  expectedAnswer: z.string(),
  userAnswer: z.string(),
  difficulty: z.string(),
  subtopic: z.string(),
});

const requestSchema = z.object({
  topic: z.string().min(1),
  answers: z.array(answerSchema).min(1).max(10),
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

    const { topic, answers } = parsed.data;

    const questionsBlock = answers
      .map(
        (a, i) =>
          `Question ${i + 1} [${a.difficulty}] (${a.subtopic}):
Q: ${a.question}
Expected Answer: ${a.expectedAnswer}
User's Answer: ${a.userAnswer}`
      )
      .join("\n\n");

    const prompt = `You are an expert technical evaluator for "${topic}". Evaluate the candidate's answers against the expected answers.

${questionsBlock}

For each question, evaluate:
1. **Correctness** — Is the answer factually correct? (0-10)
2. **Completeness** — Did the candidate cover key points? (0-10)
3. **Clarity** — Is the answer well-articulated? (0-10)

Then compute a score for each question as: (correctness * 0.5 + completeness * 0.3 + clarity * 0.2) * 10, rounded to nearest integer (0-100).

Also provide:
- A brief 1-line feedback for each question
- An overall score (0-100) as the weighted average (easy questions weight 0.7, medium weight 1.0, hard weight 1.3)
- A short overall feedback paragraph (2-3 sentences)
- A verdict: "excellent" (>=80), "good" (>=60), "average" (>=40), or "needs_improvement" (<40)

Return ONLY valid JSON (no markdown, no code fences):
{
  "questionResults": [
    {
      "questionId": 1,
      "correctness": 8,
      "completeness": 7,
      "clarity": 9,
      "score": 79,
      "feedback": "Brief feedback here",
      "isCorrect": true
    }
  ],
  "overallScore": 72,
  "overallFeedback": "Overall assessment paragraph",
  "verdict": "good",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "topicMastery": {
    "subtopic1": 85,
    "subtopic2": 60
  }
}`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const evaluation = JSON.parse(jsonStr);

    return NextResponse.json({ evaluation, topic });
  } catch (error) {
    console.error("Answer evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answers. Please try again." },
      { status: 500 }
    );
  }
}
