import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const updateContentSchema = z.object({
  items: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    }),
  ),
});

export async function PUT(request: Request) {
  await requirePermission("content");

  const body = await request.json();
  const parsed = updateContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid content data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const updates = parsed.data.items.map((item) =>
    supabase
      .from("site_content")
      .update({ value: item.value })
      .eq("key", item.key),
  );

  const results = await Promise.all(updates);

  const error = results.find((result) => result.error)?.error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Content updated successfully.",
  });
}
