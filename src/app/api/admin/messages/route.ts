import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  id: z.string().uuid(),
  is_read: z.boolean(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function PATCH(request: Request) {
  await requirePermission("messages");

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: parsed.data.is_read })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Message mis à jour.",
  });
}

export async function DELETE(request: Request) {
  await requirePermission("messages");

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Message supprimé.",
  });
}
