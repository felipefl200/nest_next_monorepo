"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";

type DeleteCustomerButtonProps = {
  customerId: string;
  redirectTo?: string;
};

export function DeleteCustomerButton({
  customerId,
  redirectTo,
}: DeleteCustomerButtonProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Excluir cliente"
      description="Essa acao remove o cliente permanentemente. Se existir pedido associado, a API bloqueara a exclusao."
      confirmLabel="Excluir"
      triggerLabel="Excluir"
      variant="destructive"
      onConfirm={async () => {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Falha ao excluir cliente.");
        }

        router.refresh();

        if (redirectTo !== undefined) {
          router.push(redirectTo);
        }
      }}
    />
  );
}
