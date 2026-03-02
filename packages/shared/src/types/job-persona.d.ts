export type InterviewDifficulty = "easy" | "medium" | "hard" | "expert";
export interface EvaluationRubricItem {
    category: string;
    weight: number;
    criteria: string[];
}
export interface ShadowJobDescription {
    title: string;
    company: string;
    department: string;
    responsibilities: string[];
    requiredSkills: string[];
    niceToHaveSkills: string[];
    evaluationRubric: EvaluationRubricItem[];
    interviewFocus: string[];
    difficultyLevel: InterviewDifficulty;
}
