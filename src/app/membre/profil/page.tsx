import { requireUser } from "@/server/auth/guard";
import { getMemberProfile } from "@/server/auth/service";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await requireUser();
  const profile = await getMemberProfile(session.email);

  if (!profile) {
    return null;
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold">Mon profil</h1>

      <ProfileForm profile={profile} />
    </main>
  );
}
