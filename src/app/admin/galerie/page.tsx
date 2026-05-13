import Image from "next/image";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { GalleryImageActions } from "@/components/admin/GalleryImageActions";
import { GalleryUploadForm } from "@/components/admin/GalleryUploadForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseImageUrl } from "@/lib/images";
import { requirePermission } from "@/lib/auth";

export default async function AdminGalleryPage() {
  const admin = await requirePermission("gallery");
  const supabase = createAdminClient();

  const { data: images, error } = await supabase
    .from("gallery_images")
    .select(
      "id, title, alt_text, category, path, position, is_visible, created_at",
    )
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Galerie"
        description="Ajouter, organiser, masquer ou supprimer les photos de la galerie."
        email={admin.email}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#141414]">
            Photos de la galerie
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {(images ?? []).length === 0 && (
              <p className="rounded-2xl bg-[#fff8ec] p-5 text-sm font-semibold text-[#675e56] md:col-span-2">
                Aucune image dans la galerie pour le moment.
              </p>
            )}

            {(images ?? []).map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-[1.5rem] border border-[#e8ded2] bg-[#fff8ec]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-white">
                  <Image
                    src={getSupabaseImageUrl(image.path)}
                    alt={image.alt_text || image.title}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={
                        image.is_visible
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600"
                      }
                    >
                      {image.is_visible ? "Visible" : "Masquée"}
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#675e56]">
                      {image.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#141414]">
                    {image.title}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-[#675e56]">
                    Position : {image.position}
                  </p>

                  <div className="mt-4">
                    <GalleryImageActions
                      id={image.id}
                      isVisible={image.is_visible}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <GalleryUploadForm />
      </div>
    </main>
  );
}
