import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { ProductForm } from "@/components/products/product-form";
import { getProduct } from "@/src/services/products/bff";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Editar produto</PageHeaderTitle>
          <PageHeaderDescription>
            Ajuste dados comerciais, operacionais e status do item no catalogo.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <ProductForm mode="edit" product={product} />
    </section>
  );
}
