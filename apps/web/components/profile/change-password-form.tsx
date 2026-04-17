"use client";

import { useState } from "react";
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

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError("A nova senha e a confirmacao nao conhecidem.");
      setIsPending(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.message ?? "Falha ao alterar a senha.");
        return;
      }

      setSuccess("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setError("Nao foi possivel alterar a senha.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Alterar Senha</FormSectionTitle>
          <FormSectionDescription>
            Certifique-se de usar uma senha forte e segura.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="password-current" label="Senha Atual">
            <Input
              id="password-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite a senha atual"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="password-new" label="Nova Senha">
            <Input
              id="password-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="password-confirm" label="Confirme Nova Senha">
            <Input
              id="password-confirm"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Digite novamente a nova senha"
              required
              disabled={isPending}
            />
          </Field>
        </FormSectionContent>
      </FormSection>

      <ErrorMessage message={error} />
      {success && <p className="text-sm font-medium text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Alterando..." : "Alterar Senha"}
        </Button>
      </div>
    </form>
  );
}
