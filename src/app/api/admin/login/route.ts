import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAdminSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid login data." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  const supabase = createAdminClient();

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, email, password_hash, role")
    .eq("email", email.toLowerCase())
    .single();

  // Always run bcrypt to prevent timing-based email enumeration.
  const DUMMY_HASH =
    "$2b$12$invalidhashfortimingattackXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  const passwordMatches = await bcrypt.compare(
    password,
    admin?.password_hash ?? DUMMY_HASH,
  );

  if (error || !admin || !passwordMatches) {
    return NextResponse.json(
      { message: "Email ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  await createAdminSession({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return NextResponse.json({
    ok: true,
    message: "Logged in successfully.",
  });
}
