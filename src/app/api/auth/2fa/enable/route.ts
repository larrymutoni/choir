import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  getSecurityState,
  updateTwoFactorStateRecord,
} from "@/server/auth/security-repository";

import {
  issueTwoFactorChallenge,
  verifyTwoFactorChallenge,
} from "@/server/auth/two-factor";

import {
  sendTwoFactorStatusEmail,
} from "@/server/email/auth";

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST() {
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
      security.twoFactorEnabled
    ) {
      return NextResponse.json(
        {
          message:
            "La double authentification est déjà activée.",
        },
        { status: 409 },
      );
    }

    const challenge =
      await issueTwoFactorChallenge({
        userId:
          session.user_id,
        email:
          session.email,
        purpose:
          "enable",
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
      "2FA enable request failed:",
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
          "enable",
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
      true,
    );

    try {
      await sendTwoFactorStatusEmail(
        session.email,
        true,
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
      "2FA enable confirmation failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible d'activer la double authentification.",
      },
      { status: 500 },
    );
  }
}
