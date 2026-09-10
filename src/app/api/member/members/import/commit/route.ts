import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";
import { importMembers } from "@/server/members/repository";

const memberSchema = z.object({
  firstname: z.string().trim().min(1).max(80),

  lastname: z.string().trim().min(1).max(80),

  email: z.string().trim().email().max(254),

  phone: z.string().trim().max(30).nullable().optional(),
});

const importSchema = z.object({
  members: z.array(memberSchema).min(1).max(200),
});

function canManage(role: string) {
  return role === "admin" || role === "super_admin";
}

export async function POST(request: Request) {
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

  if (!canManage(session.role)) {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  const body: unknown = await request.json().catch(() => null);

  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Certaines lignes sont invalides.",
      },
      {
        status: 400,
      },
    );
  }

  const seen = new Set<string>();

  for (const member of parsed.data.members) {
    const email = member.email.trim().toLowerCase();

    if (seen.has(email)) {
      return NextResponse.json(
        {
          message: `L'email ${email} apparaît plusieurs fois dans l'import.`,
        },
        {
          status: 400,
        },
      );
    }

    seen.add(email);
  }

  try {
    const result = await importMembers(
      parsed.data.members.map((member) => ({
        firstname: member.firstname,

        lastname: member.lastname,

        email: member.email.trim().toLowerCase(),

        phone: member.phone || null,
      })),
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("Members import commit:", error);

    return NextResponse.json(
      {
        message: "Impossible d'importer les membres.",
      },
      {
        status: 500,
      },
    );
  }
}
