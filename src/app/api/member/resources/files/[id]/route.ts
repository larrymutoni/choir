import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";

import {
  createResourceReadToken,
  getResourceWorkerUrl,
} from "@/server/resources/access-token";

export const runtime = "nodejs";

function canManage(role: string) {
  return role === "admin" || role === "super_admin";
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      {
        message: "Ressource invalide.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const token = createResourceReadToken({
      userId: session.user_id,

      resourceId: id,

      canManage: canManage(session.role),
    });

    const workerUrl = getResourceWorkerUrl();

    const target = new URL(
      `${workerUrl}/v1/resource-access/${encodeURIComponent(id)}`,
    );

    target.searchParams.set("token", token);

    const source = new URL(request.url);

    if (source.searchParams.get("download") === "1") {
      target.searchParams.set("download", "1");
    }

    return NextResponse.redirect(target, 307);
  } catch (error) {
    console.error("Resource access:", error);

    return NextResponse.json(
      {
        message: "Impossible d'accéder à la ressource.",
      },
      {
        status: 500,
      },
    );
  }
}
