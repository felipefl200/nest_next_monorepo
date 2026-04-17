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
import { Input } from "@repo/ui/components/input";
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
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import { listCustomers } from "@/src/services/customers/bff";
import { formatDate } from "@/src/services/shared/formatters";
import {
  createSearchParams,
  getNumberSearchParam,
  getSingleSearchParam,
} from "@/src/services/shared/query-string";

type CustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = getNumberSearchParam(resolvedSearchParams.page, 1);
  const perPage = getNumberSearchParam(resolvedSearchParams.perPage, 20);
  const search = getSingleSearchParam(resolvedSearchParams.search);
  const result = await listCustomers({ page, perPage, search });
  const previousPageHref = `/dashboard/customers${createSearchParams(resolvedSearchParams, {
    page: Math.max(1, page - 1),
  })}`;
  const nextPageHref = `/dashboard/customers${createSearchParams(resolvedSearchParams, {
    page: Math.min(result.totalPages || 1, page + 1),
  })}`;

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Customers</PageHeaderTitle>
          <PageHeaderDescription>
            Listagem paginada com busca textual e acesso rapido para detalhe, edicao e exclusao.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href="/dashboard/customers/new"
            className={buttonVariants({ size: "sm" })}
          >
            Novo cliente
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <form action="/dashboard/customers" className="space-y-3">
        <input type="hidden" name="perPage" value={String(perPage)} />
        <ListToolbar>
          <ListToolbarFilters className="md:grid-cols-1">
            <Input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Buscar por nome ou email"
            />
          </ListToolbarFilters>
          <ListToolbarActions>
            <button className={buttonVariants({ variant: "outline", size: "sm" })} type="submit">
              Filtrar
            </button>
            <Link
              href="/dashboard/customers"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Limpar
            </Link>
          </ListToolbarActions>
        </ListToolbar>
      </form>

      {result.data.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>Nenhum cliente encontrado</EmptyStateTitle>
          <EmptyStateDescription>
            Ajuste os filtros ou cadastre o primeiro cliente para iniciar o fluxo de pedidos.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Link
              href="/dashboard/customers/new"
              className={buttonVariants({ size: "sm" })}
            >
              Criar cliente
            </Link>
          </EmptyStateActions>
        </EmptyState>
      ) : (
        <>
          <DataTable>
            <DataTableTable>
              <DataTableHeader>
                <tr>
                  <DataTableHead>Nome</DataTableHead>
                  <DataTableHead>Email</DataTableHead>
                  <DataTableHead>Telefone</DataTableHead>
                  <DataTableHead>Tax ID</DataTableHead>
                  <DataTableHead>Criado em</DataTableHead>
                  <DataTableHead className="w-56">Acoes</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {result.data.map((customer) => (
                  <DataTableRow key={customer.id}>
                    <DataTableCell className="font-medium">{customer.name}</DataTableCell>
                    <DataTableCell>{customer.email}</DataTableCell>
                    <DataTableCell>{customer.phone}</DataTableCell>
                    <DataTableCell>{customer.taxId ?? "—"}</DataTableCell>
                    <DataTableCell>{formatDate(customer.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Detalhe
                        </Link>
                        <Link
                          href={`/dashboard/customers/${customer.id}/edit`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Editar
                        </Link>
                        <DeleteCustomerButton customerId={customer.id} />
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
              <PaginationLink href={previousPageHref} aria-disabled={page <= 1}>
                Anterior
              </PaginationLink>
              <PaginationLink href={nextPageHref} aria-disabled={page >= result.totalPages}>
                Proxima
              </PaginationLink>
            </PaginationControls>
          </Pagination>
        </>
      )}
    </section>
  );
}
