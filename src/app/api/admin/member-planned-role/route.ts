import {
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  listMemberEntries,
  updateMemberPlannedRole,
} from "@/server/members/repository";

const schema =
  z.discriminatedUnion(
    "kind",
    [
      z.object({
        memberId:
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
        memberId:
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
    ![
      "admin",
      "super_admin",
    ].includes(session.role) ||
    !hasRolePermission(
      session,
      "members",
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Forbidden.",
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

  try {
    const members =
      await listMemberEntries();

    const target =
      members.find(
        (member) =>
          member.membershipId ===
          parsed.data.memberId,
      );

    if (!target) {
      return NextResponse.json(
        {
          message:
            "Membre introuvable.",
        },
        {
          status: 404,
        },
      );
    }

    if (target.userId) {
      return NextResponse.json(
        {
          message:
            "Ce membre possède déjà un compte.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      session.role ===
      "admin"
    ) {
      if (
        target.role ===
        "super_admin"
      ) {
        return NextResponse.json(
          {
            message:
              "Seul un super administrateur peut modifier ce rôle.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        parsed.data.kind ===
          "system" &&
        parsed.data.role ===
          "super_admin"
      ) {
        return NextResponse.json(
          {
            message:
              "Seul un super administrateur peut attribuer ce rôle.",
          },
          {
            status: 403,
          },
        );
      }
    }

    if (
      parsed.data.kind ===
      "system"
    ) {
      await updateMemberPlannedRole(
        parsed.data.memberId,
        {
          kind: "system",
          role:
            parsed.data.role,
        },
      );
    } else {
      await updateMemberPlannedRole(
        parsed.data.memberId,
        {
          kind: "custom",
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
      "Planned member role PATCH:",
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
