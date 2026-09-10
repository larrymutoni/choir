import { MemberDirectory } from "@/components/directory/MemberDirectory";
import { requireUser } from "@/server/auth/guard";

export default async function MemberDirectoryPage() {
  await requireUser();

  return <MemberDirectory />;
}
