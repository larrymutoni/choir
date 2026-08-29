import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardNavigation } from "@/lib/dashboard-navigation";
import { requireUser } from "@/server/auth/guard";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const links = getDashboardNavigation(user.role);

  return (
    <DashboardShell
      links={links}
      user={{
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
