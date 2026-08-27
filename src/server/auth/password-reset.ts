import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/server/auth/repository";
import {
  consumePasswordReset,
  createPasswordResetRecord,
  findPasswordResetByTokenHash,
} from "@/server/auth/password-reset-repository";
import { sendPasswordResetEmail } from "@/server/email/auth";

const RESET_DURATION_MS = 60 * 60 * 1000;

function createToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  const user = await findUserByEmail(email);

  if (!user || user.status !== "active") {
    return;
  }

  const token = createToken();
  const tokenHash = await hashToken(token);

  await createPasswordResetRecord({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_DURATION_MS).toISOString(),
  });

  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = await hashToken(token);

  const reset = await findPasswordResetByTokenHash(tokenHash);

  if (!reset) {
    return false;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await consumePasswordReset({
    tokenId: reset.id,
    userId: reset.user_id,
    passwordHash,
  });

  return true;
}
