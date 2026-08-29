import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import ProfileForm from "@/components/ProfileForm";
import { requireUser } from "@/server/auth/guard";
import { getMemberProfile } from "@/server/auth/service";

export default async function ProfilePage() {
  const session = await requireUser();
  const profile = await getMemberProfile(session.email);

  if (!profile) {
    return null;
  }

  return (
    <main>
      <DashboardHeader
        title="Mon profil"
        description="Gérez vos informations personnelles."
      />

      <div className="max-w-3xl">
        <ProfileForm profile={profile} />
      </div>
    </main>
  );
}