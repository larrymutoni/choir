import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  setupSecret: z.string().min(10),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid setup data." },
      { status: 400 }
    );
  }

  const { email, password, setupSecret } = parsed.data;

  if (setupSecret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json(
      { message: "Invalid setup secret." },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json(
      { message: countError.message },
      { status: 500 }
    );
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { message: "Admin already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("admin_users").insert({
    email: email.toLowerCase(),
    password_hash: passwordHash,
    role: "admin",
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Admin created successfully.",
  });
}