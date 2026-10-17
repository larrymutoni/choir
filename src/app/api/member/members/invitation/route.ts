import { NextResponse } from "next/server";
import { z } from "zod";
import { hasRolePermission } from "@/lib/permissions";
import { getCurrentSession } from "@/server/auth/session";
import { listMemberEntries } from "@/server/members/repository";
import { sendMemberInvitationEmail } from "@/server/email/member";
import { makeInvitationUrl } from "@/server/auth/invitation";

const schema = z.object({ memberId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (!hasRolePermission(session, "members")) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Membre invalide." }, { status: 400 });
  const member = (await listMemberEntries()).find((item) => item.membershipId === parsed.data.memberId);
  if (!member) return NextResponse.json({ message: "Membre introuvable." }, { status: 404 });
  if (member.userId) {
    return NextResponse.json({ message: "Ce membre a déjà un compte." }, { status: 409 });
  }
  if (session.role !== "super_admin" && (member.role === "super_admin" ||
      (session.role !== "admin" && member.customRoleId))) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  try {
    const url = makeInvitationUrl(request.url, member.email, parsed.data.memberId);
    await sendMemberInvitationEmail(member.email, url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend member invitation:", error);
    return NextResponse.json({ message: "L'invitation n'a pas pu être envoyée." }, { status: 500 });
  }
}
