import { NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/session";
import {
  parseMemberFile,
  validateParsedMember,
} from "@/server/members/import-parser";

export const runtime = "nodejs";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

function canManage(
  role: string,
) {
  return (
    role === "admin" ||
    role === "super_admin"
  );
}

export async function POST(
  request: Request,
) {
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
    !canManage(
      session.role,
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Forbidden.",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          message:
            "Sélectionnez un fichier.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size === 0 ||
      file.size >
        MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          message:
            "Le fichier doit faire moins de 10 Mo.",
        },
        {
          status: 400,
        },
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !extension ||
      ![
        "xlsx",
        "csv",
      ].includes(extension)
    ) {
      return NextResponse.json(
        {
          message:
            "Formats acceptés : XLSX et CSV.",
        },
        {
          status: 400,
        },
      );
    }

    const members =
      await parseMemberFile(
        file,
      );

    if (
      members.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "Aucun membre n'a été détecté dans ce fichier.",
        },
        {
          status: 422,
        },
      );
    }

    const enriched =
      members.map(
        (member) => ({
          ...member,

          error:
            validateParsedMember(
              member,
            ),
        }),
      );

    return NextResponse.json({
      fileName:
        file.name,

      members:
        enriched,
    });
  } catch (error) {
    console.error(
      "Members import parse:",
      error,
    );

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