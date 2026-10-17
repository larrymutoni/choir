import {
  NextResponse,
} from "next/server";

import {
  getCurrentSession,
} from "@/server/auth/session";

import {
  listMemberEntries,
} from "@/server/members/repository";

function workerConfig() {
  const url =
    process.env.DB_PROXY_URL;

  const secret =
    process.env.DB_PROXY_SECRET;

  if (!url || !secret) {
    throw new Error(
      "DB proxy configuration is missing.",
    );
  }

  return {
    url:
      url.replace(/\/$/, ""),
    secret,
  };
}

function crc32(
  bytes: Uint8Array,
) {
  let crc =
    0xffffffff;

  for (
    const byte of bytes
  ) {
    crc ^= byte;

    for (
      let bit = 0;
      bit < 8;
      bit += 1
    ) {
      crc =
        (crc >>> 1) ^
        (
          crc & 1
            ? 0xedb88320
            : 0
        );
    }
  }

  return (
    crc ^ 0xffffffff
  ) >>> 0;
}

function zipDateTime(
  value: string,
) {
  const parsed =
    new Date(value);

  const date =
    Number.isNaN(
      parsed.getTime(),
    )
      ? new Date()
      : parsed;

  const year =
    Math.min(
      2107,
      Math.max(
        1980,
        date.getFullYear(),
      ),
    );

  return {
    dosDate:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),

    dosTime:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(
        date.getSeconds() / 2,
      ),
  };
}

function createStoredZip(
  entries: Array<{
    name: string;
    data: ArrayBuffer;
    date: string;
  }>,
) {
  const encoder =
    new TextEncoder();

  const localParts:
    BlobPart[] = [];

  const centralParts:
    BlobPart[] = [];

  let offset = 0;
  let centralSize = 0;

  for (
    const entry of entries
  ) {
    const name =
      encoder.encode(
        entry.name,
      );

    const bytes =
      new Uint8Array(
        entry.data,
      );

    const checksum =
      crc32(bytes);

    const {
      dosDate,
      dosTime,
    } =
      zipDateTime(
        entry.date,
      );

    const local =
      new Uint8Array(30);

    const localView =
      new DataView(
        local.buffer,
      );

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, bytes.byteLength, true);
    localView.setUint32(22, bytes.byteLength, true);
    localView.setUint16(26, name.byteLength, true);
    localView.setUint16(28, 0, true);

    localParts.push(
      local,
      name,
      entry.data,
    );

    const central =
      new Uint8Array(46);

    const centralView =
      new DataView(
        central.buffer,
      );

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, bytes.byteLength, true);
    centralView.setUint32(24, bytes.byteLength, true);
    centralView.setUint16(28, name.byteLength, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);

    centralParts.push(
      central,
      name,
    );

    offset +=
      local.byteLength +
      name.byteLength +
      bytes.byteLength;

    centralSize +=
      central.byteLength +
      name.byteLength;
  }

  const end =
    new Uint8Array(22);

  const endView =
    new DataView(
      end.buffer,
    );

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob(
    [
      ...localParts,
      ...centralParts,
      end,
    ],
    {
      type:
        "application/zip",
    },
  );
}

function safeName(
  value: string,
) {
  return (
    value
      .normalize("NFD")
      .replace(
        /\p{Diacritic}/gu,
        "",
      )
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      ) ||
    "membre"
  );
}

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

  if (
    session.role !== "admin" &&
    session.role !==
      "super_admin"
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
    const members =
      await listMemberEntries();

    const config =
      workerConfig();

    const entries:
      Array<{
        name: string;
        data: ArrayBuffer;
        date: string;
      }> = [];

    const used =
      new Set<string>();

    for (
      const member of members
    ) {
      if (!member.userId) {
        continue;
      }

      const target =
        new URL(
          `${config.url}/v1/users/avatar`,
        );

      target.searchParams.set(
        "userId",
        member.userId,
      );

      const response =
        await fetch(
          target,
          {
            headers: {
              Authorization:
                `Bearer ${config.secret}`,
            },
            cache:
              "no-store",
          },
        );

      if (
        response.status ===
        404
      ) {
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Avatar fetch failed: ${response.status}`,
        );
      }

      const type =
        response.headers.get(
          "Content-Type",
        ) ?? "";

      const extension =
        type.includes("png")
          ? "png"
          : type.includes("webp")
            ? "webp"
            : "jpg";

      const base =
        safeName(
          `${member.lastname}-${member.firstname}`,
        );

      let filename =
        `${base}.${extension}`;

      let suffix = 2;

      while (
        used.has(
          filename.toLowerCase(),
        )
      ) {
        filename =
          `${base}-${suffix}.${extension}`;

        suffix += 1;
      }

      used.add(
        filename.toLowerCase(),
      );

      entries.push({
        name:
          filename,

        data:
          await response.arrayBuffer(),

        date:
          member.createdAt ||
          new Date().toISOString(),
      });
    }

    if (!entries.length) {
      return NextResponse.json(
        {
          message:
            "Aucun membre n’a encore ajouté de photo.",
        },
        {
          status: 404,
        },
      );
    }

    const zip =
      createStoredZip(
        entries,
      );

    return new Response(
      zip,
      {
        headers: {
          "Content-Type":
            "application/zip",

          "Content-Disposition":
            'attachment; filename="photos-membres.zip"',

          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Member photos ZIP:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de préparer les photos des membres.",
      },
      {
        status: 500,
      },
    );
  }
}
