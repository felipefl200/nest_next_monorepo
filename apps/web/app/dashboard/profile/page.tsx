import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { getCurrentUserProfile } from "@/src/services/auth/session";

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile("/dashboard");

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Configuracoes do Perfil</PageHeaderTitle>
          <PageHeaderDescription>
            Gerencie seus dados de acesso e informacoes pessoais.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="grid gap-10">
        <ProfileDetailsForm profile={profile} />
        <ChangePasswordForm />
      </div>
    </section>
  );
}
