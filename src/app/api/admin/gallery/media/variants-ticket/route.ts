import { NextResponse } from "next/server";
import { z } from "zod";

import { hasRolePermission } from "@/lib/permissions";
import { getCurrentSession } from "@/server/auth/session";
import {
  createGalleryManageToken,
  getGalleryWorkerUrl,
} from "@/server/gallery/access-token";

const schema = z.object({ id: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (!hasRolePermission(session, "gallery")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Média invalide." }, { status: 400 });
  }

  const token = createGalleryManageToken({
    userId: session.user_id,
    mediaId: parsed.data.id,
  });

  return NextResponse.json({
    uploadUrl: `${getGalleryWorkerUrl()}/v1/gallery-manage/${encodeURIComponent(
      parsed.data.id,
    )}?token=${encodeURIComponent(token)}`,
  });
}
