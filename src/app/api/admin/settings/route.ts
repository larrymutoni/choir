import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const settingsSchema = z.object({
  email: z.string().email().or(z.literal("")),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  google_form_url: z.string().optional().default(""),
  admin_address: z.string().optional().default(""),
  rehearsal_address: z.string().optional().default(""),
  accessibility_note: z.string().optional().default(""),
  monique_phone: z.string().optional().default(""),
  francois_phone: z.string().optional().default(""),
  show_map: z.boolean().default(true),
  map_query: z.string().optional().default(""),
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

  const { data: existing } = await supabase
    .from("contact_settings")
    .select("id")
    .limit(1)
    .single();

  if (existing?.id) {
    const { error } = await supabase
      .from("contact_settings")
      .update(parsed.data)
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("contact_settings")
      .insert(parsed.data);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Paramètres enregistrés.",
  });
}
