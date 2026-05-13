import Image from "next/image";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { contentArrayToMap } from "@/lib/content";
import { buildImageMap, getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CONTACT_ADDRESS,
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_GOOGLE_FORM_URL,
  FALLBACK_IMAGE_URL,
} from "@/lib/constants";

export default async function ContactPage() {
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

  const contactImage = imageMap.contact_banner;

  const contactImageUrl = contactImage
    ? getSupabaseImageUrl(contactImage.path, contactImage.updated_at)
    : FALLBACK_IMAGE_URL;

  const contactIntro =
    content.contact_intro ||
    "Pour une inscription, une question ou une demande d’information, contactez la chorale.";

  const email = contactSettings?.email || DEFAULT_CONTACT_EMAIL;
  const phone = contactSettings?.phone || "";
  const address = contactSettings?.address || DEFAULT_CONTACT_ADDRESS;
  const googleFormUrl =
    contactSettings?.google_form_url || DEFAULT_GOOGLE_FORM_URL;

  const mapQuery = encodeURIComponent(address);

  return (
    <>
      <Navbar />

      <main>
        <section className="section-space">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <Reveal>
              <p className="eyebrow">Contact</p>

              <h1 className="editorial-title mt-5 max-w-3xl text-5xl leading-tight text-[#1f1f1a] sm:text-6xl">
                Écrire à la chorale.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#6d6b63] sm:text-lg">
                {contactIntro}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href={googleFormUrl}>
                  <Send size={17} />
                  Ouvrir le formulaire
                </Button>
                <Button href={`mailto:${email}`} variant="secondary">
                  Envoyer un email
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2.4rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <Image
                  src={contactImageUrl}
                  alt={contactImage?.alt_text || "Contact chorale"}
                  width={800}
                  height={390}
                  unoptimized
                  className="h-[390px] w-full rounded-[2rem] object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <Reveal>
              <div className="rounded-[2rem] bg-[#1f1f1a] p-7 text-white shadow-sm">
                <h2 className="editorial-title text-3xl">Infos pratiques</h2>

                <div className="mt-7 grid gap-5">
                  <p className="flex gap-4">
                    <MapPin className="mt-1 text-[#d8bf7a]" size={21} />
                    <span>
                      <span className="block font-semibold">Adresse</span>
                      <span className="mt-1 block text-white/70">
                        {address}
                      </span>
                    </span>
                  </p>

                  <p className="flex gap-4">
                    <Mail className="mt-1 text-[#d8bf7a]" size={21} />
                    <span>
                      <span className="block font-semibold">Email</span>
                      <span className="mt-1 block text-white/70">{email}</span>
                    </span>
                  </p>

                  {phone && (
                    <p className="flex gap-4">
                      <Phone className="mt-1 text-[#d8bf7a]" size={21} />
                      <span>
                        <span className="block font-semibold">Téléphone</span>
                        <span className="mt-1 block text-white/70">
                          {phone}
                        </span>
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <iframe
                  title="Carte Chorale Rayon de Soleil"
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  className="h-[360px] w-full rounded-[1.6rem] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
