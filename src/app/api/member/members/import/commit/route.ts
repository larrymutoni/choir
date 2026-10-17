import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/server/auth/session";
import {
  importMembers,
  listMemberEntries,
} from "@/server/members/repository";

import {
  sendMemberInvitationEmail,
} from "@/server/email/member";
import { makeInvitationUrl } from "@/server/auth/invitation";

const memberSchema = z.object({
  firstname: z.string().trim().min(1).max(80),

  lastname: z.string().trim().min(1).max(80),

  email: z.string().trim().email().max(254),

  phone: z.string().trim().max(30).nullable().optional(),

  voiceType: z
    .enum([
      "soprano",
      "alto",
      "tenor",
    ])
    .nullable()
    .optional(),
});

const importSchema = z.object({
  members: z.array(memberSchema).min(1).max(200),
});

function canManage(
  session: Parameters<
    typeof hasRolePermission
  >[0],
) {
  return hasRolePermission(
    session,
    "members",
  );
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

  if (!canManage(session)) {
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
    const existingEntries =
      await listMemberEntries();

    const existingEmails =
      new Set(
        existingEntries.map(
          (entry) =>
            entry.email
              .trim()
              .toLowerCase(),
        ),
      );

    const normalizedMembers =
      parsed.data.members.map((member) => ({
        firstname: member.firstname,

        lastname: member.lastname,

        email: member.email.trim().toLowerCase(),

        phone: member.phone || null,

        voiceType:
          member.voiceType ?? null,
      }));

    const result = await importMembers(
      normalizedMembers,
    );

    const invitationTargets =
      normalizedMembers.filter(
        (member) =>
          !existingEmails.has(
            member.email,
          ),
      );

    let invitationsSent = 0;
    let invitationsFailed = 0;

    const addedMembers = await listMemberEntries();
    const memberIdByEmail = new Map(
      addedMembers.filter((member) => member.membershipId)
        .map((member) => [member.email.trim().toLowerCase(), member.membershipId!]),
    );

    for (
      let offset = 0;
      offset < invitationTargets.length;
      offset += 10
    ) {
      const batch =
        invitationTargets.slice(
          offset,
          offset + 10,
        );

      const results =
        await Promise.allSettled(
          batch.map(async (member) => {
            const memberId = memberIdByEmail.get(member.email);
            if (!memberId) throw new Error("Member record was not found after import");
            await sendMemberInvitationEmail(
              member.email, makeInvitationUrl(request.url, member.email, memberId),
            );
          }),
        );

      for (const emailResult of results) {
        if (emailResult.status === "fulfilled") {
          invitationsSent += 1;
        } else {
          invitationsFailed += 1;
          console.error(
            "Member import invitation:",
            emailResult.reason,
          );
        }
      }
    }

    return NextResponse.json(
      {
        ...result,
        invitationsSent,
        invitationsFailed,
      },
      {
        status: 201,
      },
    );


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
