import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableTable,
} from "@repo/ui/components/data-table";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { getOrder } from "@/src/services/orders/bff";
import { formatCurrency, formatDate } from "@/src/services/shared/formatters";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

function getOrderStatusVariant(status: string): "warning" | "success" | "danger" | "neutral" {
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
    case "SHIPPED":
    case "DELIVERED":
      return "success";
    case "CANCELED":
      return "danger";
    default:
      return "neutral";
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>{order.number}</PageHeaderTitle>
          <PageHeaderDescription>
            Visualizacao completa do pedido, incluindo itens, valores e status.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href={`/dashboard/orders/${order.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteOrderButton orderId={order.id} redirectTo="/dashboard/orders" />
        </PageHeaderActions>
      </PageHeader>

      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="mt-1 font-medium">{order.customerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              <StatusBadge variant={getOrderStatusVariant(order.status)}>
                {order.status}
              </StatusBadge>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 font-medium">{formatCurrency(order.total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Atualizado em</p>
            <p className="mt-1 font-medium">{formatDate(order.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <DataTable>
        <DataTableTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Produto</DataTableHead>
              <DataTableHead>Quantidade</DataTableHead>
              <DataTableHead>Preco unitario</DataTableHead>
              <DataTableHead>Subtotal</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {order.items.map((item) => (
              <DataTableRow key={`${item.productId}-${item.productName}`}>
                <DataTableCell className="font-medium">{item.productName}</DataTableCell>
                <DataTableCell>{item.quantity}</DataTableCell>
                <DataTableCell>{formatCurrency(item.unitPrice)}</DataTableCell>
                <DataTableCell>
                  {formatCurrency((Number(item.unitPrice) * item.quantity).toFixed(2))}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableTable>
      </DataTable>
    </section>
  );
}
