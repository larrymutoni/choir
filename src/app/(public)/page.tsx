import Image from "next/image";
import { CalendarDays, Mail, MapPin, Music2, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { contentArrayToMap } from "@/lib/content";
import { buildImageMap, getSupabaseImageUrl } from "@/lib/images";
import {
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_GOOGLE_FORM_URL,
  FALLBACK_IMAGE_URL,
} from "@/lib/constants";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: siteContent },
    { data: siteImages },
    { data: contactSettings },
  ] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
    supabase
      .from("contact_settings")
      .select("email, phone, address, google_form_url")
      .limit(1)
      .single(),
  ]);

  const content = contentArrayToMap(siteContent);

  const imageMap = buildImageMap(siteImages);

  const heroTitle =
    content.home_hero_title || "Chanter ensemble, faire rayonner nos voix.";

  const heroDescription =
    content.home_hero_description ||
    "La Chorale Rayon de Soleil accueille celles et ceux qui aiment chanter, apprendre et partager des moments musicaux dans une ambiance chaleureuse.";

  const aboutTitle =
    content.home_about_title || "Une chorale au cœur de Lyon 6";

  const aboutText =
    content.home_about_text ||
    "Ici, on vient pour chanter, écouter les autres et avancer ensemble. La chorale mélange plaisir, régularité et esprit de groupe, sans perdre la simplicité qui donne envie de revenir.";

  const repertoireText =
    content.home_repertoire_text ||
    "Variété française et étrangère, chants du monde, gospel et grands classiques.";

  const rehearsalText =
    content.home_rehearsal_text || "Le mardi, 17h30–19h ou 19h30–21h.";

  const addressText =
    content.home_address_text || "33 rue Bossuet, 69006 Lyon.";

  const joinTitle = content.home_join_title || "Envie de chanter avec nous ?";

  const joinText =
    content.home_join_text ||
    "Venez assister à une répétition, rencontrer le groupe et voir si l’ambiance vous correspond. L’envie de chanter suffit pour commencer.";

  const quote =
    content.home_quote || "Développer le lien social par le chant choral.";

  const email = contactSettings?.email || DEFAULT_CONTACT_EMAIL;
  const phone = contactSettings?.phone || "";
  const googleFormUrl =
    contactSettings?.google_form_url || DEFAULT_GOOGLE_FORM_URL;

  const homeHeroImage = imageMap.home_hero;

  const homeHeroImageUrl = homeHeroImage
    ? getSupabaseImageUrl(homeHeroImage.path, homeHeroImage.updated_at)
    : FALLBACK_IMAGE_URL;

  return (
    <>
      <Navbar />

      <main>
        <section className="overflow-hidden">
          <div className="page-shell grid min-h-[calc(100vh-96px)] items-center gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:py-12">
            <Reveal>
              <div>
                <p className="eyebrow mb-5">Chorale associative · Lyon 6</p>

                <h1 className="editorial-title max-w-2xl text-5xl leading-[1.02] text-[#1f1f1a] sm:text-6xl lg:text-7xl">
                  {heroTitle}
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-[#5d5a52] sm:text-lg">
                  {heroDescription}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button href={googleFormUrl}>Nous rejoindre</Button>
                  <Button href="/a-propos" variant="secondary">
                    Découvrir la chorale
                  </Button>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative mx-auto w-full max-w-[760px]">
                <div className="absolute -left-8 bottom-10 hidden h-44 w-44 rounded-full bg-[#c7d3bf]/50 blur-3xl lg:block" />
                <div className="absolute -right-5 top-8 hidden h-32 w-32 rounded-full bg-[#d8bf7a]/45 blur-2xl lg:block" />

                <div className="relative hero-photo-frame overflow-hidden border-[10px] border-white bg-[#d8bf7a] shadow-2xl shadow-black/10 h-[560px] sm:h-[620px] lg:h-[680px]">
                  <Image
                    src={homeHeroImageUrl}
                    alt={homeHeroImage?.alt_text || "Chorale en concert"}
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 760px) 100vw, 760px"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-y border-[#e6e1d6] bg-white/70">
          <div className="page-shell grid gap-0 md:grid-cols-3 md:divide-x md:divide-[#e6e1d6]">
            <div className="py-7 md:pr-8">
              <Music2 className="text-[#687a5e]" size={26} />
              <h2 className="mt-4 text-sm font-semibold text-[#1f1f1a]">
                Répertoire
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
                {repertoireText}
              </p>
            </div>

            <div className="border-t border-[#e6e1d6] py-7 md:border-t-0 md:px-8">
              <CalendarDays className="text-[#687a5e]" size={26} />
              <h2 className="mt-4 text-sm font-semibold text-[#1f1f1a]">
                Répétitions
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
                {rehearsalText}
              </p>
            </div>

            <div className="border-t border-[#e6e1d6] py-7 md:border-t-0 md:pl-8">
              <MapPin className="text-[#687a5e]" size={26} />
              <h2 className="mt-4 text-sm font-semibold text-[#1f1f1a]">
                Lieu
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6d6b63]">
                {addressText}
              </p>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="page-shell">
            <Reveal>
              <div className="grid overflow-hidden rounded-[2.4rem] border border-[#e6e1d6] bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-[#687a5e] p-8 text-white sm:p-10 lg:p-12">
                  <p className="text-sm font-medium text-white/75">
                    Qui sommes-nous ?
                  </p>

                  <h2 className="editorial-title mt-4 max-w-xl text-4xl leading-tight sm:text-5xl">
                    {aboutTitle}
                  </h2>

                  <p className="mt-5 max-w-xl text-base leading-8 text-white/78">
                    {aboutText}
                  </p>

                  <p className="mt-6 border-l border-white/35 pl-4 text-sm italic leading-7 text-white/75">
                    {quote}
                  </p>

                  <Button href="/a-propos" variant="light" className="mt-7">
                    En savoir plus
                  </Button>
                </div>

                <div className="grid content-between gap-8 p-8 sm:p-10 lg:p-12">
                  <div>
                    <p className="eyebrow">Pourquoi venir ?</p>
                    <h3 className="editorial-title mt-3 text-3xl leading-tight text-[#1f1f1a]">
                      Pour chanter, respirer, rencontrer.
                    </h3>
                    <p className="mt-4 leading-8 text-[#6d6b63]">
                      Une chorale, c’est plus qu’un cours de chant : c’est un
                      rendez-vous régulier, une énergie de groupe et le plaisir
                      d’entendre les voix se construire ensemble.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f3f0e8] p-4">
                      <Users size={22} className="text-[#687a5e]" />
                      <p className="mt-3 text-sm font-semibold text-[#1f1f1a]">
                        Débutants bienvenus
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f3f0e8] p-4">
                      <Music2 size={22} className="text-[#687a5e]" />
                      <p className="mt-3 text-sm font-semibold text-[#1f1f1a]">
                        Travail collectif
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="pb-14 sm:pb-16 lg:pb-20">
          <div className="page-shell">
            <Reveal>
              <div className="grid gap-8 rounded-[2.4rem] border border-[#e6e1d6] bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <p className="eyebrow">Rejoindre la chorale</p>

                  <h2 className="editorial-title mt-4 text-4xl leading-tight text-[#1f1f1a] sm:text-5xl">
                    {joinTitle}
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-8 text-[#6d6b63]">
                    {joinText}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button href={googleFormUrl}>Nous écrire</Button>
                    <Button href="/contact" variant="secondary">
                      Infos pratiques
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[#5d5a52]">
                  <div className="flex gap-3 rounded-2xl bg-[#f3f0e8] p-4">
                    <MapPin size={20} className="text-[#687a5e]" />
                    <p>{addressText}</p>
                  </div>

                  <div className="flex gap-3 rounded-2xl bg-[#f3f0e8] p-4">
                    <Mail size={20} className="text-[#687a5e]" />
                    <p>{email}</p>
                  </div>

                  {phone && (
                    <div className="flex gap-3 rounded-2xl bg-[#f3f0e8] p-4">
                      <Phone size={20} className="text-[#687a5e]" />
                      <p>{phone}</p>
                    </div>
                  )}
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
