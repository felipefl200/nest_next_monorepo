import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomer } from "@/src/services/customers/bff";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Editar cliente</PageHeaderTitle>
          <PageHeaderDescription>
            Atualize os dados usados no cadastro e no fluxo comercial.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <CustomerForm mode="edit" customer={customer} />
    </section>
  );
}
