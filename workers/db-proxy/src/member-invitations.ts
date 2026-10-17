import { type Env } from "./http";

const CONTEXT = "chorale-member-invitation-v1";
const VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

function decodeBase64Url(raw: string): ArrayBuffer {
  const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

async function signingKey(secret: string) {
  const master = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const derived = await crypto.subtle.sign("HMAC", master, new TextEncoder().encode(CONTEXT));
  return crypto.subtle.importKey(
    "raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
}

export async function verifyMemberInvitation(
  token: string | undefined,
  email: string,
  memberId: string,
  env: Env,
) {
  if (!token || !env.DB_PROXY_SECRET || token.length > 1500 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return false;
  try {
    const [encoded, supplied] = token.split(".");
    const key = await signingKey(env.DB_PROXY_SECRET);
    const isValid = await crypto.subtle.verify(
      "HMAC", key, decodeBase64Url(supplied), new TextEncoder().encode(encoded),
    );
    if (!isValid) return false;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encoded))) as {
      v?: number; email?: string; memberId?: string; exp?: number;
    };
    const now = Date.now();
    return payload.v === 1 && payload.email === email && payload.memberId === memberId &&
      typeof payload.exp === "number" && Number.isFinite(payload.exp) &&
      payload.exp > now && payload.exp <= now + VALIDITY_MS;
  } catch {
    return false;
  }
}
