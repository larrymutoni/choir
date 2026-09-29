import { NextResponse } from "next/server";
import { z } from "zod";

import {
  IMAGE_SLOTS,
  SUPABASE_IMAGE_BUCKET,
} from "@/lib/constants";

import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);


const imageDataSchema = z.object({
  key: z.string().min(1),
  alt_text: z.string().trim().max(300).optional().default(""),
});

function getSlot(key: string) {
  return IMAGE_SLOTS.find(
    (slot) => slot.key === key,
  );
}

export async function POST(request: Request) {
  await requirePermission("images");

  const formData = await request.formData();

  const file = formData.get("file");
  const key = formData.get("key");
  const altText = formData.get("alt_text");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { message: "Choisissez une image." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { message: "Format accepté : JPG, PNG ou WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { message: "L’image ne doit pas dépasser 8 Mo." },
      { status: 400 },
    );
  }

  const parsed = imageDataSchema.safeParse({
    key,
    alt_text: altText,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const slot = getSlot(parsed.data.key);

  if (!slot) {
    return NextResponse.json(
      { message: "Emplacement d’image introuvable." },
      { status: 404 },
    );
  }

  const supabase = createAdminClient();

  const { error: uploadError } =
    await supabase.storage
      .from(SUPABASE_IMAGE_BUCKET)
      .upload(slot.path, file, {
        cacheControl: "60",
        upsert: true,
        contentType: file.type,
      });

  if (uploadError) {
    return NextResponse.json(
      { message: uploadError.message },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from("site_images")
    .select("id")
    .eq("key", slot.key)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { message: existingError.message },
      { status: 500 },
    );
  }

  if (existing) {
    const { error } = await supabase
      .from("site_images")
      .update({
        label: slot.label,
        path: slot.path,
        alt_text: parsed.data.alt_text,
        updated_at: now,
      })
      .eq("key", slot.key);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }
  } else {
    const { error } = await supabase
      .from("site_images")
      .insert({
        key: slot.key,
        label: slot.label,
        path: slot.path,
        alt_text: parsed.data.alt_text,
        updated_at: now,
      });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    updated_at: now,
  });
}

export async function PATCH(request: Request) {
  await requirePermission("images");

  const body = await request.json();

  const parsed = imageDataSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const slot = getSlot(parsed.data.key);

  if (!slot) {
    return NextResponse.json(
      { message: "Emplacement d’image introuvable." },
      { status: 404 },
    );
  }

  const supabase = createAdminClient();

  const { data: existing, error: findError } =
    await supabase
      .from("site_images")
      .select("id")
      .eq("key", slot.key)
      .maybeSingle();

  if (findError) {
    return NextResponse.json(
      { message: findError.message },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { message: "Aucune image à modifier." },
      { status: 404 },
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("site_images")
    .update({
      alt_text: parsed.data.alt_text,
      updated_at: now,
    })
    .eq("key", slot.key);

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    updated_at: now,
  });
}

export async function DELETE(request: Request) {
  await requirePermission("images");

  const body = await request.json();

  const parsed = z
    .object({
      key: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const slot = getSlot(parsed.data.key);

  if (!slot) {
    return NextResponse.json(
      { message: "Emplacement d’image introuvable." },
      { status: 404 },
    );
  }


  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from("site_images")
    .delete()
    .eq("key", slot.key);

  if (deleteError) {
    return NextResponse.json(
      { message: deleteError.message },
      { status: 500 },
    );
  }

  await supabase.storage
    .from(SUPABASE_IMAGE_BUCKET)
    .remove([slot.path]);

  return NextResponse.json({
    ok: true,
  });
}
