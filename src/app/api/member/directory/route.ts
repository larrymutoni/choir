import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import { listDirectoryMembers } from "@/server/directory/repository";

export async function GET() {
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

  try {
    const members =
      await listDirectoryMembers();

    return NextResponse.json({
      members,
    });
  } catch (error) {
    console.error(
      "Directory error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de charger le répertoire.",
      },
      {
        status: 500,
      },
    );
  }
}