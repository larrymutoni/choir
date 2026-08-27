import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/server/auth/repository";
import { createUserSession } from "@/server/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données de connexion invalides." },
      { status: 400 },
    );
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const passwordValid = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    if (
      user.status !== "active" ||
      (user.role !== "admin" && user.role !== "super_admin")
    ) {
      return NextResponse.json(
        { message: "Accès administrateur non autorisé." },
        { status: 403 },
      );
    }

    await createUserSession(user.id);

    return NextResponse.json({
      ok: true,
      message: "Connexion réussie.",
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { message: "Connexion impossible." },
      { status: 500 },
    );
  }
}
