import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { Heart, Music2, Sparkles, Users } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Convivialité",
    description:
      "Un espace où chacun peut progresser, chanter et partager dans une ambiance humaine.",
  },
  {
    icon: Music2,
    title: "Plaisir musical",
    description:
      "Un répertoire vivant, accessible et varié, pensé pour créer de beaux moments collectifs.",
  },
  {
    icon: Sparkles,
    title: "Énergie collective",
    description:
      "Chaque voix compte et contribue à la couleur unique du groupe.",
  },
];

export default async function AboutPage() {
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

  const aboutImage = imageMap.about_main;

  const aboutImageUrl = aboutImage
    ? getSupabaseImageUrl(aboutImage.path, aboutImage.updated_at)
    : "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop";

  const aboutIntro =
    content.about_intro ??
    "La Chorale Rayon de Soleil rassemble des voix et des parcours différents autour d’une même envie : chanter ensemble.";

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-[#fff8ec] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                À propos
              </p>

              <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[1.03] tracking-[-0.04em] text-[#141414] sm:text-6xl">
                Une chorale locale, vivante et tournée vers le partage.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-[#675e56]">
                {aboutIntro}
              </p>

              <div className="mt-9">
                <Button href="/contact">Nous rejoindre</Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[5/4] overflow-hidden rounded-[2.5rem] bg-[#f4b321] shadow-xl">
                <img
                  src={aboutImageUrl}
                  alt={aboutImage?.alt_text || "Membres de la chorale"}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute -bottom-8 left-6 rounded-[2rem] bg-white p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1df] text-[#e9552f]">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-[#141414]">35+</p>
                    <p className="text-sm font-semibold text-[#675e56]">
                      choristes réunis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                  Notre histoire
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-[#141414] sm:text-5xl">
                  Une aventure musicale construite autour des personnes.
                </h2>
              </div>

              <div className="space-y-6 text-lg leading-8 text-[#675e56]">
                <p>
                  La chorale est un lieu de rencontre, de travail vocal et de
                  plaisir musical. Elle permet à chacun de participer à une
                  dynamique collective, sans perdre la dimension simple et
                  humaine qui fait la force du groupe.
                </p>

                <p>
                  Le site présente les activités, les concerts, les photos et
                  les informations utiles pour rejoindre ou contacter la
                  chorale.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <article
                    key={value.title}
                    className="rounded-[2rem] border border-[#e8ded2] bg-[#fff8ec] p-7"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9552f] text-white">
                      <Icon size={26} />
                    </div>

                    <h3 className="mt-6 text-2xl font-black text-[#141414]">
                      {value.title}
                    </h3>

                    <p className="mt-3 leading-7 text-[#675e56]">
                      {value.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
