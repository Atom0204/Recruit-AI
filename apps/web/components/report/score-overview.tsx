import { Card } from "../ui/card";

interface ScoreOverviewProps {
  overallScore: number;
  verdict: string;
}

export function ScoreOverview({ overallScore, verdict }: ScoreOverviewProps) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-zinc-400">Overall Score</p>
      <p className="mt-1 text-4xl font-bold text-indigo-300">{overallScore}</p>
      <p className="mt-2 text-sm text-zinc-200">Verdict: {verdict}</p>
    </Card>
  );
}
