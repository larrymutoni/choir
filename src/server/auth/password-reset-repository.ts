import { dbRequest } from "@/server/db/client";

export type PasswordResetRecord = {
  id: string;
  user_id: string;
  expires_at: string;
};

export async function createPasswordResetRecord(input: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  return dbRequest<{ ok: true }>("/v1/password-resets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function findPasswordResetByTokenHash(
  tokenHash: string,
): Promise<PasswordResetRecord | null> {
  const result = await dbRequest<{
    reset: PasswordResetRecord | null;
  }>("/v1/password-resets/by-token", {
    method: "POST",
    body: JSON.stringify({ tokenHash }),
  });

  return result.reset;
}

export async function consumePasswordReset(input: {
  tokenId: string;
  userId: string;
  passwordHash: string;
}) {
  return dbRequest<{ ok: true }>("/v1/password-resets/consume", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
