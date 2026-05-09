import { Footer } from "@/components/public/Footer";
import { Navbar } from "@/components/public/Navbar";
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
        <section className="bg-[#fff8ec] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e9552f]">
              Galerie
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.03] tracking-[-0.04em] text-[#141414] sm:text-6xl">
              Photos, concerts et moments de chorale.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#675e56]">
              Découvrez quelques moments partagés par la chorale.
            </p>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-wrap gap-3">
              <span className="rounded-full border border-[#e8ded2] bg-[#fff8ec] px-5 py-2 text-sm font-bold text-[#141414]">
                Tout
              </span>

              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[#e8ded2] bg-white px-5 py-2 text-sm font-bold text-[#675e56]"
                >
                  {category}
                </span>
              ))}
            </div>

            {(images ?? []).length === 0 && (
              <div className="rounded-[2rem] bg-[#fff8ec] p-8 text-[#675e56]">
                Aucune photo publiée pour le moment.
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(images ?? []).map((image) => (
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

                    <h2 className="mt-2 text-xl font-black text-[#141414]">
                      {image.title}
                    </h2>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
