export interface Env {
  DB: D1Database;
  PUBLIC_STORAGE: R2Bucket;
  PRIVATE_STORAGE: R2Bucket;
  DB_PROXY_SECRET: string;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function isAuthorized(request: Request, env: Env) {
  if (!env.DB_PROXY_SECRET) return false;

  return (
    request.headers.get("Authorization") === `Bearer ${env.DB_PROXY_SECRET}`
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  const body = await request.json();

  if (!body || typeof body !== "object") {
    throw new Error("Invalid JSON body");
  }

  return body as T;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
