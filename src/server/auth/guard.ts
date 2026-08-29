import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import type { UserRole } from "@/server/auth/repository";

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/connexion");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireUser();

  if (!allowedRoles.includes(session.role)) {
    redirect("/membre");
  }

  return session;
}
