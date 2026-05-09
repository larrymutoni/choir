import { CalendarDays, MapPin } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EventActions } from "@/components/admin/EventActions";
import { EventForm } from "@/components/admin/EventForm";
import { createAdminClient } from "@/lib/supabase/admin";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function AdminEventsPage() {
  const supabase = createAdminClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, description, event_date, location, is_visible")
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Événements"
        description="Gérer les concerts, répétitions ouvertes et dates importantes."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#141414]">
            Liste des événements
          </h2>

          <div className="mt-6 grid gap-4">
            {(events ?? []).length === 0 && (
              <p className="rounded-2xl bg-[#fff8ec] p-5 text-sm font-semibold text-[#675e56]">
                Aucun événement pour le moment.
              </p>
            )}

            {(events ?? []).map((event) => (
              <article
                key={event.id}
                className="rounded-[1.5rem] border border-[#e8ded2] p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={
                          event.is_visible
                            ? "rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600"
                        }
                      >
                        {event.is_visible ? "Visible" : "Masqué"}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-[#141414]">
                      {event.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-[#675e56]">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-[#e9552f]" />
                        {formatDate(event.event_date)}
                      </span>

                      {event.location && (
                        <span className="flex items-center gap-2">
                          <MapPin size={17} className="text-[#e9552f]" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="mt-4 max-w-2xl leading-7 text-[#675e56]">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <EventActions id={event.id} isVisible={event.is_visible} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <EventForm />
      </div>
    </main>
  );
}
