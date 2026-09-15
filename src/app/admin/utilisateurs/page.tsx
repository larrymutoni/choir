import {
  MemberDirectory,
} from "@/components/directory/MemberDirectory";

import {
  requirePermission,
} from "@/lib/auth";

export default async function UsersPage() {
  await requirePermission(
    "members",
  );

  return <MemberDirectory />;
}
