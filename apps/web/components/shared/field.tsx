import type { ReactNode } from "react";
import { Label } from "@repo/ui/components/label";

type FieldProps = {
  htmlFor: string;
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ htmlFor, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint === undefined ? null : (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
