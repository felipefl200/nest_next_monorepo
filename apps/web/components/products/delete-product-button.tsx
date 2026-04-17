"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";

type DeleteProductButtonProps = {
  productId: string;
  redirectTo?: string;
};

export function DeleteProductButton({
  productId,
  redirectTo,
}: DeleteProductButtonProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Excluir produto"
      description="A exclusao sera rejeitada se o produto estiver vinculado a itens de pedidos."
      confirmLabel="Excluir"
      triggerLabel="Excluir"
      variant="destructive"
      onConfirm={async () => {
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Falha ao excluir produto.");
        }

        router.refresh();

        if (redirectTo !== undefined) {
          router.push(redirectTo);
        }
      }}
    />
  );
}
