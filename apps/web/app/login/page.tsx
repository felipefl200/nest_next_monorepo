import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionSnapshot } from "@/src/services/auth/session";

export default async function LoginPage() {
  const session = await getSessionSnapshot();

  if (session.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full items-center justify-center px-6 py-20">
        <LoginForm />
      </div>
    </main>
  );
}
