import { NextResponse } from "next/server";
import { z } from "zod";

import { hasRolePermission } from "@/lib/permissions";
import { getCurrentSession } from "@/server/auth/session";
import {
  createGalleryManageToken,
  getGalleryWorkerUrl,
} from "@/server/gallery/access-token";
import { deleteGalleryMedia } from "@/server/gallery/repository";

const deleteSchema = z.object({ id: z.string().uuid() });

const updateSchema = z.object({
  id: z.string().uuid(),
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  yearOverride: z.number().int().min(1900).max(2200).nullable().optional(),
  albumId: z.string().uuid().nullable().optional(),
});

async function requireGalleryManager() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!hasRolePermission(session, "gallery")) {
    return {
      response: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
    };
  }

  return { session };
}

export async function PATCH(request: Request) {
  const auth = await requireGalleryManager();
  if ("response" in auth) return auth.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Métadonnées invalides." }, { status: 400 });
  }

  const token = createGalleryManageToken({
    userId: auth.session.user_id,
    mediaId: parsed.data.id,
  });

  const target = `${getGalleryWorkerUrl()}/v1/gallery-manage/${encodeURIComponent(
    parsed.data.id,
  )}?token=${encodeURIComponent(token)}`;

  const workerResponse = await fetch(target, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      takenAt: parsed.data.takenAt ?? null,
      yearOverride: parsed.data.yearOverride ?? null,
      albumId: parsed.data.albumId ?? null,
    }),
  });

  const result = await workerResponse.json().catch(() => ({}));
  return NextResponse.json(result, { status: workerResponse.status });
}

export async function DELETE(request: Request) {
  const auth = await requireGalleryManager();
  if ("response" in auth) return auth.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Média invalide." }, { status: 400 });
  }

  await deleteGalleryMedia(parsed.data.id);
  return NextResponse.json({ ok: true });
}
