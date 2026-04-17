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
import { Select } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { ErrorMessage } from "@/components/shared/error-message";
import { Field } from "@/components/shared/field";
import type { Product, ProductMutationInput } from "@/src/services/products/types";

type ProductFormProps = {
  mode: "create" | "edit";
  product?: Product;
};

export function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const payload: ProductMutationInput = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: price.trim(),
      stock: Number(stock),
      isActive,
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${product?.id ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | Product
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(result !== null && "message" in result ? result.message ?? "Falha ao salvar produto." : "Falha ao salvar produto.");
        return;
      }

      const targetId = result !== null && "id" in result ? result.id : product?.id;

      startTransition(() => {
        router.push(targetId === undefined ? "/dashboard/products" : `/dashboard/products/${targetId}`);
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel salvar o produto.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Catalogo</FormSectionTitle>
          <FormSectionDescription>
            Mantenha os campos comerciais e operacionais usados nas listagens e nos pedidos.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="product-name" label="Nome">
            <Input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Notebook Pro 14"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="product-category" label="Categoria">
            <Input
              id="product-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Eletronicos"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="product-price" label="Preco">
            <Input
              id="product-price"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="1999.90"
              required
              disabled={isPending}
            />
          </Field>

          <Field htmlFor="product-stock" label="Estoque">
            <Input
              id="product-stock"
              type="number"
              min="0"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
              disabled={isPending}
            />
          </Field>

          <div className="md:col-span-2">
            <Field htmlFor="product-description" label="Descricao">
              <Textarea
                id="product-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Resumo comercial do produto"
                disabled={isPending}
              />
            </Field>
          </div>

          <Field htmlFor="product-active" label="Status">
            <Select
              id="product-active"
              value={isActive ? "true" : "false"}
              onChange={(event) => setIsActive(event.target.value === "true")}
              disabled={isPending}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
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
              ? "Criar produto"
              : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
