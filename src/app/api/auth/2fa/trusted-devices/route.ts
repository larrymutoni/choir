import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  revokeAllTrustedDevices,
  revokeTrustedDevice,
} from "@/server/auth/two-factor";

const schema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
}).refine(
  (value) =>
    Boolean(value.id) ||
    value.all === true,
  {
    message:
      "Trusted device ID is required.",
  },
);

export async function DELETE(request: Request) {
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

    if (parsed.data.all) {
      await revokeAllTrustedDevices(
        session.user_id,
      );
    } else if (parsed.data.id) {
      await revokeTrustedDevice({
        userId:
          session.user_id,
        deviceId:
          parsed.data.id,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Trusted device revocation failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de révoquer l'appareil.",
      },
      { status: 500 },
    );
  }
}
