import { hasRolePermission } from "@/lib/permissions";
import {
  NextResponse,
} from "next/server";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  listResources,
} from "@/server/resources/repository";

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

  try {
    const management =
      canManage(session);

    const resources =
      await listResources(
        management,
      );

    return NextResponse.json({
      ...resources,
      canManage:
        management,
    });
  } catch (error) {
    console.error(
      "Resources:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de charger les ressources.",
      },
      {
        status: 500,
      },
    );
  }
}