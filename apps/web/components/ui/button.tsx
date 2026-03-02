import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-90",
  secondary:
    "rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500",
  ghost:
    "rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
};

export function Button({ variant = "primary", className = "", children, ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button className={`${variantClasses[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
