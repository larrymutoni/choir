import {
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

import {
  getDashboardNavigation,
} from "@/lib/dashboard-navigation";

import {
  getAccountProfile,
} from "@/server/auth/account";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await requireUser();

  const profile =
    await getAccountProfile(
      session.email,
    );

  const links =
    getDashboardNavigation(
      session.role,
      session.permissions,
    );

  return (
    <DashboardShell
      links={links}
      user={{
        firstname:
          profile?.firstname ??
          session.firstname,

        lastname:
          profile?.lastname ??
          session.lastname,

        email:
          profile?.email ??
          session.email,

        role:
          profile?.role ??
          session.role,

        avatarKey:
          profile?.avatarKey ??
          null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
