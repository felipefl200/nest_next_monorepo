import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUserProfile } from "@/src/services/auth/session";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile("/dashboard");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-20">
        <Card className="w-full border-border/60 bg-card/95 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Dashboard
              </CardTitle>
              <CardDescription>
                Sessao autenticada pelo BFF do Next.js usando os JWTs emitidos pela API.
              </CardDescription>
            </div>
            <LogoutButton />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
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
      </div>
    </main>
  );
}
