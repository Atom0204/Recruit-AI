import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = "", elevated = false }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={`
        rounded-2xl p-5
        ${elevated ? "glass-elevated" : "glass"}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
