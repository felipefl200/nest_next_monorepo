import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getCurrentUserProfile } from "@/src/services/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile("/dashboard");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="mb-8 rounded-2xl border border-border/60 bg-card/95 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Workspace autenticado</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {profile.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.email} · {profile.role}
                </p>
              </div>

              <DashboardNav />
            </div>

            <LogoutButton />
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}
