import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

function ListToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-toolbar"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function ListToolbarFilters({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-toolbar-filters"
      className={cn("grid flex-1 gap-3 md:grid-cols-3", className)}
      {...props}
    />
  );
}

function ListToolbarActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-toolbar-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export { ListToolbar, ListToolbarActions, ListToolbarFilters };
