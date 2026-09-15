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
  listRoles,
} from "@/server/roles/repository";

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
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const data =
      await listRoles();

    return NextResponse.json({
      systemRoles:
        session.role ===
        "super_admin"
          ? data.systemRoles
          : data.systemRoles.filter(
              (role) =>
                role.id !==
                "super_admin",
            ),

      roles: data.roles,
    });
  } catch (error) {
    console.error(
      "Role options GET:",
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
