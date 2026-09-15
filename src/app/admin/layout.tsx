import {
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

import {
  getDashboardNavigation,
} from "@/lib/dashboard-navigation";

import {
  requireAdmin,
} from "@/lib/auth";

import {
  getAccountProfile,
} from "@/server/auth/account";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await requireAdmin();

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
