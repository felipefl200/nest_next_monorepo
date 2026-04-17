import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import { getCustomer } from "@/src/services/customers/bff";
import { formatDate } from "@/src/services/shared/formatters";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>{customer.name}</PageHeaderTitle>
          <PageHeaderDescription>
            Visualizacao do cadastro do cliente e atalhos para manutencao.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteCustomerButton
            customerId={customer.id}
            redirectTo="/dashboard/customers"
          />
        </PageHeaderActions>
      </PageHeader>

      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-1 font-medium">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="mt-1 font-medium">{customer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tax ID</p>
            <p className="mt-1 font-medium">{customer.taxId ?? "Nao informado"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Atualizado em</p>
            <p className="mt-1 font-medium">{formatDate(customer.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
