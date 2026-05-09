import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Button } from "@/components/ui/Button";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { Mail, MapPin, Music2, Send } from "lucide-react";

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

  const contactImage = imageMap.contact_banner;

  const contactImageUrl = contactImage
    ? getSupabaseImageUrl(contactImage.path, contactImage.updated_at)
    : "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop";

  const contactIntro =
    content.contact_intro ??
    "Pour une inscription, une question ou une demande d’information, contactez la chorale.";

  const email = contactSettings?.email || "contact@chorale-soleil.fr";
  const phone = contactSettings?.phone || "";
  const address = contactSettings?.address || "Lyon 6e arrondissement";
  const googleFormUrl =
    contactSettings?.google_form_url || "https://forms.google.com";

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-[#fff8ec] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
                Contact
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.03] tracking-[-0.04em] text-[#141414] sm:text-6xl">
                Contacter ou rejoindre la chorale.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#675e56]">
                {contactIntro}
              </p>
            </div>

            <div className="aspect-[5/4] overflow-hidden rounded-[2.5rem] bg-[#f4b321] shadow-xl">
              <img
                src={contactImageUrl}
                alt={contactImage?.alt_text || "Contact chorale"}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="rounded-[2rem] bg-[#202020] p-8 text-white sm:p-10">
              <h2 className="text-3xl font-black">Informations</h2>

              <div className="mt-8 grid gap-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9552f]">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <p className="font-black">Lieu</p>
                    <p className="mt-1 text-white/70">{address}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4b321] text-[#202020]">
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="font-black">Email</p>
                    <p className="mt-1 text-white/70">{email}</p>
                  </div>
                </div>

                {phone && (
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                      <Music2 size={22} />
                    </div>
                    <div>
                      <p className="font-black">Téléphone</p>
                      <p className="mt-1 text-white/70">{phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Music2 size={22} />
                  </div>
                  <div>
                    <p className="font-black">Répétitions</p>
                    <p className="mt-1 text-white/70">
                      Informations communiquées après contact.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#e8ded2] bg-[#fff8ec] p-8 sm:p-10">
              <h2 className="text-3xl font-black text-[#141414]">
                Envoyer un message
              </h2>

              <p className="mt-4 leading-7 text-[#675e56]">
                Utilisez le formulaire de contact pour une inscription, une
                question ou une demande d’information.
              </p>

              <div className="mt-8">
                <Button href={googleFormUrl} className="gap-2">
                  <Send size={18} />
                  Ouvrir le formulaire
                </Button>
              </div>

              <div className="mt-10 rounded-[1.5rem] border border-dashed border-[#e8ded2] bg-white p-6">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9552f]">
                  Formulaire externe
                </p>
                <p className="mt-3 leading-7 text-[#675e56]">
                  Le lien du formulaire peut être modifié depuis les paramètres
                  admin.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
