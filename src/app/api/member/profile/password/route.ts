import bcrypt from "bcryptjs";

import { NextResponse } from "next/server";

import { z } from "zod";

import { requireUser } from "@/server/auth/guard";

import { findUserByEmail } from "@/server/auth/repository";

import { updateOwnPasswordRecord } from "@/server/auth/account";

const schema = z.object({
  currentPassword: z.string().min(1),

  newPassword: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.")
    .max(128),
});

export async function POST(request: Request) {
  const session = await requireUser();

  const body = await request.json().catch(() => null);

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Données invalides.",
      },
      {
        status: 400,
      },
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json(
      {
        message: "Le nouveau mot de passe doit être différent de l’ancien.",
      },
      {
        status: 400,
      },
    );
  }

  const user = await findUserByEmail(session.email);

  if (!user) {
    return NextResponse.json(
      {
        message: "Compte introuvable.",
      },
      {
        status: 404,
      },
    );
  }

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!valid) {
    return NextResponse.json(
      {
        message: "Le mot de passe actuel est incorrect.",
      },
      {
        status: 400,
      },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await updateOwnPasswordRecord({
    userId: session.user_id,

    passwordHash,

    currentSessionId: session.session_id,
  });

  return NextResponse.json({
    ok: true,

    message: "Mot de passe modifié.",
  });
}
