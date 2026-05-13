import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  event_date: z.string().min(1),
  location: z.string().optional().default(""),
  is_visible: z.boolean().optional().default(true),
});

const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  event_date: z.string().min(1).optional(),
  location: z.string().optional(),
  is_visible: z.boolean().optional(),
});

const deleteEventSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  await requirePermission("events");

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid event data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("events").insert(parsed.data);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Event created successfully.",
  });
}

export async function PUT(request: Request) {
  await requirePermission("events");

  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid event update data." },
      { status: 400 },
    );
  }

  const { id, ...values } = parsed.data;

  const supabase = createAdminClient();

  const { error } = await supabase.from("events").update(values).eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Event updated successfully.",
  });
}

export async function DELETE(request: Request) {
  await requirePermission("events");

  const body = await request.json();
  const parsed = deleteEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid event delete data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Event deleted successfully.",
  });
}
