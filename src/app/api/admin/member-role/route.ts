import {
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  updateMemberAccountRole,
} from "@/server/members/repository";

const schema =
  z.discriminatedUnion(
    "kind",
    [
      z.object({
        userId:
          z.string().min(1),

        kind:
          z.literal(
            "system",
          ),

        role:
          z.enum([
            "member",
            "admin",
            "super_admin",
          ]),
      }),

      z.object({
        userId:
          z.string().min(1),

        kind:
          z.literal(
            "custom",
          ),

        customRoleId:
          z.string().min(1),
      }),
    ],
  );

export async function PATCH(
  request: Request,
) {
  const session =
    await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    session.role !==
    "super_admin"
  ) {
    return NextResponse.json(
      {
        message:
          "Accès réservé au super administrateur.",
      },
      {
        status: 403,
      },
    );
  }

  const parsed =
    schema.safeParse(
      await request
        .json()
        .catch(() => null),
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Rôle invalide.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    parsed.data.userId ===
    session.user_id
  ) {
    return NextResponse.json(
      {
        message:
          "Vous ne pouvez pas modifier votre propre rôle.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    if (
      parsed.data.kind ===
      "system"
    ) {
      await updateMemberAccountRole(
        parsed.data.userId,
        {
          kind:
            "system",

          role:
            parsed.data.role,
        },
      );
    } else {
      await updateMemberAccountRole(
        parsed.data.userId,
        {
          kind:
            "custom",

          customRoleId:
            parsed.data
              .customRoleId,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Member role PATCH:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de modifier le rôle.",
      },
      {
        status: 400,
      },
    );
  }
}
