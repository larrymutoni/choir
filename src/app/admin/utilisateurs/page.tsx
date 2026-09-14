import { MemberDirectory } from "@/components/directory/MemberDirectory";
import { requireRole } from "@/server/auth/guard";

export default async function UsersPage() {
  await requireRole([
    "admin",
    "super_admin",
  ]);

  return <MemberDirectory />;
}
