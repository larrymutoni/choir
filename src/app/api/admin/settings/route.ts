import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSettingsSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  google_form_url: z.string().url(),
});

export async function PUT(request: Request) {
  await requireAdmin();

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid settings data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("contact_settings")
    .select("id")
    .limit(1)
    .single();

  if (existingError || !existing) {
    const { error: insertError } = await supabase
      .from("contact_settings")
      .insert({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Settings created successfully.",
    });
  }

  const { error } = await supabase
    .from("contact_settings")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Settings updated successfully.",
  });
}
