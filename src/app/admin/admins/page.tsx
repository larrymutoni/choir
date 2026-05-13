import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminUserForm } from "@/components/admin/AdminUserForm";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  normalizePermissions,
  requireSuperAdmin,
  type AdminPermissions,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const currentAdmin = await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: admins, error } = await supabase
    .from("admin_users")
    .select("id, email, role, permissions, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Administrateurs"
        description="Créer des comptes et contrôler leurs accès."
        email={currentAdmin.email}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="grid gap-4">
          {(admins ?? []).map((admin) => (
            <article
              key={admin.id}
              className="rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#1f1f1a]">
                    {admin.email}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#687a5e]">
                    {admin.role === "super_admin"
                      ? "Super admin"
                      : "Admin limité"}
                  </p>
                </div>

                {admin.id === currentAdmin.id && (
                  <span className="w-fit rounded-full bg-[#f3f0e8] px-3 py-1 text-xs font-bold text-[#687a5e]">
                    Votre compte
                  </span>
                )}
              </div>

              <AdminUserActions
                id={admin.id}
                currentUserId={currentAdmin.id}
                role={admin.role}
                permissions={normalizePermissions(admin.permissions)}
              />
            </article>
          ))}
        </section>

        <AdminUserForm />
      </div>
    </main>
  );
}
