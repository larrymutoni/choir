import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/server/auth/password-reset";

const schema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides." },
      { status: 400 },
    );
  }

  try {
    const success = await resetPassword(
      parsed.data.token,
      parsed.data.password,
    );

    if (!success) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Password reset failed:", error);

    return NextResponse.json(
      { message: "Impossible de modifier le mot de passe." },
      { status: 500 },
    );
  }
}
