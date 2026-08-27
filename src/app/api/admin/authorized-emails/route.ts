import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/server/auth/session";
import {
  addAuthorizedEmail,
  deleteAuthorizedEmail,
  listAuthorizedEmails,
} from "@/server/auth/repository";

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

async function requireAdmin() {
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
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const emails = await listAuthorizedEmails();

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Unable to retrieve authorized emails:", error);

    return NextResponse.json(
      { message: "Unable to retrieve authorized emails." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json().catch(() => null);
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid email." }, { status: 400 });
    }

    await addAuthorizedEmail(parsed.data.email.trim().toLowerCase());

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to add authorized email:", error);

    return NextResponse.json(
      { message: "Unable to add authorized email." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();

    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid email ID." },
        { status: 400 },
      );
    }

    await deleteAuthorizedEmail(parsed.data.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete authorized email:", error);

    return NextResponse.json(
      { message: "Unable to delete authorized email." },
      { status: 500 },
    );
  }
}


