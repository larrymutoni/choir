import { Accessibility, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/public/ContactForm";
import { contentArrayToMap } from "@/lib/content";
import { getSupabaseImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

type ContactPerson = {
  id: string;
  name: string;
  role_label: string | null;
  phone: string | null;
  position: number;
  is_visible: boolean;
};

export default async function ContactPage() {
  const supabase = await createClient();

  const [
    { data: siteContent },
    { data: siteImages },
    { data: contactSettings },
    { data: contactPeople },
  ] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_images").select("key, path, alt_text, updated_at"),
    supabase
      .from("contact_settings")
      .select(
        "email, admin_address, rehearsal_address, accessibility_note, show_map, map_query",
      )
      .limit(1)
      .single(),
    supabase
      .from("contact_people")
      .select("id, name, role_label, phone, position, is_visible")
      .eq("is_visible", true)
      .order("position", { ascending: true }),
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
    content.contact_intro ||
    "Pour une inscription, une question ou une demande d’information, contactez la chorale.";

  const email = contactSettings?.email || "rayondesoleillyon6@gmail.com";

  const adminAddress =
    contactSettings?.admin_address ||
    "Ensemble Vocal Rayon de Soleil Lyon 6, 33 rue Bossuet, 69006 Lyon";

  const rehearsalAddress =
    contactSettings?.rehearsal_address || "37 rue Bossuet, 69006 Lyon";

  const accessibility =
    contactSettings?.accessibility_note ||
    "Salle au sous-sol avec ascenseur pour les personnes à mobilité réduite.";

  const showMap = contactSettings?.show_map ?? true;

  const mapQuery = encodeURIComponent(
    contactSettings?.map_query || rehearsalAddress,
  );

  const people = (contactPeople ?? []) as ContactPerson[];

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
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-[2.4rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                <img
                  src={contactImageUrl}
                  alt={contactImage?.alt_text || "Contact chorale"}
                  className="h-[390px] w-full rounded-[2rem] object-cover"
                />
              </div>
            </Reveal>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <Reveal>
              <div className="grid gap-5">
                <section className="rounded-[2rem] bg-[#1f1f1a] p-7 text-white shadow-sm">
                  <h2 className="editorial-title text-3xl">Infos pratiques</h2>

                  <div className="mt-7 grid gap-5">
                    <p className="flex gap-4">
                      <MapPin className="mt-1 text-[#d8bf7a]" size={21} />
                      <span>
                        <span className="block font-semibold">
                          Adresse administrative
                        </span>
                        <span className="mt-1 block text-white/70">
                          {adminAddress}
                        </span>
                      </span>
                    </p>

                    <p className="flex gap-4">
                      <MapPin className="mt-1 text-[#d8bf7a]" size={21} />
                      <span>
                        <span className="block font-semibold">
                          Adresse des répétitions
                        </span>
                        <span className="mt-1 block text-white/70">
                          {rehearsalAddress}
                        </span>
                      </span>
                    </p>

                    <p className="flex gap-4">
                      <Accessibility
                        className="mt-1 text-[#d8bf7a]"
                        size={21}
                      />
                      <span>
                        <span className="block font-semibold">
                          Accessibilité
                        </span>
                        <span className="mt-1 block text-white/70">
                          {accessibility}
                        </span>
                      </span>
                    </p>

                    <p className="flex gap-4">
                      <Mail className="mt-1 text-[#d8bf7a]" size={21} />
                      <span>
                        <span className="block font-semibold">Email</span>
                        <span className="mt-1 block break-all text-white/70">
                          {email}
                        </span>
                      </span>
                    </p>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e1d6] bg-white p-7 shadow-sm">
                  <h2 className="editorial-title text-3xl text-[#1f1f1a]">
                    Personnes à contacter
                  </h2>

                  <div className="mt-6 grid gap-4">
                    {people.length === 0 && (
                      <p className="text-sm leading-7 text-[#6d6b63]">
                        Aucune personne à contacter n’est affichée pour le
                        moment.
                      </p>
                    )}

                    {people.map((person) => (
                      <article
                        key={person.id}
                        className="rounded-2xl bg-[#f7f5ef] p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#687a5e]">
                            <UserRound size={21} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-black text-[#1f1f1a]">
                              {person.name}
                            </h3>

                            {person.role_label && (
                              <p className="mt-1 text-sm text-[#6d6b63]">
                                {person.role_label}
                              </p>
                            )}

                            {person.phone && (
                              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#687a5e]">
                                <Phone size={16} />
                                {person.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <ContactForm />
            </Reveal>
          </div>
        </section>

        {showMap && (
          <section className="section-space pt-0">
            <div className="page-shell">
              <Reveal>
                <div className="overflow-hidden rounded-[2rem] border border-[#e6e1d6] bg-white p-3 shadow-sm">
                  <iframe
                    title="Carte des répétitions"
                    src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                    className="h-[360px] w-full rounded-[1.6rem] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
