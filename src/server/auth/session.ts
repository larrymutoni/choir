import { cookies } from "next/headers";
import {
  createSessionRecord,
  deleteSessionByTokenHash,
  findSessionByTokenHash,
} from "@/server/auth/repository";

const SESSION_COOKIE = "chorale_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function createToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createUserSession(userId: string) {
  const token = createToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await createSessionRecord({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const tokenHash = await hashToken(token);
  const session = await findSessionByTokenHash(tokenHash);

  if (!session || session.status !== "active") {
    return null;
  }

  return session;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = await hashToken(token);
    await deleteSessionByTokenHash(tokenHash);
  }

  cookieStore.delete(SESSION_COOKIE);
}