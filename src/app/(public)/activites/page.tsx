import { CalendarDays, MapPin, Mic2, Music2, Sparkles } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Reveal } from "@/components/ui/Reveal";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

const activities = [
  {
    icon: Mic2,
    title: "Répétitions",
    description:
      "Chaque semaine, le groupe travaille le répertoire, l’écoute et la cohésion vocale.",
  },
  {
    icon: Music2,
    title: "Répertoire",
    description:
      "Variétés françaises et étrangères, chants connus et morceaux choisis selon les projets.",
  },
  {
    icon: Sparkles,
    title: "Vie de groupe",
    description:
      "Des moments simples, humains et musicaux autour du plaisir de chanter ensemble.",
  },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const [{ data: siteContent }, { data: siteImages }, { data: events }] =
    await Promise.all([
      supabase.from("site_content").select("key, value"),
      supabase.from("site_images").select("key, path, alt_text, updated_at"),
      supabase
        .from("events")
        .select("id, title, description, event_date, location")
        .eq("is_visible", true)
        .order("event_date", { ascending: true }),
    ]);

  const content = contentArrayToMap(siteContent);

  const imageMap = (siteImages ?? []).reduce<
    Record<string, { path: string; alt_text: string; updated_at: string }>
  >((acc, image) => {
    acc[image.key] = {
      path: image.path,
      alt_text: image.alt_text,
      updated_at: image.updated_at,
    };
    return acc;
  }, {});

  const activitiesImage = imageMap.activities_main;

  const activitiesImageUrl = activitiesImage
    ? getSupabaseImageUrl(activitiesImage.path, activitiesImage.updated_at)
    : "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop";

  const activitiesIntro =
    content.activities_intro ||
    "Répétitions, concerts et moments de partage autour de la musique.";

  return (
    <>
      <Navbar />

      <main>
        <section className="section-space">
          <div className="page-shell grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">Activités</p>

              <h1 className="editorial-title mt-5 max-w-3xl text-5xl leading-tight text-[#1f1f1a] sm:text-6xl">
                Chanter, répéter, partager.
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-[#6d6b63] sm:text-lg">
                {activitiesIntro}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2.4rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <img
                  src={activitiesImageUrl}
                  alt={activitiesImage?.alt_text || "Activités de la chorale"}
                  className="h-[430px] w-full rounded-[2rem] object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell grid gap-5 md:grid-cols-3">
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <Reveal key={activity.title} delay={index * 0.05}>
                  <article className="h-full rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 shadow-sm">
                    <Icon size={28} className="text-[#687a5e]" />

                    <h2 className="mt-5 font-semibold text-[#1f1f1a]">
                      {activity.title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-[#6d6b63]">
                      {activity.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="section-space bg-white/55">
          <div className="page-shell">
            <Reveal>
              <div className="mb-8 max-w-3xl">
                <p className="eyebrow">Événements</p>
                <h2 className="editorial-title mt-4 text-4xl leading-tight text-[#1f1f1a] sm:text-5xl">
                  Prochaines dates
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-4">
              {(events ?? []).length === 0 && (
                <div className="rounded-[2rem] border border-[#e6e1d6] bg-white p-7 text-[#6d6b63] shadow-sm">
                  Aucun événement public pour le moment.
                </div>
              )}

              {(events ?? []).map((event, index) => (
                <Reveal key={event.id} delay={index * 0.04}>
                  <article className="grid gap-5 rounded-[2rem] border border-[#e6e1d6] bg-white p-5 shadow-sm md:grid-cols-[180px_1fr] md:items-center">
                    <div className="rounded-2xl bg-[#f3f0e8] p-5">
                      <CalendarDays size={24} className="text-[#687a5e]" />
                      <p className="mt-4 text-sm font-bold text-[#1f1f1a]">
                        {formatDate(event.event_date)}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-[#1f1f1a]">
                        {event.title}
                      </h3>

                      {event.location && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#687a5e]">
                          <MapPin size={17} />
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-4 leading-7 text-[#6d6b63]">
                          {event.description}
                        </p>
                      )}
                    </div>
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
