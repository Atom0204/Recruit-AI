import { Card } from "../ui/card";

interface SentimentPoint {
  question: number;
  confidence: number;
  sentiment: string;
}

interface SentimentTimelineProps {
  points: SentimentPoint[];
}

export function SentimentTimeline({ points }: SentimentTimelineProps) {
  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">Sentiment Timeline</h3>
      <div className="space-y-2">
        {points.map((point) => (
          <div key={point.question} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Q{point.question} · {point.sentiment}</span>
              <span>{point.confidence}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-300" style={{ width: `${point.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
