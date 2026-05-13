import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAllowedAdminLinks } from "@/lib/admin-navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const links = getAllowedAdminLinks(admin);

  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:flex">
      <AdminSidebar links={links} />

      <div className="min-w-0 flex-1">
        <AdminMobileNav links={links} />

        <div className="px-5 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
