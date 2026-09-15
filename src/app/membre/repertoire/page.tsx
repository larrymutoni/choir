import { redirect } from "next/navigation";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function MemberDirectoryPage() {
  const user =
    await requireUser();

  if (
    hasRolePermission(
      user,
      "members",
    )
  ) {
    redirect(
      "/admin/utilisateurs",
    );
  }

  redirect("/membre");
}
