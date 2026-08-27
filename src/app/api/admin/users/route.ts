import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/server/auth/session";
import { getUsersForAdmin, setUserApprovalStatus } from "@/server/auth/service";

const updateStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "rejected"]),
});

async function requireAdminApi() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!["admin", "super_admin"].includes(session.role)) {
    return {
      error: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
    };
  }

  return { session };
}

export async function GET() {
  try {
    const auth = await requireAdminApi();

    if ("error" in auth) {
      return auth.error;
    }

    const users = await getUsersForAdmin();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Unable to retrieve users:", error);

    return NextResponse.json(
      { message: "Unable to retrieve users." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminApi();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json().catch(() => null);
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid user status data." },
        { status: 400 },
      );
    }

    await setUserApprovalStatus(parsed.data.userId, parsed.data.status);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to update user status:", error);

    return NextResponse.json(
      { message: "Unable to update user status." },
      { status: 500 },
    );
  }
}
