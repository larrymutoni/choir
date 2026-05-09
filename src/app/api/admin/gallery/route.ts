import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_IMAGE_BUCKET } from "@/lib/constants";

const uploadGallerySchema = z.object({
  title: z.string().min(2),
  alt_text: z.string().optional().default(""),
  category: z.string().optional().default("general"),
  position: z.coerce.number().optional().default(0),
});

const updateGallerySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).optional(),
  alt_text: z.string().optional(),
  category: z.string().optional(),
  position: z.coerce.number().optional(),
  is_visible: z.boolean().optional(),
});

const deleteGallerySchema = z.object({
  id: z.string().uuid(),
  path: z.string().min(1),
});

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();

  const file = formData.get("file");
  const title = formData.get("title");
  const altText = formData.get("alt_text");
  const category = formData.get("category");
  const position = formData.get("position");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Image file is required." },
      { status: 400 },
    );
  }

  const parsed = uploadGallerySchema.safeParse({
    title,
    alt_text: altText,
    category,
    position,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid gallery data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${safeFileName(file.name)}.${extension}`;
  const path = `gallery/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await supabase.from("gallery_images").insert({
    title: parsed.data.title,
    alt_text: parsed.data.alt_text,
    category: parsed.data.category,
    position: parsed.data.position,
    path,
    is_visible: true,
  });

  if (insertError) {
    await supabase.storage.from(SUPABASE_IMAGE_BUCKET).remove([path]);

    return NextResponse.json({ message: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Gallery image uploaded successfully.",
  });
}

export async function PUT(request: Request) {
  await requireAdmin();

  const body = await request.json();
  const parsed = updateGallerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid gallery update data." },
      { status: 400 },
    );
  }

  const { id, ...values } = parsed.data;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("gallery_images")
    .update(values)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Gallery image updated successfully.",
  });
}

export async function DELETE(request: Request) {
  await requireAdmin();

  const body = await request.json();
  const parsed = deleteGallerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid gallery delete data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error: deleteDbError } = await supabase
    .from("gallery_images")
    .delete()
    .eq("id", parsed.data.id);

  if (deleteDbError) {
    return NextResponse.json(
      { message: deleteDbError.message },
      { status: 500 },
    );
  }

  await supabase.storage.from(SUPABASE_IMAGE_BUCKET).remove([parsed.data.path]);

  return NextResponse.json({
    ok: true,
    message: "Gallery image deleted successfully.",
  });
}
