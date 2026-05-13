import { AdminHeader } from "@/components/admin/AdminHeader";
import { ImageSlotCard } from "@/components/admin/ImageSlotCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseImageUrl } from "@/lib/images";
import { requirePermission } from "@/lib/auth";

export default async function AdminImagesPage() {
  const admin = await requirePermission("images");
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
        email={admin.email}
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
