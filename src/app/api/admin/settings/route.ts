import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const contactPersonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim(),
  role_label: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  is_visible: z.boolean().default(true),
});

const settingsSchema = z.object({
  email: z.string().email().or(z.literal("")),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  google_form_url: z.string().optional().default(""),
  admin_address: z.string().optional().default(""),
  rehearsal_address: z.string().optional().default(""),
  accessibility_note: z.string().optional().default(""),
  show_map: z.boolean().default(true),
  map_query: z.string().optional().default(""),
  contact_people: z.array(contactPersonSchema).default([]),
});

export async function PUT(request: Request) {
  await requirePermission("settings");

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { contact_people, ...settingsData } = parsed.data;

  const { data: existingSettings } = await supabase
    .from("contact_settings")
    .select("id")
    .limit(1)
    .single();

  if (existingSettings?.id) {
    const { error } = await supabase
      .from("contact_settings")
      .update(settingsData)
      .eq("id", existingSettings.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("contact_settings")
      .insert(settingsData);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  const cleanedPeople = contact_people
    .filter((person) => person.name.trim().length > 0)
    .map((person, index) => ({
      name: person.name.trim(),
      role_label: person.role_label?.trim() || null,
      phone: person.phone?.trim() || null,
      position: index + 1,
      is_visible: person.is_visible,
      updated_at: new Date().toISOString(),
    }));

  const { error: deleteError } = await supabase
    .from("contact_people")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 });
  }

  if (cleanedPeople.length > 0) {
    const { error: insertError } = await supabase
      .from("contact_people")
      .insert(cleanedPeople);

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Paramètres enregistrés.",
  });
}
