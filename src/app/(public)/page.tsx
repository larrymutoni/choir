import { CalendarDays, Heart, Mic2, Music2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { createClient } from "@/lib/supabase/server";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";

const activities = [
  {
    icon: Mic2,
    title: "Répétitions",
    description:
      "Des séances régulières pour travailler la voix, le rythme et le répertoire.",
  },
  {
    icon: Music2,
    title: "Concerts",
    description:
      "Des prestations locales pour partager l’énergie du groupe avec le public.",
  },
  {
    icon: Heart,
    title: "Vie associative",
    description:
      "Une ambiance humaine, conviviale et ouverte autour de la musique.",
  },
];

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: siteContent },
    { data: events },
    { data: siteImages },
    { data: galleryImages },
  ] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase
      .from("events")
      .select("id, title, description, event_date, location")
      .eq("is_visible", true)
      .order("event_date", { ascending: true })
      .limit(3),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
    supabase
      .from("gallery_images")
      .select("id, title, alt_text, category, path, position")
      .eq("is_visible", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(3),
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

  const heroTitle =
    content.home_hero_title ??
    "Une chorale lumineuse pour chanter, partager et rassembler.";

  const heroDescription =
    content.home_hero_description ??
    "Découvrez nos concerts, nos répétitions et les moments musicaux qui font vivre la Chorale Rayon de Soleil.";

  const homeHeroImage = imageMap.home_hero;

  const homeHeroImageUrl = homeHeroImage
    ? getSupabaseImageUrl(homeHeroImage.path, homeHeroImage.updated_at)
    : "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200&auto=format&fit=crop";

  const nextEvent = events?.[0];

  return (
    <>
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[#fff8ec]">
          <div className="absolute right-0 top-20 hidden h-[520px] w-[520px] rounded-full bg-[#f4b321]/25 blur-3xl lg:block" />
          <div className="absolute left-[-160px] top-56 hidden h-[360px] w-[360px] rounded-full bg-[#e9552f]/10 blur-3xl lg:block" />

          <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-[#e8ded2] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#e9552f]">
                Chorale associative à Lyon 6
              </p>

              <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.04em] text-[#141414] sm:text-6xl lg:text-7xl">
                {heroTitle}
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-[#675e56] sm:text-xl">
                {heroDescription}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/contact">Nous contacter</Button>
                <Button href="/galerie" variant="secondary">
                  Voir la galerie
                </Button>
              </div>

              <div className="mt-12 grid max-w-lg grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-black text-[#141414]">35+</p>
                  <p className="mt-1 text-sm font-semibold text-[#675e56]">
                    choristes
                  </p>
                </div>

                <div>
                  <p className="text-3xl font-black text-[#141414]">12</p>
                  <p className="mt-1 text-sm font-semibold text-[#675e56]">
                    événements/an
                  </p>
                </div>

                <div>
                  <p className="text-3xl font-black text-[#141414]">1</p>
                  <p className="mt-1 text-sm font-semibold text-[#675e56]">
                    répétition/semaine
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[#f4b321] shadow-2xl shadow-[#e9552f]/10">
                <img
                  src={homeHeroImageUrl}
                  alt={homeHeroImage?.alt_text || "Chorale en concert"}
                  className="h-full w-full object-cover"
                />
              </div>

              {nextEvent && (
                <div className="absolute -bottom-8 left-4 right-4 rounded-[2rem] border border-[#e8ded2] bg-white p-5 shadow-xl sm:left-10 sm:right-auto sm:w-80">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1df] text-[#e9552f]">
                      <CalendarDays size={24} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#e9552f]">
                        Prochain événement
                      </p>
                      <p className="text-lg font-black text-[#141414]">
                        {nextEvent.title}
                      </p>
                      <p className="text-sm font-semibold text-[#675e56]">
                        {formatEventDate(nextEvent.event_date)} ·{" "}
                        {nextEvent.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                  Notre univers
                </p>
                <h2 className="mt-4 max-w-xl text-4xl font-black tracking-[-0.03em] text-[#141414] sm:text-5xl">
                  Des voix différentes, une même énergie collective.
                </h2>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-[#675e56]">
                La chorale réunit des passionnés autour d’un répertoire
                accessible, chaleureux et varié. Le site met en avant les
                activités, les concerts et la vie du groupe.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
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

                    <h3 className="mt-6 text-2xl font-black text-[#141414]">
                      {activity.title}
                    </h3>

                    <p className="mt-3 leading-7 text-[#675e56]">
                      {activity.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#fff8ec] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[2.5rem] bg-[#202020] p-6 text-white sm:p-10 lg:p-14">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f4b321]">
                    Agenda
                  </p>

                  <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] sm:text-5xl">
                    Prochaines dates et concerts
                  </h2>

                  <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
                    Retrouvez les prochaines dates de la chorale, les
                    répétitions ouvertes et les concerts publics.
                  </p>

                  <Button href="/concerts" className="mt-8">
                    Voir l’agenda
                  </Button>
                </div>

                <div className="grid gap-4">
                  {(events ?? []).map((event) => (
                    <article
                      key={event.id}
                      className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur"
                    >
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#f4b321]">
                        {formatEventDate(event.event_date)}
                      </p>

                      <h3 className="mt-2 text-xl font-black">{event.title}</h3>

                      <p className="mt-1 text-sm font-medium text-white/60">
                        {event.location}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                  Galerie
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#141414] sm:text-5xl">
                  Moments de chorale
                </h2>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-[#675e56]">
                Une galerie administrable pour afficher les photos de concerts,
                répétitions et événements.
              </p>
            </div>

            {galleryImages && galleryImages.length > 0 ? (
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {galleryImages.map((image) => (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-[2rem] border border-[#e8ded2] bg-[#fff8ec]"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={getSupabaseImageUrl(image.path)}
                        alt={image.alt_text || image.title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e9552f]">
                        {image.category}
                      </p>

                      <h3 className="mt-2 text-xl font-black text-[#141414]">
                        {image.title}
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-12 rounded-[2rem] bg-[#fff8ec] p-8 text-[#675e56]">
                Aucune photo publiée pour le moment.
              </div>
            )}

            <div className="mt-10">
              <Button href="/galerie" variant="secondary">
                Voir toutes les photos
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-[#fff8ec] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[2.5rem] bg-[#e9552f] px-6 py-14 text-white sm:px-12 lg:px-16">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                    <Users size={28} />
                  </div>

                  <h2 className="max-w-3xl text-4xl font-black tracking-[-0.03em] sm:text-5xl">
                    Envie de chanter avec nous ?
                  </h2>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
                    Contactez la chorale pour obtenir les informations de
                    répétition, les conditions d’inscription et les prochaines
                    dates ouvertes.
                  </p>
                </div>

                <Button href="/contact" variant="dark">
                  Prendre contact
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
