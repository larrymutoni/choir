import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const INVITATION_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;
const CONTEXT = "chorale-member-invitation-v1";

type InvitationData = {
  v: 1;
  email: string;
  memberId: string;
  exp: number;
};

function signingKey() {
  const masterSecret = process.env.DB_PROXY_SECRET;
  if (!masterSecret) throw new Error("Missing DB proxy secret for invitations.");
  // Domain separation: signing invitations never exposes the DB proxy secret itself.
  return createHmac("sha256", masterSecret).update(CONTEXT).digest();
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest();
}

export function createInvitationToken(email: string, memberId: string) {
  const payload: InvitationData = {
    v: 1,
    email: email.trim().toLowerCase(),
    memberId,
    exp: Date.now() + INVITATION_VALIDITY_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${Buffer.from(signature(encoded)).toString("base64url")}`;
}

export function verifyInvitationToken(token: string, email: string, memberId: string) {
  if (!token || token.length > 1500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return false;
  const [encoded, supplied] = token.split(".");
  const expected = signature(encoded);
  const received = Buffer.from(supplied, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const data: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!data || typeof data !== "object") return false;
    const value = data as Partial<InvitationData>;
    const now = Date.now();
    return value.v === 1 &&
      value.email === email.trim().toLowerCase() &&
      value.memberId === memberId &&
      typeof value.exp === "number" &&
      Number.isFinite(value.exp) &&
      value.exp > now && value.exp <= now + INVITATION_VALIDITY_MS;
  } catch {
    return false;
  }
}

export function makeInvitationUrl(requestUrl: string, email: string, memberId: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = configured?.startsWith("https://")
    ? new URL(configured).origin
    : new URL(requestUrl).origin;
  const url = new URL("/inscription", origin);
  // Fragment avoids logging the private token in HTTP requests and referrers.
  url.hash = new URLSearchParams({ invitation: createInvitationToken(email, memberId) }).toString();
  return url.toString();
}
