import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";

import {
  createResourceUploadToken,
  getResourceWorkerUrl,
} from "@/server/resources/access-token";

export const runtime = "nodejs";

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

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  if (!canManage(session)) {
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
    const token = createResourceUploadToken(session.user_id);

    const workerUrl = getResourceWorkerUrl();

    return NextResponse.json({
      uploadUrl: `${workerUrl}/v1/resource-upload?token=${encodeURIComponent(
        token,
      )}`,
    });
  } catch (error) {
    console.error("Resource upload ticket:", error);

    return NextResponse.json(
      {
        message: "Impossible de préparer l'envoi du fichier.",
      },
      {
        status: 500,
      },
    );
  }
}
