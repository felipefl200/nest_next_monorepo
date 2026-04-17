import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { getCurrentUserProfile } from "@/src/services/auth/session";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile("/dashboard");

  return (
    <section className="space-y-6">
      <Card className="border-border/60 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>
            CRUDs de Customers, Products e Orders consumindo a API via camada BFF do Next.js.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/70 p-4">
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="mt-2 text-lg font-medium">{profile.name}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-4">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-2 text-lg font-medium">{profile.email}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-4">
            <p className="text-sm text-muted-foreground">Perfil</p>
            <p className="mt-2 text-lg font-medium">{profile.role}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            href: "/dashboard/customers",
            title: "Customers",
            description: "Cadastre, pesquise, detalhe e mantenha clientes.",
          },
          {
            href: "/dashboard/products",
            title: "Products",
            description: "Gerencie catalogo, estoque, categorias e status de ativacao.",
          },
          {
            href: "/dashboard/orders",
            title: "Orders",
            description: "Crie pedidos, edite itens e acompanhe o ciclo completo do pedido.",
          },
        ].map((item) => (
          <Card key={item.href} className="border-border/60 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={item.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Abrir
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
