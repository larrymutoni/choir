import "server-only";

import { createHmac } from "node:crypto";

type GalleryTokenPayload = {
  scope: "gallery";
  action: "upload" | "read" | "manage";
  userId: string;
  mediaId?: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.DB_PROXY_SECRET;
  if (!secret) throw new Error("DB_PROXY_SECRET is missing.");
  return secret;
}

export function getGalleryWorkerUrl() {
  const url = process.env.DB_PROXY_URL;
  if (!url) throw new Error("DB_PROXY_URL is missing.");
  return url.replace(/\/$/, "");
}

function sign(payload: GalleryTokenPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function createGalleryUploadToken(userId: string) {
  return sign({
    scope: "gallery",
    action: "upload",
    userId,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}

export function createGalleryReadToken(input: { userId: string; mediaId: string }) {
  // Rounded expiry keeps the signed URL stable during normal navigation,
  // which lets the browser reuse its private cache instead of fetching again.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = (Math.floor(nowSeconds / 3600) + 2) * 3600;

  return sign({
    scope: "gallery",
    action: "read",
    userId: input.userId,
    mediaId: input.mediaId,
    exp,
  });
}

export function createGalleryManageToken(input: {
  userId: string;
  mediaId?: string;
}) {
  return sign({
    scope: "gallery",
    action: "manage",
    userId: input.userId,
    mediaId: input.mediaId,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}
