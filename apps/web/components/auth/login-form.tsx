"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; redirectTo?: string }
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Nao foi possivel concluir o login.");
        return;
      }

      startTransition(() => {
        router.replace(payload?.redirectTo ?? "/dashboard");
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel conectar ao servico de autenticacao.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/95 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">Entrar</CardTitle>
        <CardDescription>Informe seu email e senha para acessar o sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {error !== null ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="w-full" size="lg" type="submit" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
