import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
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
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@repo/ui/components/empty-state";
import {
  ListToolbar,
  ListToolbarActions,
  ListToolbarFilters,
} from "@repo/ui/components/list-toolbar";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import {
  Pagination,
  PaginationControls,
  PaginationLink,
  PaginationSummary,
} from "@repo/ui/components/pagination";
import { Select } from "@repo/ui/components/select";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { canManageOwnedResource } from "@/src/services/auth/authorization";
import { getCurrentUserProfile } from "@/src/services/auth/session";
import { listCustomers } from "@/src/services/customers/bff";
import { listOrders } from "@/src/services/orders/bff";
import { formatCurrency, formatDate } from "@/src/services/shared/formatters";
import {
  createSearchParams,
  getNumberSearchParam,
  getSingleSearchParam,
} from "@/src/services/shared/query-string";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const profile = await getCurrentUserProfile("/dashboard");
  const page = getNumberSearchParam(resolvedSearchParams.page, 1);
  const perPage = getNumberSearchParam(resolvedSearchParams.perPage, 20);
  const status = getSingleSearchParam(resolvedSearchParams.status) as
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELED"
    | undefined;
  const customerId = getSingleSearchParam(resolvedSearchParams.customerId);
  const [result, customers] = await Promise.all([
    listOrders({ page, perPage, status, customerId }),
    listCustomers({ page: 1, perPage: 100 }),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Orders</PageHeaderTitle>
          <PageHeaderDescription>
            Controle de pedidos com filtro por cliente/status, detalhe completo e edicao estrutural.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link href="/dashboard/orders/new" className={buttonVariants({ size: "sm" })}>
            Novo pedido
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <form action="/dashboard/orders" className="space-y-3">
        <input type="hidden" name="perPage" value={String(perPage)} />
        <ListToolbar>
          <ListToolbarFilters className="md:grid-cols-2">
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">Todos os status</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELED">CANCELED</option>
            </Select>
            <Select name="customerId" defaultValue={customerId ?? ""}>
              <option value="">Todos os clientes</option>
              {customers.data.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </ListToolbarFilters>
          <ListToolbarActions>
            <button className={buttonVariants({ variant: "outline", size: "sm" })} type="submit">
              Filtrar
            </button>
            <Link href="/dashboard/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Limpar
            </Link>
          </ListToolbarActions>
        </ListToolbar>
      </form>

      {result.data.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>Nenhum pedido encontrado</EmptyStateTitle>
          <EmptyStateDescription>
            Crie o primeiro pedido para validar o fluxo completo entre clientes e produtos.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Link href="/dashboard/orders/new" className={buttonVariants({ size: "sm" })}>
              Criar pedido
            </Link>
          </EmptyStateActions>
        </EmptyState>
      ) : (
        <>
          <DataTable>
            <DataTableTable>
              <DataTableHeader>
                <tr>
                  <DataTableHead>Numero</DataTableHead>
                  <DataTableHead>Cliente</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Total</DataTableHead>
                  <DataTableHead>Criado em</DataTableHead>
                  <DataTableHead className="w-56">Acoes</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {result.data.map((order) => (
                  <DataTableRow key={order.id}>
                    <DataTableCell className="font-medium">{order.number}</DataTableCell>
                    <DataTableCell>{order.customerName}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge variant={getOrderStatusVariant(order.status)}>
                        {order.status}
                      </StatusBadge>
                    </DataTableCell>
                    <DataTableCell>{formatCurrency(order.total)}</DataTableCell>
                    <DataTableCell>{formatDate(order.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Detalhe
                        </Link>
                        {canManageOwnedResource(profile, order.ownerUserId) && (
                          <>
                            <Link
                              href={`/dashboard/orders/${order.id}/edit`}
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              Editar
                            </Link>
                            <DeleteOrderButton orderId={order.id} />
                          </>
                        )}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableTable>
          </DataTable>

          <Pagination>
            <PaginationSummary>
              Pagina {result.page} de {Math.max(result.totalPages, 1)} · {result.total} registros
            </PaginationSummary>
            <PaginationControls>
              <PaginationLink
                href={`/dashboard/orders${createSearchParams(resolvedSearchParams, {
                  page: Math.max(1, page - 1),
                })}`}
                aria-disabled={page <= 1}
              >
                Anterior
              </PaginationLink>
              <PaginationLink
                href={`/dashboard/orders${createSearchParams(resolvedSearchParams, {
                  page: Math.min(result.totalPages || 1, page + 1),
                })}`}
                aria-disabled={page >= result.totalPages}
              >
                Proxima
              </PaginationLink>
            </PaginationControls>
          </Pagination>
        </>
      )}
    </section>
  );
}
