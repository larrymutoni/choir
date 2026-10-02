import { NextResponse } from "next/server";
import { z } from "zod";

import {
  resendTwoFactorChallenge,
} from "@/server/auth/two-factor";

const schema = z.object({
  challengeId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Demande invalide.",
      },
      { status: 400 },
    );
  }

  try {
    const challenge =
      await resendTwoFactorChallenge(
        parsed.data.challengeId,
      );

    if (!challenge) {
      return NextResponse.json(
        {
          message:
            "Impossible de renvoyer le code.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      challengeId:
        challenge.id,
      expiresInMinutes:
        challenge.expiresInMinutes,
    });
  } catch (error) {
    console.error(
      "2FA resend failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de renvoyer le code.",
      },
      { status: 500 },
    );
  }
}
