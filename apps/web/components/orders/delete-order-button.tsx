"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";

type DeleteOrderButtonProps = {
  orderId: string;
  redirectTo?: string;
};

export function DeleteOrderButton({ orderId, redirectTo }: DeleteOrderButtonProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Excluir pedido"
      description="Essa acao remove o pedido e seus itens definitivamente."
      confirmLabel="Excluir"
      triggerLabel="Excluir"
      variant="destructive"
      onConfirm={async () => {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Falha ao excluir pedido.");
        }

        router.refresh();

        if (redirectTo !== undefined) {
          router.push(redirectTo);
        }
      }}
    />
  );
}
