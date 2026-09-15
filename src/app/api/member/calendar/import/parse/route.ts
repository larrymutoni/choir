import { hasRolePermission } from "@/lib/permissions";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import { parsePlanningFile } from "@/server/calendar/import-parser";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function canManage(
  session: Parameters<
    typeof hasRolePermission
  >[0],
) {
  return hasRolePermission(
    session,
    "calendar",
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

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "Sélectionnez un fichier.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Le fichier doit faire moins de 10 Mo.",
        },
        {
          status: 400,
        },
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["xlsx", "csv", "docx"].includes(extension)) {
      return NextResponse.json(
        {
          message: "Formats acceptés : XLSX, CSV et DOCX.",
        },
        {
          status: 400,
        },
      );
    }

    const events = await parsePlanningFile(file);

    if (events.length === 0) {
      return NextResponse.json(
        {
          message: "Aucune date exploitable n'a été détectée dans ce fichier.",
        },
        {
          status: 422,
        },
      );
    }

    return NextResponse.json({
      fileName: file.name,
      events,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'analyser le fichier.",
      },
      {
        status: 400,
      },
    );
  }
}
