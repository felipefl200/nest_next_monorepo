"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  FormSection,
  FormSectionContent,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
} from "@repo/ui/components/form-section";
import { Input } from "@repo/ui/components/input";
import { ErrorMessage } from "@/components/shared/error-message";
import { Field } from "@/components/shared/field";
import type { ManagedUser, ManagedUserMutationInput } from "@/src/services/users/types";

type UserFormProps = {
  mode: "create" | "edit";
  user?: ManagedUser;
};

export function UserForm({ mode, user }: UserFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<"ADMIN" | "MANAGER">(user?.role ?? "MANAGER");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const payload: ManagedUserMutationInput = {
      name: name.trim(),
      email: email.trim(),
      role,
    };

    if (mode === "create" && password.trim().length > 0) {
      payload.password = password.trim();
    }

    try {
      const response = await fetch(
        mode === "create" ? "/api/users" : `/api/users/${user?.id ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | ManagedUser
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(result !== null && "message" in result ? result.message ?? "Falha ao salvar usuario." : "Falha ao salvar usuario.");
        return;
      }

      startTransition(() => {
        router.push("/dashboard/users");
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel salvar o usuario.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Dados do usuario</FormSectionTitle>
          <FormSectionDescription>
            Preencha os campos para {mode === "create" ? "criar" : "editar"} o acesso deste usuario.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="user-name" label="Nome">
            <Input
              id="user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maria Souza"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="user-email" label="Email">
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@empresa.com"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="user-role" label="Funcao (Role)">
            <select
              id="user-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={role}
              onChange={(event) => setRole(event.target.value as "ADMIN" | "MANAGER")}
              disabled={isPending}
            >
              <option value="MANAGER">Manager (Comum)</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </Field>

          {mode === "create" && (
            <Field htmlFor="user-password" label="Senha" hint="Crie uma senha inicial.">
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                required={mode === "create"}
                disabled={isPending}
              />
            </Field>
          )}
        </FormSectionContent>
      </FormSection>

      <ErrorMessage message={error} />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Salvando..."
            : mode === "create"
              ? "Criar usuario"
              : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
