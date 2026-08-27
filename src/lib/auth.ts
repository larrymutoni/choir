import { redirect } from "next/navigation";
import { deleteCurrentSession, getCurrentSession } from "@/server/auth/session";
import type { AdminPermissionKey, AdminPermissions } from "@/lib/permissions";
import { SUPER_ADMIN_PERMISSIONS } from "@/lib/permissions";

const ADMIN_PERMISSIONS: AdminPermissions = {
  content: true,
  images: true,
  gallery: true,
  events: true,
  settings: true,
  admins: false,
  messages: true,
};

export type CurrentAdmin = {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  permissions: AdminPermissions;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  if (session.role !== "admin" && session.role !== "super_admin") {
    return null;
  }

  return {
    id: session.user_id,
    email: session.email,
    role: session.role,
    permissions:
      session.role === "super_admin"
        ? SUPER_ADMIN_PERMISSIONS
        : ADMIN_PERMISSIONS,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();

  if (admin.role !== "super_admin") {
    redirect("/admin");
  }

  return admin;
}

export async function requirePermission(permission: AdminPermissionKey) {
  const admin = await requireAdmin();

  if (!admin.permissions[permission]) {
    redirect("/admin");
  }

  return admin;
}

export function canAccess(admin: CurrentAdmin, permission: AdminPermissionKey) {
  return admin.permissions[permission];
}

export async function clearAdminSession() {
  await deleteCurrentSession();
}
