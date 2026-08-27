import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/server/auth/session";
import { setUserRole } from "@/server/auth/service";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["member", "admin", "super_admin"]),
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

    if (session.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid role data." },
        { status: 400 },
      );
    }

    if (parsed.data.userId === session.user_id) {
      return NextResponse.json(
        { message: "You cannot change your own role." },
        { status: 400 },
      );
    }

    await setUserRole(parsed.data.userId, parsed.data.role);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to update role:", error);

    return NextResponse.json(
      { message: "Unable to update role." },
      { status: 500 },
    );
  }
}
