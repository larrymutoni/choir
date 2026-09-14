import ProfileForm from "@/components/ProfileForm";

import {
  requireUser,
} from "@/server/auth/guard";

import {
  getAccountProfile,
} from "@/server/auth/account";

export default async function ProfilePage() {
  const session =
    await requireUser();

  const profile =
    await getAccountProfile(
      session.email,
    );

  if (!profile) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          Mon profil
        </h1>
      </div>

      <ProfileForm
        profile={
          profile
        }
      />
    </main>
  );
}