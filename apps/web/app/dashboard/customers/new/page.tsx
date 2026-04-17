import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Novo cliente</PageHeaderTitle>
          <PageHeaderDescription>
            Cadastre um cliente para disponibiliza-lo no fluxo de pedidos.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <CustomerForm mode="create" />
    </section>
  );
}
