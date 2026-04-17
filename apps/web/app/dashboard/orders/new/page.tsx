import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { OrderForm } from "@/components/orders/order-form";
import { listCustomers } from "@/src/services/customers/bff";
import { listProducts } from "@/src/services/products/bff";

export default async function NewOrderPage() {
  const [customers, products] = await Promise.all([
    listCustomers({ page: 1, perPage: 100 }),
    listProducts({ page: 1, perPage: 100 }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Novo pedido</PageHeaderTitle>
          <PageHeaderDescription>
            Monte o pedido com cliente, itens, quantidades e precos unitarios.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {customers.data.length === 0 || products.data.length === 0 ? (
        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Dependencias pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para criar pedidos, o sistema precisa ter ao menos um cliente e um produto cadastrados.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/customers/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Criar cliente
              </Link>
              <Link href="/dashboard/products/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Criar produto
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrderForm mode="create" customers={customers.data} products={products.data} />
      )}
    </section>
  );
}
