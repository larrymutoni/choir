import "server-only";

import { findUserByEmail } from "@/server/auth/repository";

import { dbRequest } from "@/server/db/client";

export async function getAccountProfile(email: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    avatarKey: user.avatarKey,
    role: user.role,
    status: user.status,
  };
}

export async function updateOwnPasswordRecord({
  userId,
  passwordHash,
  currentSessionId,
}: {
  userId: string;
  passwordHash: string;
  currentSessionId: string;
}) {
  return dbRequest<{
    ok: true;
  }>("/v1/users/password", {
    method: "PATCH",

    body: JSON.stringify({
      userId,
      passwordHash,
      currentSessionId,
    }),
  });
}
