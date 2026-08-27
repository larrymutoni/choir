import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/server/auth/password-reset";

const schema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Adresse email invalide." },
      { status: 400 },
    );
  }

  try {
    const appUrl = new URL(request.url).origin;

    await requestPasswordReset(parsed.data.email, appUrl);

    return NextResponse.json({
      ok: true,
      message:
        "Si un compte actif existe avec cette adresse, un email a été envoyé.",
    });
  } catch (error) {
    console.error("Password reset request failed:", error);

    return NextResponse.json(
      { message: "Impossible de traiter la demande." },
      { status: 500 },
    );
  }
}
