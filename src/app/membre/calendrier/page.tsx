import {
  CalendarClient,
} from "@/components/calendar/CalendarClient";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  requireUser,
} from "@/server/auth/guard";

export default async function CalendarPage() {
  const user =
    await requireUser();

  return (
    <CalendarClient
      canManage={hasRolePermission(
        user,
        "calendar",
      )}
    />
  );
}
