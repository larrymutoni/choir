import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createUserSession,
} from "@/server/auth/session";

import {
  trustCurrentDevice,
  verifyTwoFactorChallenge,
} from "@/server/auth/two-factor";

const schema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
  rememberDevice: z.boolean().default(true),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Code invalide." },
      { status: 400 },
    );
  }

  try {
    const verified =
      await verifyTwoFactorChallenge({
        challengeId:
          parsed.data.challengeId,
        code:
          parsed.data.code,
        expectedPurpose:
          "login",
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

    await createUserSession(
      verified.userId,
    );

    if (
      parsed.data.rememberDevice
    ) {
      await trustCurrentDevice({
        userId:
          verified.userId,
        userAgent:
          request.headers.get(
            "user-agent",
          ),
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "2FA login verification failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de vérifier le code.",
      },
      { status: 500 },
    );
  }
}
