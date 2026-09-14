import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth/guard";

export default async function MemberDirectoryPage() {
  const user = await requireUser();

  if (
    user.role === "admin" ||
    user.role === "super_admin"
  ) {
    redirect("/admin/utilisateurs");
  }

  redirect("/membre");
}
