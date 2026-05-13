import Image from "next/image";
import { CalendarDays, Mic2, Music2, Sparkles } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { contentArrayToMap } from "@/lib/content";
import { buildImageMap, getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_IMAGE_URL } from "@/lib/constants";

const activities = [
  {
    icon: Mic2,
    title: "Répétitions",
    description:
      "Chaque semaine, le groupe travaille le répertoire, l’écoute et la cohésion vocale.",
  },
  {
    icon: Music2,
    title: "Concerts",
    description:
      "Des temps publics pour partager le travail de la chorale avec le quartier.",
  },
  {
    icon: CalendarDays,
    title: "Événements",
    description:
      "Des rencontres musicales, projets associatifs et moments conviviaux.",
  },
  {
    icon: Sparkles,
    title: "Découverte",
    description:
      "Des occasions simples pour venir écouter, essayer et rencontrer le groupe.",
  },
];

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const [{ data: siteContent }, { data: siteImages }] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
  ]);

  const content = contentArrayToMap(siteContent);

  const imageMap = buildImageMap(siteImages);

  const activitiesImage = imageMap.activities_main;

  const activitiesImageUrl = activitiesImage
    ? getSupabaseImageUrl(activitiesImage.path, activitiesImage.updated_at)
    : FALLBACK_IMAGE_URL;

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
                Nos rendez-vous musicaux.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#6d6b63] sm:text-lg">
                {activitiesIntro}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2.4rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <Image
                  src={activitiesImageUrl}
                  alt={activitiesImage?.alt_text || "Activités de la chorale"}
                  width={800}
                  height={430}
                  unoptimized
                  className="h-[430px] w-full rounded-[2rem] object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space bg-white/55">
          <div className="page-shell grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <Reveal key={activity.title} delay={index * 0.05}>
                  <article className="soft-card h-full rounded-[2rem] p-7">
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

        <section className="section-space">
          <div className="page-shell">
            <Reveal>
              <div className="rounded-[2.4rem] bg-[#687a5e] p-8 text-white sm:p-12 lg:p-14">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <h2 className="editorial-title max-w-3xl text-4xl leading-tight sm:text-5xl">
                      Vous voulez chanter avec nous ?
                    </h2>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
                      Venez assister à une répétition et découvrir le groupe.
                    </p>
                  </div>

                  <Button href="/contact" variant="secondary">
                    Nous contacter
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
