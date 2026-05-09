import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, MapPin } from "lucide-react";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
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
        <section className="bg-[#fff8ec] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
              Agenda
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.03] tracking-[-0.04em] text-[#141414] sm:text-6xl">
              Concerts et prochaines dates.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#675e56]">
              Retrouvez ici les événements publics, concerts, répétitions
              ouvertes et temps forts de la chorale.
            </p>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-5">
              {(events ?? []).length === 0 && (
                <p className="rounded-[2rem] bg-[#fff8ec] p-8 text-[#675e56]">
                  Aucun événement public pour le moment.
                </p>
              )}

              {(events ?? []).map((event) => (
                <article
                  key={event.id}
                  className="rounded-[2rem] border border-[#e8ded2] bg-[#fff8ec] p-6 sm:p-8"
                >
                  <div className="grid gap-6 md:grid-cols-[180px_1fr_auto] md:items-center">
                    <div className="rounded-[1.5rem] bg-[#e9552f] p-5 text-white">
                      <CalendarDays size={24} />
                      <p className="mt-4 text-xl font-black">
                        {formatDate(event.event_date)}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-[#141414]">
                        {event.title}
                      </h2>

                      {event.location && (
                        <p className="mt-3 flex gap-2 text-sm font-bold text-[#e9552f]">
                          <MapPin size={18} />
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-4 leading-7 text-[#675e56]">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <Button href="/contact" variant="secondary">
                      Infos
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
