"use client";

import * as React from "react";

import { Button } from "@repo/ui/components/button";

type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
  triggerLabel: string;
  variant?: "default" | "destructive" | "outline";
};

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  disabled = false,
  onConfirm,
  triggerLabel,
  variant = "outline",
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      description === undefined
        ? `${title}\n\n${confirmLabel}?`
        : `${title}\n\n${description}\n\n${confirmLabel}?`,
    );

    if (!confirmed) {
      return;
    }

    setIsPending(true);

    try {
      await onConfirm();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Nao foi possivel concluir a operacao.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={disabled || isPending}
      onClick={handleClick}
    >
      {isPending ? cancelLabel : triggerLabel}
    </Button>
  );
}

export { ConfirmDialog };
