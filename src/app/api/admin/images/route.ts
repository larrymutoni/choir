import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_IMAGE_BUCKET } from "@/lib/constants";

const replaceImageSchema = z.object({
  key: z.string().min(1),
  alt_text: z.string().optional().default(""),
});

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();

  const file = formData.get("file");
  const key = formData.get("key");
  const altText = formData.get("alt_text");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Image file is required." },
      { status: 400 },
    );
  }

  const parsed = replaceImageSchema.safeParse({
    key,
    alt_text: altText,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid image data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: imageSlot, error: slotError } = await supabase
    .from("site_images")
    .select("id, key, path")
    .eq("key", parsed.data.key)
    .single();

  if (slotError || !imageSlot) {
    return NextResponse.json(
      { message: "Image slot not found." },
      { status: 404 },
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .upload(imageSlot.path, file, {
      cacheControl: "60",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("site_images")
    .update({
      alt_text: parsed.data.alt_text,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsed.data.key);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Image replaced successfully.",
  });
}
