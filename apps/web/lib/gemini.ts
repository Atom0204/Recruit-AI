import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env["GEMINI_API_KEY"];
if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY is not set — Gemini calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

export const geminiModel = genAI.getGenerativeModel({
  model: process.env["GEMINI_INTERVIEW_MODEL"] ?? "gemini-2.5-flash",
});

export { genAI };
