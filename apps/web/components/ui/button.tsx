import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-indigo-400 text-white shadow-glow-sm hover:shadow-glow hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/[0.06] text-zinc-100 border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.15] active:bg-white/[0.08]",
  ghost:
    "text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06] active:bg-white/[0.04]",
  danger:
    "bg-red-500/20 text-red-200 border border-red-400/20 hover:bg-red-500/30 active:bg-red-500/15"
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5"
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-40 disabled:pointer-events-none disabled:saturate-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
