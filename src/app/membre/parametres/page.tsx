import {
  AccountSettings,
} from "@/components/settings/AccountSettings";

import {
  getAccountProfile,
} from "@/server/auth/account";

import {
  requireUser,
} from "@/server/auth/guard";

import {
  getSecurityState,
} from "@/server/auth/security-repository";

export default async function AccountPage() {
  const session =
    await requireUser();

  const [profile, security] =
    await Promise.all([
      getAccountProfile(
        session.email,
      ),
      getSecurityState(
        session.user_id,
      ),
    ]);

  if (!profile) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-5xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        Mon compte
      </h1>

      <AccountSettings
        profile={profile}
        initialEnabled={
          security.twoFactorEnabled
        }
        initialDevices={
          security.trustedDevices
        }
      />
    </main>
  );
}
