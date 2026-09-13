import "server-only";

import { createHmac } from "node:crypto";

type ResourceTokenPayload = {
  scope: "resources";
  action: "upload" | "read";
  userId: string;
  resourceId?: string;
  canManage?: boolean;
  exp: number;
};

function getSecret() {
  const secret = process.env.DB_PROXY_SECRET;

  if (!secret) {
    throw new Error("DB_PROXY_SECRET is missing.");
  }

  return secret;
}

export function getResourceWorkerUrl() {
  const url = process.env.DB_PROXY_URL;

  if (!url) {
    throw new Error("DB_PROXY_URL is missing.");
  }

  return url.replace(/\/$/, "");
}

function sign(payload: ResourceTokenPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  const signature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function createResourceUploadToken(userId: string) {
  return sign({
    scope: "resources",

    action: "upload",

    userId,

    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  });
}

export function createResourceReadToken(input: {
  userId: string;
  resourceId: string;
  canManage: boolean;
}) {
  return sign({
    scope: "resources",

    action: "read",

    userId: input.userId,

    resourceId: input.resourceId,

    canManage: input.canManage,

    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}
