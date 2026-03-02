interface PillProps {
  label: string;
}

export function Pill({ label }: PillProps) {
  return <span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs text-indigo-200">{label}</span>;
}
