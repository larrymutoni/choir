import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAllowedAdminLinks } from "@/lib/admin-navigation";
import { canAccess, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const links = getAllowedAdminLinks(admin);

  let unreadMessagesCount = 0;

  if (canAccess(admin, "messages")) {
    const supabase = createAdminClient();

    const { count } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    unreadMessagesCount = count ?? 0;
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] lg:flex lg:h-screen lg:overflow-hidden">
      <AdminSidebar links={links} unreadMessagesCount={unreadMessagesCount} />

      <div className="min-w-0 flex-1 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        <AdminMobileNav
          links={links}
          unreadMessagesCount={unreadMessagesCount}
        />

        <div className="px-5 py-6 sm:px-6 lg:flex-1 lg:overflow-y-auto lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
