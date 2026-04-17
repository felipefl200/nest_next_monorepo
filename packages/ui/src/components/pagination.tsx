import * as React from "react";

import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pagination"
      className={cn(
        "flex flex-col gap-3 border-t border-border/60 pt-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function PaginationSummary({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="pagination-summary"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function PaginationControls({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="pagination-controls"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function PaginationLink({
  active = false,
  className,
  ...props
}: React.ComponentProps<"a"> & { active?: boolean }) {
  return (
    <a
      data-slot="pagination-link"
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
        className,
      )}
      {...props}
    />
  );
}

export { Pagination, PaginationControls, PaginationLink, PaginationSummary };
