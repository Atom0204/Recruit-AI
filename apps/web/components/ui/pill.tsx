interface PillProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantMap = {
  default: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  danger: "border-red-400/30 bg-red-500/10 text-red-200"
};

export function Pill({ label, variant = "default" }: PillProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantMap[variant]}`}>
      {label}
    </span>
  );
}
