import { redirect } from "next/navigation";

import {
  ComingSoon,
} from "@/components/dashboard/ComingSoon";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function MemberGalleryPage() {
  const user =
    await requireUser();

  if (
    !hasRolePermission(
      user,
      "gallery",
    )
  ) {
    redirect("/membre");
  }

  return (
    <ComingSoon
      title="Galerie membres"
      description="La galerie privée des membres sera disponible ici."
    />
  );
}
