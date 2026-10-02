import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePermission } from "@/lib/auth";
import { updateSiteContent } from "@/server/content/repository";

const updateContentSchema = z.object({
  items: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    }),
  ),
});

export async function PUT(request: Request) {
  await requirePermission("content");

  const body = await request.json();
  const parsed = updateContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Données de contenu invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    await updateSiteContent(
      parsed.data.items,
    );

    return NextResponse.json({
      ok: true,
      message: "Contenu enregistré.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Impossible d’enregistrer le contenu.",
      },
      {
        status: 500,
      },
    );
  }
}
