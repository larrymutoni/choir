import {
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  createGalleryAlbum,
  deleteGalleryAlbum,
  updateGalleryAlbum,
} from "@/server/gallery/repository";

const createSchema =
  z.object({
    title:
      z.string().trim().min(1),

    description:
      z.string().trim().optional(),

    activity:
      z.string().trim().optional(),

    albumDate:
      z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
      ),
  });

const updateSchema =
  createSchema.extend({
    id:
      z.string().uuid(),

    coverMediaId:
      z.string().uuid().nullable().optional(),
  });

const deleteSchema =
  z.object({
    id:
      z.string().uuid(),
  });

async function requireGalleryManager() {
  const session =
    await getCurrentSession();

  if (!session) {
    return {
      response:
        NextResponse.json(
          {
            message:
              "Authentication required.",
          },
          {
            status: 401,
          },
        ),
    };
  }

  if (
    !hasRolePermission(
      session,
      "gallery",
    )
  ) {
    return {
      response:
        NextResponse.json(
          {
            message:
              "Forbidden.",
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

export async function POST(
  request: Request,
) {
  const auth =
    await requireGalleryManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  const parsed =
    createSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Données de l’album invalides.",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await createGalleryAlbum({
      ...parsed.data,

      createdByUserId:
        auth.session.user_id,
    });

  return NextResponse.json(
    result,
    {
      status: 201,
    },
  );
}

export async function PATCH(
  request: Request,
) {
  const auth =
    await requireGalleryManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  const parsed =
    updateSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Données de l’album invalides.",
      },
      {
        status: 400,
      },
    );
  }

  await updateGalleryAlbum(
    parsed.data,
  );

  return NextResponse.json({
    ok: true,
  });
}

export async function DELETE(
  request: Request,
) {
  const auth =
    await requireGalleryManager();

  if ("response" in auth) {
    return auth.response;
  }

  const body: unknown =
    await request
      .json()
      .catch(() => null);

  const parsed =
    deleteSchema.safeParse(
      body,
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          "Album invalide.",
      },
      {
        status: 400,
      },
    );
  }

  await deleteGalleryAlbum(
    parsed.data.id,
  );

  return NextResponse.json({
    ok: true,
  });
}
