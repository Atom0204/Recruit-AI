import { geminiModel } from "../../../../lib/gemini";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  topic: z.string().min(1).max(100),
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

    const { topic } = parsed.data;

    const prompt = `You are a technical interviewer. Generate exactly 10 basic fundamental one-liner questions about "${topic}".

Rules:
- Questions should test core fundamentals and concepts
- Start from very basic and gradually increase difficulty slightly
- Each question should be answerable in 1-3 sentences
- Questions should be clear, concise, and unambiguous
- Cover different aspects/subtopics of "${topic}"
- Do NOT include multiple-choice options — these are open-ended short answer questions

Return ONLY a valid JSON array of objects with this exact structure (no markdown, no code fences, no extra text):
[
  {
    "id": 1,
    "question": "What is ...?",
    "expectedAnswer": "A concise ideal answer for scoring reference",
    "difficulty": "easy|medium|hard",
    "subtopic": "specific subtopic being tested"
  }
]

Generate exactly 10 questions. Questions 1-4 should be "easy", 5-7 should be "medium", 8-10 should be "hard".`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from the response (handle markdown code fences if present)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const questions = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate valid questions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions, topic });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}
