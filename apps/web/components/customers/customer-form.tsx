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
import type { Customer, CustomerMutationInput } from "@/src/services/customers/types";

type CustomerFormProps = {
  mode: "create" | "edit";
  customer?: Customer;
};

export function CustomerForm({ mode, customer }: CustomerFormProps) {
  const router = useRouter();
  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [taxId, setTaxId] = useState(customer?.taxId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const payload: CustomerMutationInput = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      taxId: taxId.trim().length === 0 ? null : taxId.trim(),
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/customers" : `/api/customers/${customer?.id ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | Customer
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(result !== null && "message" in result ? result.message ?? "Falha ao salvar cliente." : "Falha ao salvar cliente.");
        return;
      }

      const targetId = result !== null && "id" in result ? result.id : customer?.id;

      startTransition(() => {
        router.push(targetId === undefined ? "/dashboard/customers" : `/dashboard/customers/${targetId}`);
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel salvar o cliente.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Dados do cliente</FormSectionTitle>
          <FormSectionDescription>
            Preencha os campos principais usados no cadastro e nas telas de pedido.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="customer-name" label="Nome">
            <Input
              id="customer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maria Souza"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="customer-email" label="Email">
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@empresa.com"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="customer-phone" label="Telefone">
            <Input
              id="customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+55 11 99999-9999"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="customer-tax-id" label="Tax ID" hint="Opcional, mas unico quando preenchido.">
            <Input
              id="customer-tax-id"
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
              placeholder="12345678900"
              disabled={isPending}
            />
          </Field>
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
              ? "Criar cliente"
              : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
