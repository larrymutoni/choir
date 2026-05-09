import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, Mic2, Music2, Sparkles } from "lucide-react";

const activities = [
  {
    icon: Mic2,
    title: "Répétitions",
    description:
      "Des séances régulières pour travailler le répertoire, la voix, l’écoute et la cohésion du groupe.",
  },
  {
    icon: Music2,
    title: "Concerts",
    description:
      "Des représentations publiques pour partager le travail de la chorale avec les habitants et les proches.",
  },
  {
    icon: CalendarDays,
    title: "Événements",
    description:
      "Des moments musicaux ponctuels, rencontres associatives ou animations selon le calendrier.",
  },
  {
    icon: Sparkles,
    title: "Répétitions ouvertes",
    description:
      "Des occasions de découvrir l’ambiance de la chorale avant de rejoindre le groupe.",
  },
];

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const [{ data: siteContent }, { data: siteImages }] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
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
    : "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200&auto=format&fit=crop";

  const activitiesIntro =
    content.activities_intro ??
    "Répétitions, concerts et moments de partage autour de la musique.";

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-[#fff8ec] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                Activités
              </p>

              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.04em] text-[#141414] sm:text-6xl">
                Répétitions, concerts et moments de partage.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#675e56]">
                {activitiesIntro}
              </p>
            </div>

            <div className="aspect-[5/4] overflow-hidden rounded-[2.5rem] bg-[#f4b321] shadow-xl">
              <img
                src={activitiesImageUrl}
                alt={activitiesImage?.alt_text || "Activités de la chorale"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-6 md:grid-cols-2 lg:px-8">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <article
                  key={activity.title}
                  className="rounded-[2rem] border border-[#e8ded2] bg-[#fff8ec] p-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9552f] text-white">
                    <Icon size={26} />
                  </div>

                  <h2 className="mt-6 text-2xl font-black text-[#141414]">
                    {activity.title}
                  </h2>

                  <p className="mt-3 leading-7 text-[#675e56]">
                    {activity.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#fff8ec] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[2.5rem] bg-[#e9552f] p-8 text-white sm:p-12 lg:p-16">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h2 className="max-w-3xl text-4xl font-black tracking-[-0.03em] sm:text-5xl">
                    Vous souhaitez participer ou inviter la chorale ?
                  </h2>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                    Utilisez la page contact pour demander plus d’informations.
                  </p>
                </div>

                <Button href="/contact" variant="dark">
                  Contacter la chorale
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
