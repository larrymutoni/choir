import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageSlotCard } from "@/components/admin/ImageSlotCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseImageUrl } from "@/lib/images";

export default async function AdminImagesPage() {
  const supabase = createAdminClient();

  const { data: images, error } = await supabase
    .from("site_images")
    .select("id, key, label, path, alt_text, updated_at")
    .order("label", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main>
      <AdminHeader
        title="Images site"
        description="Remplacer les images principales utilisées sur les pages publiques."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(images ?? []).map((image) => (
          <ImageSlotCard
            key={image.id}
            imageKey={image.key}
            label={image.label}
            path={image.path}
            altText={image.alt_text}
            imageUrl={getSupabaseImageUrl(image.path, image.updated_at)}
          />
        ))}
      </div>
    </main>
  );
}
