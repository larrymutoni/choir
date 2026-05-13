import { SUPABASE_IMAGE_BUCKET } from "@/lib/constants";

type SiteImageRow = {
  key: string;
  path: string;
  alt_text: string;
  updated_at: string;
};

export function buildImageMap(
  images: SiteImageRow[] | null,
): Record<string, SiteImageRow> {
  return (images ?? []).reduce<Record<string, SiteImageRow>>((acc, image) => {
    acc[image.key] = image;
    return acc;
  }, {});
}

export function getSupabaseImageUrl(
  path: string | null | undefined,
  version?: string | null,
) {
  if (!path) return "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return "";

  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_IMAGE_BUCKET}/${path}`;

  if (!version) return baseUrl;

  return `${baseUrl}?v=${encodeURIComponent(version)}`;
}
