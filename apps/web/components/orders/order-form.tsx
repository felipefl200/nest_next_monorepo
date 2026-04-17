"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
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
import { ErrorMessage } from "@/components/shared/error-message";
import { Field } from "@/components/shared/field";
import { formatCurrency } from "@/src/services/shared/formatters";
import type { Customer } from "@/src/services/customers/types";
import type {
  Order,
  OrderItemInput,
  OrderStatus,
} from "@/src/services/orders/types";
import type { Product } from "@/src/services/products/types";

type OrderFormProps = {
  mode: "create" | "edit";
  order?: Order;
  customers: Customer[];
  products: Product[];
};

type OrderItemDraft = OrderItemInput;

const statusOptions: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

function findProduct(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId);
}

export function OrderForm({ mode, order, customers, products }: OrderFormProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(
    order?.customerId ?? customers[0]?.id ?? "",
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "PENDING");
  const [items, setItems] = useState<OrderItemDraft[]>(
    order?.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })) ?? [
      {
        productId: products[0]?.id ?? "",
        quantity: 1,
        unitPrice: products[0]?.price ?? "0.00",
      },
    ],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  function updateItem(index: number, patch: Partial<OrderItemDraft>) {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function handleProductChange(index: number, productId: string) {
    const product = findProduct(products, productId);

    updateItem(index, {
      productId,
      unitPrice: product?.price ?? "0.00",
    });
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        productId: products[0]?.id ?? "",
        quantity: 1,
        unitPrice: products[0]?.price ?? "0.00",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice,
    }));

    try {
      const response = await fetch(
        mode === "create" ? "/api/orders" : `/api/orders/${order?.id ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            ...(mode === "edit" ? { status } : {}),
            items: normalizedItems,
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | Order
        | { message?: string }
        | null;

      if (!response.ok) {
        setError(result !== null && "message" in result ? result.message ?? "Falha ao salvar pedido." : "Falha ao salvar pedido.");
        return;
      }

      const targetId = result !== null && "id" in result ? result.id : order?.id;

      startTransition(() => {
        router.push(targetId === undefined ? "/dashboard/orders" : `/dashboard/orders/${targetId}`);
        router.refresh();
      });
    } catch {
      setError("Nao foi possivel salvar o pedido.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Cabecalho do pedido</FormSectionTitle>
          <FormSectionDescription>
            Selecione o cliente e mantenha o status do pedido quando estiver editando.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="grid gap-4 md:grid-cols-2">
          <Field htmlFor="order-customer" label="Cliente">
            <Select
              id="order-customer"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              disabled={isPending}
            >
              {customers.map((customerOption) => (
                <option key={customerOption.id} value={customerOption.id}>
                  {customerOption.name} · {customerOption.email}
                </option>
              ))}
            </Select>
          </Field>

          {mode === "edit" ? (
            <Field htmlFor="order-status" label="Status">
              <Select
                id="order-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                disabled={isPending}
              >
                {statusOptions.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </FormSectionContent>
      </FormSection>

      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Itens</FormSectionTitle>
          <FormSectionDescription>
            O total e recalculado pela API, mas o frontend mostra a soma para dar feedback imediato.
          </FormSectionDescription>
        </FormSectionHeader>
        <FormSectionContent className="space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="grid gap-3 rounded-xl border border-border/60 p-4 md:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <Field htmlFor={`order-item-product-${index}`} label="Produto">
                <Select
                  id={`order-item-product-${index}`}
                  value={item.productId}
                  onChange={(event) => handleProductChange(index, event.target.value)}
                  disabled={isPending}
                >
                  {products.map((productOption) => (
                    <option key={productOption.id} value={productOption.id}>
                      {productOption.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field htmlFor={`order-item-quantity-${index}`} label="Quantidade">
                <Input
                  id={`order-item-quantity-${index}`}
                  type="number"
                  min="1"
                  value={String(item.quantity)}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Number(event.target.value),
                    })
                  }
                  disabled={isPending}
                />
              </Field>

              <Field htmlFor={`order-item-price-${index}`} label="Preco unitario">
                <Input
                  id={`order-item-price-${index}`}
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(index, {
                      unitPrice: event.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </Field>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending || items.length === 1}
                  onClick={() => removeItem(index)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Adicionar item
            </Button>
            <p className="text-sm text-muted-foreground">
              Total visual: <span className="font-medium text-foreground">{formatCurrency(total.toFixed(2))}</span>
            </p>
          </div>
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
              ? "Criar pedido"
              : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
