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
import { StatusBadge } from "@repo/ui/components/status-badge";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { getProduct } from "@/src/services/products/bff";
import { formatCurrency, formatDate } from "@/src/services/shared/formatters";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>{product.name}</PageHeaderTitle>
          <PageHeaderDescription>
            Snapshot completo do produto e seus atributos comerciais.
          </PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Editar
          </Link>
          <DeleteProductButton
            productId={product.id}
            redirectTo="/dashboard/products"
          />
        </PageHeaderActions>
      </PageHeader>

      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Catalogo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Categoria</p>
            <p className="mt-1 font-medium">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preco</p>
            <p className="mt-1 font-medium">{formatCurrency(product.price)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estoque</p>
            <p className="mt-1 font-medium">{product.stock}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              <StatusBadge variant={product.isActive ? "success" : "warning"}>
                {product.isActive ? "Ativo" : "Inativo"}
              </StatusBadge>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Descricao</p>
            <p className="mt-1 font-medium">
              {product.description?.length ? product.description : "Sem descricao"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Criado em</p>
            <p className="mt-1 font-medium">{formatDate(product.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Atualizado em</p>
            <p className="mt-1 font-medium">{formatDate(product.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
