import {
  NextResponse,
} from "next/server";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  clearCalendar,
} from "@/server/calendar/repository";

export async function DELETE() {
  const session =
    await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      {
        message:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    session.role !== "admin" &&
    session.role !== "super_admin"
  ) {
    return NextResponse.json(
      {
        message:
          "Action réservée aux administrateurs.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    await clearCalendar();

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          "Impossible de vider le calendrier.",
      },
      {
        status: 500,
      },
    );
  }
}
