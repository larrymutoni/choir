import {
  NextResponse,
} from "next/server";

import {
  getCurrentSession,
} from "@/server/auth/session";

function workerConfig() {
  const url =
    process.env.DB_PROXY_URL;

  const secret =
    process.env.DB_PROXY_SECRET;

  if (!url || !secret) {
    throw new Error(
      "DB proxy configuration is missing.",
    );
  }

  return {
    url:
      url.replace(/\/$/, ""),
    secret,
  };
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  },
) {
  const session =
    await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    session.role !== "admin" &&
    session.role !==
      "super_admin"
  ) {
    return NextResponse.json(
      {
        message:
          "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const {
    userId,
  } =
    await context.params;

  if (!userId) {
    return NextResponse.json(
      {
        message:
          "Membre invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const config =
      workerConfig();

    const target =
      new URL(
        `${config.url}/v1/users/avatar`,
      );

    target.searchParams.set(
      "userId",
      userId,
    );

    const response =
      await fetch(
        target,
        {
          headers: {
            Authorization:
              `Bearer ${config.secret}`,
          },
          cache:
            "no-store",
        },
      );

    if (
      response.status ===
      404
    ) {
      return new Response(
        null,
        {
          status: 404,
        },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            "Impossible de charger la photo.",
        },
        {
          status:
            response.status,
        },
      );
    }

    const headers =
      new Headers();

    headers.set(
      "Content-Type",
      response.headers.get(
        "Content-Type",
      ) ??
        "application/octet-stream",
    );

    headers.set(
      "Cache-Control",
      "private, max-age=300",
    );

    const etag =
      response.headers.get(
        "ETag",
      );

    if (etag) {
      headers.set(
        "ETag",
        etag,
      );
    }

    return new Response(
      response.body,
      {
        status: 200,
        headers,
      },
    );
  } catch (error) {
    console.error(
      "Member avatar:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de charger la photo.",
      },
      {
        status: 500,
      },
    );
  }
}
