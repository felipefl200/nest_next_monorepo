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
import { Select } from "@repo/ui/components/select";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { listProducts } from "@/src/services/products/bff";
import { formatCurrency, formatDate } from "@/src/services/shared/formatters";
import {
  createSearchParams,
  getNumberSearchParam,
  getSingleSearchParam,
} from "@/src/services/shared/query-string";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = getNumberSearchParam(resolvedSearchParams.page, 1);
  const perPage = getNumberSearchParam(resolvedSearchParams.perPage, 20);
  const search = getSingleSearchParam(resolvedSearchParams.search);
  const category = getSingleSearchParam(resolvedSearchParams.category);
  const isActiveParam = getSingleSearchParam(resolvedSearchParams.isActive);
  const result = await listProducts({
    page,
    perPage,
    search,
    category,
    isActive:
      isActiveParam === undefined || isActiveParam.length === 0
        ? undefined
        : isActiveParam === "true",
  });

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Products</PageHeaderTitle>
          <PageHeaderDescription>
            Catalogo com filtros por categoria, busca textual, status e estoque.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href="/dashboard/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            Novo produto
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <form action="/dashboard/products" className="space-y-3">
        <input type="hidden" name="perPage" value={String(perPage)} />
        <ListToolbar>
          <ListToolbarFilters>
            <Input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Buscar por nome ou categoria"
            />
            <Input
              name="category"
              defaultValue={category ?? ""}
              placeholder="Categoria"
            />
            <Select name="isActive" defaultValue={isActiveParam ?? ""}>
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </Select>
          </ListToolbarFilters>
          <ListToolbarActions>
            <button className={buttonVariants({ variant: "outline", size: "sm" })} type="submit">
              Filtrar
            </button>
            <Link
              href="/dashboard/products"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Limpar
            </Link>
          </ListToolbarActions>
        </ListToolbar>
      </form>

      {result.data.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>Nenhum produto encontrado</EmptyStateTitle>
          <EmptyStateDescription>
            Cadastre itens no catalogo para liberar a criacao de pedidos.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Link
              href="/dashboard/products/new"
              className={buttonVariants({ size: "sm" })}
            >
              Criar produto
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
                  <DataTableHead>Categoria</DataTableHead>
                  <DataTableHead>Preco</DataTableHead>
                  <DataTableHead>Estoque</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Atualizado</DataTableHead>
                  <DataTableHead className="w-56">Acoes</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {result.data.map((product) => (
                  <DataTableRow key={product.id}>
                    <DataTableCell className="font-medium">{product.name}</DataTableCell>
                    <DataTableCell>{product.category}</DataTableCell>
                    <DataTableCell>{formatCurrency(product.price)}</DataTableCell>
                    <DataTableCell>{product.stock}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge variant={product.isActive ? "success" : "warning"}>
                        {product.isActive ? "Ativo" : "Inativo"}
                      </StatusBadge>
                    </DataTableCell>
                    <DataTableCell>{formatDate(product.updatedAt)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Detalhe
                        </Link>
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Editar
                        </Link>
                        <DeleteProductButton productId={product.id} />
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
                href={`/dashboard/products${createSearchParams(resolvedSearchParams, {
                  page: Math.max(1, page - 1),
                })}`}
                aria-disabled={page <= 1}
              >
                Anterior
              </PaginationLink>
              <PaginationLink
                href={`/dashboard/products${createSearchParams(resolvedSearchParams, {
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
