import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

export function Card({ children, className = "" }: PropsWithChildren<CardProps>) {
  return <div className={`glass rounded-2xl p-5 ${className}`.trim()}>{children}</div>;
}
