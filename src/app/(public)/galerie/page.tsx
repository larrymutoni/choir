import Image from "next/image";
import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
import { Reveal } from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseImageUrl } from "@/lib/images";

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: images, error } = await supabase
    .from("gallery_images")
    .select("id, title, alt_text, category, path, position")
    .eq("is_visible", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  const categories = Array.from(
    new Set((images ?? []).map((image) => image.category)),
  );

  return (
    <>
      <Navbar />

      <main>
        <section className="section-space pb-10">
          <div className="page-shell">
            <Reveal>
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div>
                  <p className="eyebrow">Galerie</p>
                  <h1 className="editorial-title mt-5 max-w-3xl text-5xl leading-tight text-[#1f1f1a] sm:text-6xl">
                    Moments de chorale.
                  </h1>
                </div>

                <p className="max-w-2xl text-base leading-8 text-[#6d6b63]">
                  Concerts, répétitions, rencontres : quelques images de la vie
                  du groupe.
                </p>
              </div>
            </Reveal>

            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#687a5e] px-5 py-2 text-sm font-semibold text-white">
                  Tout
                </span>

                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[#d9d3c8] bg-white px-5 py-2 text-sm font-semibold text-[#6d6b63]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pb-14 sm:pb-16 lg:pb-20">
          <div className="page-shell">
            {(images ?? []).length === 0 && (
              <div className="soft-card rounded-[2rem] p-8 text-[#6d6b63]">
                Aucune photo publiée pour le moment.
              </div>
            )}

            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {(images ?? []).map((image, index) => (
                <Reveal key={image.id} delay={index * 0.025}>
                  <article className="mb-5 break-inside-avoid overflow-hidden rounded-[2rem] border border-[#e6e1d6] bg-white shadow-sm">
                    <Image
                      src={getSupabaseImageUrl(image.path)}
                      alt={image.alt_text || image.title}
                      width={800}
                      height={600}
                      unoptimized
                      className="w-full h-auto"
                    />

                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687a5e]">
                        {image.category}
                      </p>
                      <h2 className="mt-2 font-semibold text-[#1f1f1a]">
                        {image.title}
                      </h2>
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
