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
import { getOrder } from "@/src/services/orders/bff";
import { listProducts } from "@/src/services/products/bff";

type EditOrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const [order, customers, products] = await Promise.all([
    getOrder(id),
    listCustomers({ page: 1, perPage: 100 }),
    listProducts({ page: 1, perPage: 100 }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Editar pedido</PageHeaderTitle>
          <PageHeaderDescription>
            Ajuste status, cliente e composicao completa do pedido.
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
              O pedido nao pode ser editado sem clientes e produtos disponiveis para selecao.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/customers" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver clientes
              </Link>
              <Link href="/dashboard/products" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver produtos
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrderForm
          mode="edit"
          order={order}
          customers={customers.data}
          products={products.data}
        />
      )}
    </section>
  );
}
