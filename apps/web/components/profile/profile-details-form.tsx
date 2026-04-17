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
import type { CurrentUserProfile } from "@/src/services/auth/types";

type ProfileDetailsFormProps = {
  profile: CurrentUserProfile;
};

export function ProfileDetailsForm({ profile }: ProfileDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          currentPassword,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.message ?? "Falha ao atualizar o perfil.");
        return;
      }

      setSuccess("Perfil atualizado com sucesso!");
      setCurrentPassword(""); // limpa a senha para segurança

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel atualizar o perfil.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Dados Cadastrais</FormSectionTitle>
          <FormSectionDescription>
            Atualize seu nome ou endereco de email usado no acesso.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="profile-name" label="Nome Completo">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="profile-email" label="Email de Acesso">
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="profile-current-password" label="Senha Atual" hint="Obrigatoria para salvar as mudancas">
            <Input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Sua senha atual"
              required
              disabled={isPending}
            />
          </Field>
        </FormSectionContent>
      </FormSection>

      <ErrorMessage message={error} />
      {success && <p className="text-sm font-medium text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Dados Cadastrais"}
        </Button>
      </div>
    </form>
  );
}
