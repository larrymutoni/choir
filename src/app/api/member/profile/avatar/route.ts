import { NextResponse } from "next/server";

import { requireUser } from "@/server/auth/guard";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getWorkerConfig() {
  const url = process.env.DB_PROXY_URL;

  const secret = process.env.DB_PROXY_SECRET;

  if (!url || !secret) {
    throw new Error("DB proxy configuration is missing.");
  }

  return {
    url: url.replace(/\/$/, ""),

    secret,
  };
}

export async function GET() {
  const session = await requireUser();

  const config = getWorkerConfig();

  const url = new URL(`${config.url}/v1/users/avatar`);

  url.searchParams.set("userId", session.user_id);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.secret}`,
    },

    cache: "no-store",
  });

  if (response.status === 404) {
    return new Response(null, {
      status: 404,
    });
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        message: "Impossible de charger la photo.",
      },
      {
        status: response.status,
      },
    );
  }

  const headers = new Headers();

  headers.set(
    "Content-Type",
    response.headers.get("Content-Type") ?? "application/octet-stream",
  );

  headers.set("Cache-Control", "private, max-age=300");

  const etag = response.headers.get("ETag");

  if (etag) {
    headers.set("ETag", etag);
  }

  return new Response(response.body, {
    status: 200,
    headers,
  });
}

export async function POST(request: Request) {
  const session = await requireUser();

  const formData = await request.formData().catch(() => null);

  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: "Photo manquante.",
      },
      {
        status: 400,
      },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        message: "Utilisez une image JPG, PNG ou WebP.",
      },
      {
        status: 400,
      },
    );
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      {
        message: "La photo ne doit pas dépasser 2 Mo.",
      },
      {
        status: 400,
      },
    );
  }

  const config = getWorkerConfig();

  const workerBody = new FormData();

  workerBody.set("userId", session.user_id);

  workerBody.set("file", file);

  const response = await fetch(`${config.url}/v1/users/avatar`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${config.secret}`,
    },

    body: workerBody,
  });

  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    avatarKey?: string;
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        message: result.error ?? "Impossible d’enregistrer la photo.",
      },
      {
        status: response.status,
      },
    );
  }

  return NextResponse.json({
    ok: true,

    avatarKey: result.avatarKey,
  });
}

export async function DELETE() {
  const session = await requireUser();

  const config = getWorkerConfig();

  const response = await fetch(`${config.url}/v1/users/avatar`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${config.secret}`,

      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      userId: session.user_id,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        message: result.error ?? "Impossible de supprimer la photo.",
      },
      {
        status: response.status,
      },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
