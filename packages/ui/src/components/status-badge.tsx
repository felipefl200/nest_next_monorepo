import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

const variants = {
  neutral: "border-border bg-muted text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
} as const;

function StatusBadge({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { StatusBadge };
