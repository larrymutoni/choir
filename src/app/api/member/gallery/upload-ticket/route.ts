import {
  NextResponse,
} from "next/server";

import {
  hasRolePermission,
} from "@/lib/permissions";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  createGalleryUploadToken,
  getGalleryWorkerUrl,
} from "@/server/gallery/access-token";

export const runtime =
  "nodejs";

export async function POST() {
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
    !hasRolePermission(
      session,
      "gallery",
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

  try {
    const token =
      createGalleryUploadToken(
        session.user_id,
      );

    const workerUrl =
      getGalleryWorkerUrl();

    return NextResponse.json({
      uploadUrl:
        `${workerUrl}/v1/gallery-upload?token=${encodeURIComponent(
          token,
        )}`,
    });
  } catch (error) {
    console.error(
      "Gallery upload ticket:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de préparer l’envoi.",
      },
      {
        status: 500,
      },
    );
  }
}
