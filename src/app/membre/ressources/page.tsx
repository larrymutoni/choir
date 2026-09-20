import {
  ResourcesLibrary,
} from "@/components/resources/ResourcesLibrary";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function ResourcesPage() {
  await requireUser();

  return <ResourcesLibrary />;
}
