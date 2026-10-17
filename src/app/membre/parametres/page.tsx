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
import { listMemberEntries } from "@/server/members/repository";

export default async function AccountPage() {
  const session =
    await requireUser();

  const [profile, security, members] =
    await Promise.all([
      getAccountProfile(
        session.email,
      ),
      getSecurityState(
        session.user_id,
      ),
      listMemberEntries(),
    ]);

  if (!profile) {
    return null;
  }

  const ownMember = members.find((member) => member.userId === session.user_id)
    ?? members.find((member) => !member.userId && member.email.toLowerCase() === session.email.toLowerCase());

  return (
    <main className="mx-auto w-full max-w-5xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
        Mon compte
      </h1>

      <AccountSettings
        profile={{ ...profile, roleName: session.role_name, voiceType: ownMember?.voiceType ?? null }}
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
