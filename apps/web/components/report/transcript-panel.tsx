import type { TranscriptEntry } from "@recruitai/shared";
import { Card } from "../ui/card";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold">Transcript</h3>
      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-2 text-sm">
        {entries.map((entry, index) => (
          <p key={`${entry.timestamp}-${index}`}>
            <span className="text-indigo-300">{entry.speaker}:</span> {entry.text}
          </p>
        ))}
      </div>
    </Card>
  );
}
