import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/server/auth/session";
import { updateMemberProfile } from "@/server/auth/service";

const schema = z.object({
  firstname: z.string().trim().min(2).max(80),
  lastname: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid profile data." },
        { status: 400 },
      );
    }

    await updateMemberProfile(session.user_id, parsed.data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update failed:", error);

    return NextResponse.json(
      { message: "Unable to update profile." },
      { status: 500 },
    );
  }
}
