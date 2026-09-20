import {
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  createCustomRole,
  deleteCustomRole,
  listRoles,
  updateCustomRole,
  updateSystemRole,
} from "@/server/roles/repository";

const permissions =
  z.object({
    members: z.boolean(),
    calendar: z.boolean(),
    resources: z.boolean(),
    content: z.boolean(),
    images: z.boolean(),
    gallery: z.boolean(),
    settings: z.boolean(),
  });

const createSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(60),

    permissions,
  });

const updateSchema =
  z.discriminatedUnion(
    "kind",
    [
      z.object({
        kind:
          z.literal(
            "system",
          ),

        id: z.enum([
          "member",
          "admin",
          "super_admin",
        ]),

        permissions,
      }),

      z.object({
        kind:
          z.literal(
            "custom",
          ),

        id:
          z.string().min(1),

        name: z
          .string()
          .trim()
          .min(2)
          .max(60),

        permissions,
      }),
    ],
  );

async function guard() {
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

  return null;
}

export async function GET() {
  const denied =
    await guard();

  if (denied) {
    return denied;
  }

  try {
    return NextResponse.json(
      await listRoles(),
    );
  } catch (error) {
    console.error(
      "Roles GET:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de charger les rôles.",
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
  const denied =
    await guard();

  if (denied) {
    return denied;
  }

  const parsed =
    createSchema.safeParse(
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
    return NextResponse.json(
      await createCustomRole(
        parsed.data,
      ),
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Roles POST:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de créer ce rôle.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  const denied =
    await guard();

  if (denied) {
    return denied;
  }

  const parsed =
    updateSchema.safeParse(
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
    if (
      parsed.data.kind ===
      "system"
    ) {
      await updateSystemRole({
        id: parsed.data.id,
        permissions:
          parsed.data
            .permissions,
      });
    } else {
      await updateCustomRole({
        id: parsed.data.id,
        name:
          parsed.data.name,
        permissions:
          parsed.data
            .permissions,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Roles PATCH:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible d'enregistrer le rôle.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  const denied =
    await guard();

  if (denied) {
    return denied;
  }

  const body =
    await request
      .json()
      .catch(() => null) as {
        id?: string;
      } | null;

  if (!body?.id) {
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
    await deleteCustomRole(
      body.id,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Roles DELETE:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de supprimer ce rôle.",
      },
      {
        status: 500,
      },
    );
  }
}
