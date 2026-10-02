import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import {
  createGalleryReadToken,
  getGalleryWorkerUrl,
} from "@/server/gallery/access-token";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Média invalide." }, { status: 400 });
  }

  try {
    const token = createGalleryReadToken({
      userId: session.user_id,
      mediaId: id,
    });

    const target = new URL(
      `${getGalleryWorkerUrl()}/v1/gallery-access/${encodeURIComponent(id)}`,
    );
    target.searchParams.set("token", token);

    const source = new URL(request.url);
    const variant = source.searchParams.get("variant");

    if (variant === "thumb" || variant === "preview" || variant === "original") {
      target.searchParams.set("variant", variant);
    }

    if (source.searchParams.get("download") === "1") {
      target.searchParams.set("download", "1");
    }

    const response = NextResponse.redirect(target, 307);
    response.headers.set("Cache-Control", "private, max-age=3300");
    return response;
  } catch (error) {
    console.error("Gallery media access:", error);
    return NextResponse.json(
      { message: "Impossible d’accéder au média." },
      { status: 500 },
    );
  }
}
