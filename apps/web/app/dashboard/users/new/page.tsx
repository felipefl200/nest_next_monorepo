import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { UserForm } from "@/components/users/user-form";
import { getCurrentUserProfile } from "@/src/services/auth/session";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const profile = await getCurrentUserProfile("/dashboard");

  if (profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Novo Usuario</PageHeaderTitle>
          <PageHeaderDescription>
            Cadastre um novo membro no sistema e defina sua funcao.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <UserForm mode="create" />
    </section>
  );
}
