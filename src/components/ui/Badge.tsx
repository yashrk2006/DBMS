import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
}

function Badge({ className, variant = "primary", ...props }: BadgeProps) {
  const variants = {
    primary: "bg-indigo-50 text-indigo-700 border-indigo-100",
    secondary: "bg-slate-100 text-slate-900 border-transparent",
    outline: "border border-slate-200 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
