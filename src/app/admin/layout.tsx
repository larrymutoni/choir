import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f6f7fb] lg:flex">
      <AdminSidebar />

      <div className="min-w-0 flex-1 px-5 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
