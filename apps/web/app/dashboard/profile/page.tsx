import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@repo/ui/components/page-header";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { getOwnAccountProfile } from "@/src/services/auth/bff";

export default async function ProfilePage() {
  const profile = await getOwnAccountProfile();

  return (
    <section className="space-y-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Minha Conta</PageHeaderTitle>
          <PageHeaderDescription>
            Gerencie os dados da sua conta e a troca de senha.
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
