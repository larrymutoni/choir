import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSiteContent } from "@/server/content/repository";

const personSchema = z.object({
  name: z.string().trim(),
  role_label: z.string().trim(),
  phone: z.string().trim(),
  is_visible: z.boolean(),
});

const contentItemSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const schema = z.object({
  content_items: z.array(contentItemSchema).default([]),

  email: z.string().email().or(z.literal("")),
  admin_address: z.string(),
  rehearsal_address: z.string(),
  accessibility_note: z.string(),
  show_map: z.boolean(),
  map_query: z.string(),

  contact_people: z.array(personSchema),
});

export async function PUT(
  request: Request,
) {
  await requirePermission("content");

  const parsed = schema.safeParse(
    await request.json(),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const {
    content_items,
    contact_people,
    ...settings
  } = parsed.data;

  const supabase =
    createAdminClient();

  const {
    data: existing,
    error: findError,
  } = await supabase
    .from("contact_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json(
      { message: findError.message },
      { status: 500 },
    );
  }

  if (existing?.id) {
    const { error } =
      await supabase
        .from("contact_settings")
        .update(settings)
        .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }
  } else {
    const { error } =
      await supabase
        .from("contact_settings")
        .insert(settings);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }
  }

  const { error: deleteError } =
    await supabase
      .from("contact_people")
      .delete()
      .not("id", "is", null);

  if (deleteError) {
    return NextResponse.json(
      { message: deleteError.message },
      { status: 500 },
    );
  }

  const people =
    contact_people
      .filter(
        (person) =>
          person.name.length > 0,
      )
      .map(
        (person, index) => ({
          name: person.name,
          role_label:
            person.role_label ||
            null,
          phone:
            person.phone ||
            null,
          position:
            index + 1,
          is_visible:
            person.is_visible,
          updated_at:
            new Date().toISOString(),
        }),
      );

  if (people.length > 0) {
    const { error } =
      await supabase
        .from("contact_people")
        .insert(people);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }
  }

  if (content_items.length > 0) {
    await updateSiteContent(
      content_items,
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
