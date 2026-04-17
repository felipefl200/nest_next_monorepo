import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Novo produto</PageHeaderTitle>
          <PageHeaderDescription>
            Adicione um item ao catalogo para disponibiliza-lo nas vendas.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <ProductForm mode="create" />
    </section>
  );
}
