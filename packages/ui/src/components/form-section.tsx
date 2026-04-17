import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

function FormSection({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="form-section"
      className={cn("space-y-4 rounded-xl border border-border/60 p-4", className)}
      {...props}
    />
  );
}

function FormSectionHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-section-header"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

function FormSectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="form-section-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  );
}

function FormSectionDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-section-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormSectionContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-section-content"
      className={cn("space-y-4", className)}
      {...props}
    />
  );
}

export {
  FormSection,
  FormSectionContent,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
};
