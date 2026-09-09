import { CalendarClient } from "@/components/calendar/CalendarClient";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { requireUser } from "@/server/auth/guard";

export default async function CalendarPage() {
  const user = await requireUser();

  const canManage = user.role === "admin" || user.role === "super_admin";

  return (
    <main>
      <DashboardHeader
        title="Calendrier"
        description="Retrouvez les dates et rendez-vous de la chorale."
      />

      <CalendarClient canManage={canManage} />
    </main>
  );
}
