import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  findUserByEmail,
} from "@/server/auth/repository";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  getSecurityState,
  updateTwoFactorStateRecord,
} from "@/server/auth/security-repository";

import {
  clearTrustedDeviceCookie,
  issueTwoFactorChallenge,
  verifyTwoFactorChallenge,
} from "@/server/auth/two-factor";

import {
  sendTwoFactorStatusEmail,
} from "@/server/email/auth";

const requestSchema = z.object({
  password: z.string().min(1).max(128),
});

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Mot de passe requis.",
      },
      { status: 400 },
    );
  }

  try {
    const session =
      await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          message:
            "Authentication required.",
        },
        { status: 401 },
      );
    }

    const security =
      await getSecurityState(
        session.user_id,
      );

    if (
      !security.twoFactorEnabled
    ) {
      return NextResponse.json(
        {
          message:
            "La double authentification est déjà désactivée.",
        },
        { status: 409 },
      );
    }

    const user =
      await findUserByEmail(
        session.email,
      );

    if (
      !user ||
      !(
        await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        )
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Mot de passe incorrect.",
        },
        { status: 401 },
      );
    }

    const challenge =
      await issueTwoFactorChallenge({
        userId:
          session.user_id,
        email:
          session.email,
        purpose:
          "disable",
      });

    return NextResponse.json({
      ok: true,
      challengeId:
        challenge.id,
      expiresInMinutes:
        challenge.expiresInMinutes,
    });
  } catch (error) {
    console.error(
      "2FA disable request failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible d'envoyer le code.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Code invalide." },
      { status: 400 },
    );
  }

  try {
    const session =
      await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          message:
            "Authentication required.",
        },
        { status: 401 },
      );
    }

    const verified =
      await verifyTwoFactorChallenge({
        challengeId:
          parsed.data.challengeId,
        code:
          parsed.data.code,
        expectedPurpose:
          "disable",
        expectedUserId:
          session.user_id,
      });

    if (!verified.ok) {
      return NextResponse.json(
        {
          message:
            verified.reason === "invalid_code"
              ? "Code incorrect."
              : "Ce code est expiré ou a déjà été utilisé.",
        },
        { status: 400 },
      );
    }

    await updateTwoFactorStateRecord(
      session.user_id,
      false,
    );

    await clearTrustedDeviceCookie();

    try {
      await sendTwoFactorStatusEmail(
        session.email,
        false,
      );
    } catch (emailError) {
      console.error(
        "2FA status email failed:",
        emailError,
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "2FA disable confirmation failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de désactiver la double authentification.",
      },
      { status: 500 },
    );
  }
}
