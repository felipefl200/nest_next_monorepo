"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { ErrorMessage } from "@/components/shared/error-message";

type DeleteUserButtonProps = {
  userId: string;
};

export function DeleteUserButton({ userId }: DeleteUserButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);

    const response = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(result?.message ?? "Falha ao desativar usuario.");
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <ConfirmDialog
        title="Desativar usuario"
        description="Tem certeza que deseja desativar este usuario? Ele perdera o acesso ao sistema."
        triggerLabel="Desativar"
        confirmLabel="Desativar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
      <ErrorMessage message={error} />
    </div>
  );
}
