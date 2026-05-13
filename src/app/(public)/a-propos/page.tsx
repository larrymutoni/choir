import Image from "next/image";
import { Heart, Music2, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { contentArrayToMap } from "@/lib/content";
import { buildImageMap, getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_IMAGE_URL } from "@/lib/constants";

const values = [
  {
    icon: Heart,
    title: "Convivialité",
    description: "Un groupe où l’on vient chanter, mais aussi se retrouver.",
  },
  {
    icon: Music2,
    title: "Plaisir musical",
    description: "Un répertoire varié, travaillé avec régularité et envie.",
  },
  {
    icon: Sparkles,
    title: "Progression",
    description: "Chaque voix compte et avance au rythme du collectif.",
  },
  {
    icon: Users,
    title: "Ouverture",
    description:
      "Une chorale accueillante pour celles et ceux qui aiment chanter.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();

  const [{ data: siteContent }, { data: siteImages }] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
  ]);

  const content = contentArrayToMap(siteContent);

  const imageMap = buildImageMap(siteImages);

  const aboutImage = imageMap.about_main;

  const aboutImageUrl = aboutImage
    ? getSupabaseImageUrl(aboutImage.path, aboutImage.updated_at)
    : FALLBACK_IMAGE_URL;

  const pageTitle =
    content.about_page_title || "Une histoire de passion et de partage.";

  const intro =
    content.about_intro ||
    "La Chorale Rayon de Soleil rassemble des voix et des parcours différents autour d’une même envie : chanter ensemble.";

  const storyTitle =
    content.about_story_title || "Chanter ensemble, créer du lien.";

  const storyText =
    content.about_story_text ||
    "La Chorale Rayon de Soleil est un espace musical et humain. On y vient pour chanter, progresser, écouter les autres et partager des moments simples autour d’un répertoire varié.";

  const valuesTitle = content.about_values_title || "Ce qui nous rassemble";

  const quote =
    content.about_quote || "La musique nous rassemble, une voix après l’autre.";

  return (
    <>
      <Navbar />

      <main>
        <section className="section-space">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">La chorale</p>

              <h1 className="editorial-title mt-5 max-w-3xl text-5xl leading-tight text-[#1f1f1a] sm:text-6xl">
                {pageTitle}
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#6d6b63] sm:text-lg">
                {intro}
              </p>

              <div className="mt-8">
                <Button href="/contact">Nous rejoindre</Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2.2rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <Image
                  src={aboutImageUrl}
                  alt={aboutImage?.alt_text || "Membres de la chorale"}
                  width={800}
                  height={420}
                  unoptimized
                  className="h-[420px] w-full rounded-[1.8rem] object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell">
            <Reveal>
              <div className="grid gap-8 rounded-[2.2rem] border border-[#e6e1d6] bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="eyebrow">Notre histoire</p>
                  <h2 className="editorial-title mt-4 text-4xl leading-tight text-[#1f1f1a] sm:text-5xl">
                    {storyTitle}
                  </h2>
                </div>

                <div>
                  <p className="text-base leading-8 text-[#6d6b63]">
                    {storyText}
                  </p>

                  <p className="mt-7 border-l-2 border-[#d8bf7a] pl-5 text-lg italic leading-8 text-[#687a5e]">
                    {quote}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space bg-white/55">
          <div className="page-shell">
            <Reveal>
              <div className="mb-8 max-w-3xl">
                <p className="eyebrow">Valeurs</p>
                <h2 className="editorial-title mt-4 text-4xl leading-tight sm:text-5xl">
                  {valuesTitle}
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => {
                const Icon = value.icon;

                return (
                  <Reveal key={value.title} delay={index * 0.04}>
                    <article className="h-full rounded-[1.8rem] border border-[#e6e1d6] bg-white p-6 shadow-sm">
                      <Icon size={27} className="text-[#687a5e]" />

                      <h3 className="mt-5 font-semibold text-[#1f1f1a]">
                        {value.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#6d6b63]">
                        {value.description}
                      </p>
                    </article>
                  </Reveal>
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
