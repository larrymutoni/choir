import { CalendarDays, MapPin } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

function day(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(
    new Date(date),
  );
}

function month(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(new Date(date))
    .replace(".", "");
}

export default async function ConcertsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, description, event_date, location")
    .eq("is_visible", true)
    .order("event_date", { ascending: true });

  if (error) {
    console.error(error);
  }

  return (
    <>
      <Navbar />

      <main>
        <section className="section-space">
          <div className="page-shell">
            <Reveal>
              <p className="eyebrow">Concerts</p>
              <h1 className="editorial-title mt-5 max-w-3xl text-5xl leading-tight sm:text-6xl">
                Nos prochains rendez-vous.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#6d6b63] sm:text-lg">
                Retrouvez les concerts, répétitions ouvertes et événements
                publics de la chorale.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell max-w-5xl">
            <div className="grid gap-5">
              {(events ?? []).length === 0 && (
                <div className="soft-card rounded-[2rem] p-8 text-[#6d6b63]">
                  Aucun événement public pour le moment.
                </div>
              )}

              {(events ?? []).map((event, index) => (
                <Reveal key={event.id} delay={index * 0.04}>
                  <article className="grid gap-5 rounded-[2rem] border border-[#e6e1d6] bg-white p-5 shadow-sm sm:grid-cols-[95px_1fr_auto] sm:items-center">
                    <div className="rounded-2xl bg-[#f3f0e8] p-4 text-center">
                      <p className="text-3xl font-semibold text-[#687a5e]">
                        {day(event.event_date)}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6d6b63]">
                        {month(event.event_date)}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-[#1f1f1a]">
                        {event.title}
                      </h2>

                      <p className="mt-2 flex gap-2 text-sm text-[#687a5e]">
                        <MapPin size={17} />
                        {event.location || "Lyon 6"}
                      </p>

                      <p className="mt-2 flex gap-2 text-sm text-[#6d6b63]">
                        <CalendarDays size={17} />
                        {formatDate(event.event_date)}
                      </p>

                      {event.description && (
                        <p className="mt-4 leading-7 text-[#6d6b63]">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <Button href="/contact" variant="secondary">
                      Infos
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
