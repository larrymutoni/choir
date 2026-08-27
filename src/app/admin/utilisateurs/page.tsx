import { requireRole } from "@/server/auth/guard";
import { getUsersForAdmin } from "@/server/auth/service";
import UserManagement from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const session = await requireRole(["admin", "super_admin"]);
  const users = await getUsersForAdmin();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-semibold">Gestion des utilisateurs</h1>

      <UserManagement
        initialUsers={users}
        currentUserId={session.user_id}
        currentUserRole={session.role}
      />
    </main>
  );
}
