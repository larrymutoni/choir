import { NextResponse } from "next/server";

import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";

import {
  deleteResourceFile,
  updateResourceFile,
} from "@/server/resources/repository";

const updateFileSchema = z.object({
  id: z.string().min(1),

  title: z.string().trim().min(1).max(200),

  category: z.string().trim().max(100).nullable().optional(),

  description: z.string().trim().max(5000).nullable().optional(),

  downloadable: z.boolean(),

  published: z.boolean(),

  sortOrder: z.number().int().optional(),
});

const deleteFileSchema = z.object({
  id: z.string().min(1),
});

function canManage(role: string) {
  return role === "admin" || role === "super_admin";
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

  if (!canManage(session.role)) {
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

export async function PATCH(request: Request) {
  const auth = await requireManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = updateFileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Informations de la ressource invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await updateResourceFile(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Resource update:", error);

    return NextResponse.json(
      {
        message: "Impossible de modifier la ressource.",
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

  const parsed = deleteFileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Ressource invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await deleteResourceFile(parsed.data.id);

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Resource delete:", error);

    return NextResponse.json(
      {
        message: "Impossible de supprimer la ressource.",
      },
      {
        status: 500,
      },
    );
  }
}
