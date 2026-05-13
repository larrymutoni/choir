import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizePermissions,
  type AdminPermissionKey,
  type AdminPermissions,
} from "@/lib/permissions";

export type { AdminPermissionKey, AdminPermissions };
export {
  DEFAULT_ADMIN_PERMISSIONS,
  SUPER_ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  normalizePermissions,
} from "@/lib/permissions";

const ADMIN_COOKIE_NAME = "chorale_admin_session";

type AdminSessionPayload = {
  adminId: string;
  email: string;
  role: string;
};

export type CurrentAdmin = {
  id: string;
  email: string;
  role: string;
  permissions: AdminPermissions;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is missing.");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    return {
      adminId: String(payload.adminId),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await getAdminSession();

  if (!session) return null;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, role, permissions")
    .eq("id", session.adminId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    permissions: normalizePermissions(data.permissions),
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

  if (admin.role === "super_admin") {
    return admin;
  }

  if (!admin.permissions[permission]) {
    redirect("/admin");
  }

  return admin;
}

export function canAccess(admin: CurrentAdmin, permission: AdminPermissionKey) {
  if (admin.role === "super_admin") return true;

  return admin.permissions[permission];
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_COOKIE_NAME);
}
