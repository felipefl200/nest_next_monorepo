"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@repo/ui/components/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleLogout} type="button" variant="outline" disabled={isPending}>
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}
