import { redirect } from "next/navigation";

import {
  ResourcesLibrary,
} from "@/components/resources/ResourcesLibrary";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function ResourcesPage() {
  const user =
    await requireUser();

  if (
    !hasRolePermission(
      user,
      "resources",
    )
  ) {
    redirect("/membre");
  }

  return <ResourcesLibrary />;
}
