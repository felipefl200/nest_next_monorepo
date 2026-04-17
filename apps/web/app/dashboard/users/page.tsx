import Link from "next/link";
import { redirect } from "next/navigation";
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
import { listManagedUsers } from "@/src/services/users/bff";
import { getCurrentUserProfile } from "@/src/services/auth/session";
import { formatDate } from "@/src/services/shared/formatters";
import {
  createSearchParams,
  getNumberSearchParam,
  getSingleSearchParam,
} from "@/src/services/shared/query-string";
import { DeleteUserButton } from "@/components/users/delete-user-button";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const profile = await getCurrentUserProfile("/dashboard");

  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const page = getNumberSearchParam(resolvedSearchParams.page, 1);
  const perPage = getNumberSearchParam(resolvedSearchParams.perPage, 20);
  const search = getSingleSearchParam(resolvedSearchParams.search);
  const result = await listManagedUsers({ page, perPage, search });

  const previousPageHref = `/dashboard/users${createSearchParams(resolvedSearchParams, {
    page: Math.max(1, page - 1),
  })}`;
  const nextPageHref = `/dashboard/users${createSearchParams(resolvedSearchParams, {
    page: Math.min(result.totalPages || 1, page + 1),
  })}`;

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Usuarios</PageHeaderTitle>
          <PageHeaderDescription>
            Listagem de usuarios autenticados no sistema. Area restrita (ADMIN).
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href="/dashboard/users/new"
            className={buttonVariants({ size: "sm" })}
          >
            Novo usuario
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <form action="/dashboard/users" className="space-y-3">
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
              href="/dashboard/users"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Limpar
            </Link>
          </ListToolbarActions>
        </ListToolbar>
      </form>

      {result.data.length === 0 ? (
        <EmptyState>
          <EmptyStateTitle>Nenhum usuario encontrado</EmptyStateTitle>
          <EmptyStateDescription>
            Tente mudar a sua busca ou adicionar novos membros ao sistema.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Link
              href="/dashboard/users/new"
              className={buttonVariants({ size: "sm" })}
            >
              Criar usuario
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
                  <DataTableHead>Role</DataTableHead>
                  <DataTableHead>Ativo?</DataTableHead>
                  <DataTableHead>Criado em</DataTableHead>
                  <DataTableHead className="w-56">Acoes</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {result.data.map((user) => (
                  <DataTableRow key={user.id}>
                    <DataTableCell className="font-medium">{user.name}</DataTableCell>
                    <DataTableCell>{user.email}</DataTableCell>
                    <DataTableCell>{user.role}</DataTableCell>
                    <DataTableCell>{user.isActive ? "Sim" : "Nao"}</DataTableCell>
                    <DataTableCell>{formatDate(user.createdAt)}</DataTableCell>
                    <DataTableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Editar
                        </Link>
                        {user.id !== profile.id && user.isActive && (
                          <DeleteUserButton userId={user.id} />
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
