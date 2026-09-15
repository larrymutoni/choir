import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";

import {
  createSong,
  deleteSong,
  updateSong,
} from "@/server/resources/repository";

const songSchema = z.object({
  title: z.string().trim().min(1).max(150),

  composer: z.string().trim().max(150).nullable().optional(),

  program: z.string().trim().max(150).nullable().optional(),

  lyrics: z.string().trim().max(50000).nullable().optional(),

  notes: z.string().trim().max(10000).nullable().optional(),

  status: z.enum(["draft", "published"]),
});

function canManage(
  session: Parameters<
    typeof hasRolePermission
  >[0],
) {
  return hasRolePermission(
    session,
    "resources",
  );
}

async function requireManager() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      response: NextResponse.json(
        {
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (!canManage(session)) {
    return {
      response: NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    session,
  };
}

export async function POST(request: Request) {
  const auth = await requireManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = songSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Informations du morceau invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await createSong({
      ...parsed.data,

      createdByUserId: auth.session.user_id,
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Impossible d'ajouter le morceau.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = songSchema
    .extend({
      id: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Informations du morceau invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await updateSong(parsed.data);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Impossible de modifier le morceau.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = z
    .object({
      id: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Morceau invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await deleteSong(parsed.data.id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Impossible de supprimer le morceau.",
      },
      {
        status: 500,
      },
    );
  }
}
