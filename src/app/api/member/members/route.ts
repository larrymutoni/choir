import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";

import {
  approveMemberUser,
  createMember,
  deleteMember,
  listMemberEntries,
  rejectMemberUser,
  updateMember,
  updateMemberAccountRole,
} from "@/server/members/repository";

const memberSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(1)
    .max(80),

  lastname: z
    .string()
    .trim()
    .min(1)
    .max(80),

  email: z
    .string()
    .trim()
    .email()
    .max(254),

  phone: z
    .string()
    .trim()
    .max(30)
    .nullable()
    .optional(),
});

const approveSchema = z.object({
  action: z.literal("approve"),
  userId: z.string().min(1),
});

const rejectSchema = z.object({
  action: z.literal("reject"),
  userId: z.string().min(1),
});

const roleSchema = z.object({
  action: z.literal("change_role"),
  userId: z.string().min(1),
  role: z.enum([
    "member",
    "admin",
    "super_admin",
  ]),
});

function canManage(
  role: string,
) {
  return (
    role === "admin" ||
    role === "super_admin"
  );
}

function errorResponse(
  error: unknown,
) {
  return NextResponse.json(
    {
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
    },
    {
      status: 400,
    },
  );
}

export async function GET() {
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
    !canManage(
      session.role,
    )
  ) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const entries =
      await listMemberEntries();

    return NextResponse.json({
      members: entries,

      canManage: true,

      canManageRoles:
        session.role ===
        "super_admin",

      currentUserId:
        session.user_id,
    });
  } catch (error) {
    console.error(
      "Members GET:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de charger les membres.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
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
    !canManage(
      session.role,
    )
  ) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  try {
    const roleParsed =
      roleSchema.safeParse(
        body,
      );

    if (roleParsed.success) {
      if (
        session.role !==
        "super_admin"
      ) {
        return NextResponse.json(
          {
            message:
              "Seul un super administrateur peut modifier les rôles.",
          },
          {
            status: 403,
          },
        );
      }

      if (
        roleParsed.data.userId ===
        session.user_id
      ) {
        return NextResponse.json(
          {
            message:
              "Vous ne pouvez pas modifier votre propre rôle ici.",
          },
          {
            status: 400,
          },
        );
      }

      await updateMemberAccountRole(
        roleParsed.data.userId,
        roleParsed.data.role,
      );

      return NextResponse.json({
        ok: true,
      });
    }

    const approveParsed =
      approveSchema.safeParse(
        body,
      );

    if (
      approveParsed.success
    ) {
      await approveMemberUser(
        approveParsed.data.userId,
      );

      return NextResponse.json({
        ok: true,
      });
    }

    const rejectParsed =
      rejectSchema.safeParse(
        body,
      );

    if (
      rejectParsed.success
    ) {
      await rejectMemberUser(
        rejectParsed.data.userId,
      );

      return NextResponse.json({
        ok: true,
      });
    }

    const memberParsed =
      memberSchema.safeParse(
        body,
      );

    if (
      !memberParsed.success
    ) {
      return NextResponse.json(
        {
          message:
            "Informations du membre invalides.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await createMember(
        memberParsed.data,
      );

    return NextResponse.json(
      result,
      {
        status: 201,
      },
    );
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

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
    !canManage(
      session.role,
    )
  ) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  const parsed =
    memberSchema
      .extend({
        id: z
          .string()
          .min(1),
      })
      .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Informations du membre invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const entries =
      await listMemberEntries();

    const target =
      entries.find(
        (entry) =>
          entry.membershipId ===
          parsed.data.id,
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

    if (
      session.role === "admin" &&
      target.role !== "member"
    ) {
      return NextResponse.json(
        {
          message:
            "Vous ne pouvez pas modifier cet administrateur.",
        },
        {
          status: 403,
        },
      );
    }

    const {
      id,
      ...input
    } = parsed.data;

    await updateMember(
      id,
      input,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

export async function DELETE(
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
    !canManage(
      session.role,
    )
  ) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  const parsed = z
    .object({
      id: z
        .string()
        .min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Membre invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const entries =
      await listMemberEntries();

    const target =
      entries.find(
        (entry) =>
          entry.membershipId ===
          parsed.data.id,
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

    if (
      target.userId ===
      session.user_id
    ) {
      return NextResponse.json(
        {
          message:
            "Vous ne pouvez pas retirer votre propre compte.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      session.role === "admin" &&
      target.role !== "member"
    ) {
      return NextResponse.json(
        {
          message:
            "Vous ne pouvez pas retirer un administrateur.",
        },
        {
          status: 403,
        },
      );
    }

    await deleteMember(
      parsed.data.id,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}