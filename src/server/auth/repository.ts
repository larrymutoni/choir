import { dbRequest } from "@/server/db/client";

export type UserStatus = "pending" | "active" | "rejected";
export type UserRole = "member" | "admin" | "super_admin";

export type AuthUser = {
  id: string;
  roleId: number;
  role: UserRole;
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarKey: string | null;
  status: UserStatus;
};

type UserResponse = {
  user: {
    id: string;
    role_id: number;
    role_name: UserRole;
    firstname: string;
    lastname: string;
    email: string;
    password_hash: string;
    phone: string | null;
    avatar_key: string | null;
    status: UserStatus;
  } | null;
};

export async function isEmailAuthorized(email: string) {
  const result = await dbRequest<{ authorized: boolean }>(
    "/v1/emails/authorized",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );

  return result.authorized;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await dbRequest<UserResponse>("/v1/users/by-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!result.user) return null;

  return {
    id: result.user.id,
    roleId: result.user.role_id,
    role: result.user.role_name,
    firstname: result.user.firstname,
    lastname: result.user.lastname,
    email: result.user.email,
    passwordHash: result.user.password_hash,
    phone: result.user.phone,
    avatarKey: result.user.avatar_key,
    status: result.user.status,
  };
}

export async function createUser(input: {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
}) {
  return dbRequest<{ ok: true }>("/v1/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type SessionUser = {
  session_id: string;
  expires_at: string;
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  status: UserStatus;
  role: UserRole;
};

export async function createSessionRecord(input: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  return dbRequest<{ ok: true }>("/v1/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function findSessionByTokenHash(
  tokenHash: string,
): Promise<SessionUser | null> {
  const result = await dbRequest<{ session: SessionUser | null }>(
    "/v1/sessions/by-token",
    {
      method: "POST",
      body: JSON.stringify({ tokenHash }),
    },
  );

  return result.session;
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  return dbRequest<{ ok: true }>("/v1/sessions", {
    method: "DELETE",
    body: JSON.stringify({ tokenHash }),
  });
}
export type AdminUser = {
  id: string;
  role: UserRole;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

export async function listUsers(): Promise<AdminUser[]> {
  const result = await dbRequest<{ users: AdminUser[] }>("/v1/users", {
    method: "GET",
  });

  return result.users;
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  return dbRequest<{ ok: true }>("/v1/users/status", {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      status,
    }),
  });
}
export async function updateUserRole(userId: string, role: UserRole) {
  return dbRequest<{ ok: true }>("/v1/users/role", {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      role,
    }),
  });
}
export type AuthorizedEmail = {
  id: string;
  email: string;
  created_at: string;
};

export async function listAuthorizedEmails(): Promise<AuthorizedEmail[]> {
  const result = await dbRequest<{
    emails: AuthorizedEmail[];
  }>("/v1/emails", {
    method: "GET",
  });

  return result.emails;
}

export async function addAuthorizedEmail(email: string) {
  return dbRequest<{ ok: true }>("/v1/emails", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function deleteAuthorizedEmail(id: string) {
  return dbRequest<{ ok: true }>("/v1/emails", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function updateUserProfile(
  userId: string,
  input: {
    firstname: string;
    lastname: string;
    phone?: string | null;
  },
) {
  return dbRequest<{ ok: true }>("/v1/users/profile", {
    method: "PATCH",
    body: JSON.stringify({
      userId,
      ...input,
    }),
  });
}
