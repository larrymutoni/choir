import { redirect } from "next/navigation";

import {
  deleteCurrentSession,
  getCurrentSession,
} from "@/server/auth/session";

import type {
  UserRole,
} from "@/server/auth/repository";

import type {
  AdminPermissionKey,
  RolePermissions,
} from "@/lib/permissions";

import {
  hasAdminPermission,
  hasAnyManagementPermission,
} from "@/lib/permissions";

export type CurrentAdmin = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  customRoleName: string | null;
  permissions: RolePermissions;
};

function toCurrentAdmin(
  session: NonNullable<
    Awaited<
      ReturnType<typeof getCurrentSession>
    >
  >,
): CurrentAdmin {
  return {
    id: session.user_id,
    email: session.email,
    firstname: session.firstname,
    lastname: session.lastname,
    role: session.role,
    customRoleName:
      session.custom_role_name ?? null,
    permissions: session.permissions,
  };
}

export async function getCurrentAdmin():
  Promise<CurrentAdmin | null> {
  const session =
    await getCurrentSession();

  if (!session) {
    return null;
  }

  if (
    !hasAnyManagementPermission(
      session,
    )
  ) {
    return null;
  }

  return toCurrentAdmin(session);
}

export async function requireAdmin() {
  const session =
    await getCurrentSession();

  if (!session) {
    redirect("/connexion");
  }

  if (
    !hasAnyManagementPermission(
      session,
    )
  ) {
    redirect("/membre");
  }

  return toCurrentAdmin(session);
}

export async function requireSuperAdmin() {
  const session =
    await getCurrentSession();

  if (!session) {
    redirect("/connexion");
  }

  if (
    session.role !==
    "super_admin"
  ) {
    redirect("/membre");
  }

  return toCurrentAdmin(session);
}

export async function requirePermission(
  permission: AdminPermissionKey,
) {
  const session =
    await getCurrentSession();

  if (!session) {
    redirect("/connexion");
  }

  if (
    !hasAdminPermission(
      session,
      permission,
    )
  ) {
    redirect("/membre");
  }

  return toCurrentAdmin(session);
}

export function canAccess(
  admin: CurrentAdmin,
  permission: AdminPermissionKey,
) {
  return hasAdminPermission(
    admin,
    permission,
  );
}

export async function clearAdminSession() {
  await deleteCurrentSession();
}
