import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

function DataTable({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table"
      className={cn("overflow-hidden rounded-xl border border-border/60", className)}
      {...props}
    />
  );
}

function DataTableTable({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="data-table-table"
      className={cn("min-w-full divide-y divide-border/60 text-sm", className)}
      {...props}
    />
  );
}

function DataTableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="data-table-header"
      className={cn("bg-muted/50", className)}
      {...props}
    />
  );
}

function DataTableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="data-table-body"
      className={cn("divide-y divide-border/60 bg-card", className)}
      {...props}
    />
  );
}

function DataTableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="data-table-row"
      className={cn("hover:bg-muted/20", className)}
      {...props}
    />
  );
}

function DataTableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="data-table-head"
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

function DataTableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="data-table-cell"
      className={cn("px-4 py-3 align-top", className)}
      {...props}
    />
  );
}

export {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableTable,
};
