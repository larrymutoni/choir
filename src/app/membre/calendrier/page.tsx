import { redirect } from "next/navigation";
import { hasRolePermission } from "@/lib/permissions";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { requireUser } from "@/server/auth/guard";

export default async function CalendarPage() {
  const user = await requireUser();

  if (!hasRolePermission(user, "calendar")) {
    redirect("/membre");
  }

  const canManage = hasRolePermission(user, "calendar");

  return (
    <main>
      <DashboardHeader title="Calendrier" />

      <CalendarClient canManage={canManage} />
    </main>
  );
}
