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
  role: string,
) {
  return (
    role === "admin" ||
    role === "super_admin"
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
      canManage(
        session.role,
      );

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