import {
  Env,
  json,
  readJson,
} from "./http";

type GalleryTokenPayload = {
  scope: "gallery";
  action:
    | "upload"
    | "read"
    | "manage";
  userId: string;
  mediaId?: string;
  exp: number;
};

const MAX_FILE_SIZE =
  95 * 1024 * 1024;

const PHOTO_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const VIDEO_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);

function cleanText(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function optionalText(
  value: unknown,
) {
  const text =
    cleanText(value);

  return text || null;
}

function validDate(
  value: unknown,
) {
  return (
    typeof value ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  );
}

function validDateTime(
  value: unknown,
) {
  return (
    typeof value ===
      "string" &&
    !Number.isNaN(
      Date.parse(value),
    )
  );
}


function validYear(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1900 &&
    value <= 2200
  );
}

function validHash(value: unknown) {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{64}$/i.test(value)
  );
}
function safeFilename(
  value: string,
) {
  const cleaned =
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
      );

  return (
    cleaned ||
    "media"
  );
}

function decodeBase64Url(
  value: string,
) {
  const base64 =
    value
      .replace(
        /-/g,
        "+",
      )
      .replace(
        /_/g,
        "/",
      );

  const padded =
    base64.padEnd(
      Math.ceil(
        base64.length /
          4,
      ) * 4,
      "=",
    );

  const binary =
    atob(padded);

  const bytes =
    new Uint8Array(
      binary.length,
    );

  for (
    let index = 0;
    index <
    binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(
        index,
      );
  }

  return bytes;
}

async function verifyGalleryToken(
  token: string | null,
  env: Env,
) {
  if (
    !token ||
    !env.DB_PROXY_SECRET
  ) {
    return null;
  }

  const parts =
    token.split(".");

  if (
    parts.length !== 2
  ) {
    return null;
  }

  const [
    payloadPart,
    signaturePart,
  ] = parts;

  try {
    const encoder =
      new TextEncoder();

    const key =
      await crypto.subtle.importKey(
        "raw",

        encoder.encode(
          env.DB_PROXY_SECRET,
        ),

        {
          name: "HMAC",
          hash: "SHA-256",
        },

        false,

        ["verify"],
      );

    const valid =
      await crypto.subtle.verify(
        "HMAC",

        key,

        decodeBase64Url(
          signaturePart,
        ),

        encoder.encode(
          payloadPart,
        ),
      );

    if (!valid) {
      return null;
    }

    const decoded =
      new TextDecoder().decode(
        decodeBase64Url(
          payloadPart,
        ),
      );

    const payload =
      JSON.parse(
        decoded,
      ) as Partial<GalleryTokenPayload>;

    if (
      payload.scope !==
        "gallery" ||
      (
        payload.action !==
          "upload" &&
        payload.action !==
          "read" &&
        payload.action !==
          "manage"
      ) ||
      typeof payload.userId !==
        "string" ||
      !payload.userId ||
      typeof payload.exp !==
        "number" ||
      payload.exp <
        Math.floor(
          Date.now() /
            1000,
        )
    ) {
      return null;
    }

    return payload as GalleryTokenPayload;
  } catch {
    return null;
  }
}

function withCors(
  response: Response,
) {
  const headers =
    new Headers(
      response.headers,
    );

  headers.set(
    "Access-Control-Allow-Origin",
    "*",
  );

  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, OPTIONS",
  );

  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Range",
  );

  headers.set(
    "Access-Control-Expose-Headers",
    [
      "Content-Length",
      "Content-Range",
      "Content-Disposition",
      "Accept-Ranges",
    ].join(", "),
  );

  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers,
    },
  );
}

function parseRange(
  value: string,
  totalSize: number,
) {
  const match =
    /^bytes=(\d*)-(\d*)$/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const [
    ,
    startText,
    endText,
  ] = match;

  let start: number;
  let end: number;

  if (!startText) {
    const suffixLength =
      Number(endText);

    if (
      !Number.isFinite(
        suffixLength,
      ) ||
      suffixLength <= 0
    ) {
      return null;
    }

    start =
      Math.max(
        totalSize -
          suffixLength,
        0,
      );

    end =
      totalSize - 1;
  } else {
    start =
      Number(
        startText,
      );

    end =
      endText
        ? Number(
            endText,
          )
        : totalSize - 1;
  }

  if (
    !Number.isInteger(
      start,
    ) ||
    !Number.isInteger(
      end,
    ) ||
    start < 0 ||
    end < start ||
    start >= totalSize
  ) {
    return null;
  }

  end =
    Math.min(
      end,
      totalSize - 1,
    );

  return {
    start,
    end,

    length:
      end -
      start +
      1,
  };
}

export async function handlePublicGalleryRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);

  const isUpload = url.pathname === "/v1/gallery-upload";
  const accessPrefix = "/v1/gallery-access/";
  const managePrefix = "/v1/gallery-manage/";
  const isAccess = url.pathname.startsWith(accessPrefix);
  const isManage = url.pathname.startsWith(managePrefix);
  const isPurge = url.pathname === "/v1/gallery-purge";

  if (!isUpload && !isAccess && !isManage && !isPurge) {
    return null;
  }

  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  const token = await verifyGalleryToken(
    url.searchParams.get("token"),
    env,
  );

  if (!token) {
    return withCors(
      json({ error: "Invalid or expired access token" }, 401),
    );
  }

  if (isUpload) {
    if (request.method !== "POST" || token.action !== "upload") {
      return withCors(json({ error: "Forbidden" }, 403));
    }

    return withCors(
      await uploadGalleryMedia(request, env, token.userId),
    );
  }

  if (isPurge) {
    if (request.method !== "POST" || token.action !== "manage") {
      return withCors(json({ error: "Forbidden" }, 403));
    }

    return withCors(await purgeGallery(env));
  }

  if (isManage) {
    if (token.action !== "manage") {
      return withCors(json({ error: "Forbidden" }, 403));
    }

    const mediaId = decodeURIComponent(
      url.pathname.slice(managePrefix.length),
    );

    if (!mediaId || token.mediaId !== mediaId) {
      return withCors(json({ error: "Forbidden" }, 403));
    }

    if (request.method === "POST") {
      return withCors(
        await storeGalleryVariants(request, env, mediaId),
      );
    }

    if (request.method === "PATCH") {
      return withCors(
        await updateGalleryMediaMetadata(request, env, mediaId),
      );
    }

    return withCors(json({ error: "Method not allowed" }, 405));
  }

  if (request.method !== "GET" || token.action !== "read") {
    return withCors(json({ error: "Forbidden" }, 403));
  }

  const mediaId = decodeURIComponent(
    url.pathname.slice(accessPrefix.length),
  );

  if (!mediaId || token.mediaId !== mediaId) {
    return withCors(json({ error: "Forbidden" }, 403));
  }

  return withCors(
    await serveGalleryMedia(request, env, mediaId),
  );
}

export async function listGallery(
  _request: Request,
  env: Env,
) {
  const [
    albums,
    media,
  ] =
    await Promise.all([
      env.DB.prepare(
        `
        SELECT
          gallery_albums.id,
          gallery_albums.title,
          gallery_albums.description,
          gallery_albums.activity,
          gallery_albums.album_date,
          gallery_albums.cover_media_id,
          gallery_albums.created_at,
          gallery_albums.updated_at,

          COUNT(gallery_media.id)
            AS media_count,

          SUM(
            CASE
              WHEN gallery_media.media_type = 'photo'
              THEN 1
              ELSE 0
            END
          ) AS photo_count,

          SUM(
            CASE
              WHEN gallery_media.media_type = 'video'
              THEN 1
              ELSE 0
            END
          ) AS video_count

        FROM gallery_albums

        LEFT JOIN gallery_media
          ON gallery_media.album_id =
             gallery_albums.id

        GROUP BY gallery_albums.id

        ORDER BY
          gallery_albums.album_date DESC,
          gallery_albums.created_at DESC
        `,
      ).all(),

      env.DB.prepare(
        `
        SELECT
          gallery_media.id,
          gallery_media.album_id,
          gallery_media.media_type,
          gallery_media.original_filename,
          gallery_media.mime_type,
          gallery_media.size_bytes,
          gallery_media.captured_at,
          gallery_media.taken_at,
          gallery_media.year_override,
          gallery_media.width,
          gallery_media.height,

          CASE
            WHEN gallery_media.thumbnail_storage_key IS NOT NULL
            THEN 1 ELSE 0
          END AS has_thumbnail,

          CASE
            WHEN gallery_media.preview_storage_key IS NOT NULL
            THEN 1 ELSE 0
          END AS has_preview,

          gallery_media.created_at,
          gallery_media.updated_at,

          gallery_albums.title
            AS album_title,

          gallery_albums.activity
            AS activity,

          gallery_albums.album_date
            AS album_date

        FROM gallery_media

        LEFT JOIN gallery_albums
          ON gallery_albums.id =
             gallery_media.album_id

        ORDER BY
          gallery_media.created_at DESC
        `,
      ).all(),
    ]);

  return json({
    albums:
      albums.results,

    media:
      media.results,
  });
}

export async function createGalleryAlbum(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      title?: string;
      description?: string | null;
      activity?: string | null;
      albumDate?: string;
      createdByUserId?: string;
    }>(request);

  const title =
    cleanText(
      body.title,
    );

  if (
    !title ||
    !validDate(
      body.albumDate,
    ) ||
    !body.createdByUserId
  ) {
    return json(
      {
        error:
          "Invalid album data",
      },
      400,
    );
  }

  const id =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO gallery_albums (
      id,
      title,
      description,
      activity,
      album_date,
      cover_media_id,
      created_by_user_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)
    `,
  )
    .bind(
      id,
      title,
      optionalText(
        body.description,
      ),
      optionalText(
        body.activity,
      ),
      body.albumDate,
      body.createdByUserId,
      now,
      now,
    )
    .run();

  return json(
    {
      ok: true,
      id,
    },
    201,
  );
}

export async function updateGalleryAlbum(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
      title?: string;
      description?: string | null;
      activity?: string | null;
      albumDate?: string;
      coverMediaId?: string | null;
    }>(request);

  const title =
    cleanText(
      body.title,
    );

  if (
    !body.id ||
    !title ||
    !validDate(
      body.albumDate,
    )
  ) {
    return json(
      {
        error:
          "Invalid album data",
      },
      400,
    );
  }

  if (
    body.coverMediaId
  ) {
    const cover =
      await env.DB.prepare(
        `
        SELECT id
        FROM gallery_media
        WHERE id = ?
          AND album_id = ?
        LIMIT 1
        `,
      )
        .bind(
          body.coverMediaId,
          body.id,
        )
        .first();

    if (!cover) {
      return json(
        {
          error:
            "Invalid album cover",
        },
        400,
      );
    }
  }

  const result =
    await env.DB.prepare(
      `
      UPDATE gallery_albums
      SET
        title = ?,
        description = ?,
        activity = ?,
        album_date = ?,
        cover_media_id = ?,
        updated_at = ?
      WHERE id = ?
      `,
    )
      .bind(
        title,
        optionalText(
          body.description,
        ),
        optionalText(
          body.activity,
        ),
        body.albumDate,
        body.coverMediaId ??
          null,
        new Date().toISOString(),
        body.id,
      )
      .run();

  if (
    result.meta.changes ===
    0
  ) {
    return json(
      {
        error:
          "Album not found",
      },
      404,
    );
  }

  return json({
    ok: true,
  });
}

export async function deleteGalleryAlbum(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
    }>(request);

  if (!body.id) {
    return json(
      {
        error:
          "Album ID is required",
      },
      400,
    );
  }

  const album =
    await env.DB.prepare(
      `
      SELECT id
      FROM gallery_albums
      WHERE id = ?
      LIMIT 1
      `,
    )
      .bind(
        body.id,
      )
      .first();

  if (!album) {
    return json(
      {
        error:
          "Album not found",
      },
      404,
    );
  }

  const now =
    new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `
      UPDATE gallery_media
      SET
        album_id = NULL,
        updated_at = ?
      WHERE album_id = ?
      `,
    ).bind(
      now,
      body.id,
    ),

    env.DB.prepare(
      `
      DELETE FROM gallery_albums
      WHERE id = ?
      `,
    ).bind(
      body.id,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function uploadGalleryMedia(
  request: Request,
  env: Env,
  trustedUserId?: string,
) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return json({ error: "File is required" }, 400);
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return json({ error: "File too large" }, 400);
  }

  const isPhoto = PHOTO_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);

  if (!isPhoto && !isVideo) {
    return json({ error: "Unsupported media type" }, 400);
  }

  const albumId = optionalText(formData.get("albumId"));
  if (albumId) {
    const album = await env.DB.prepare(
      `SELECT id FROM gallery_albums WHERE id = ? LIMIT 1`,
    ).bind(albumId).first();

    if (!album) return json({ error: "Album not found" }, 404);
  }

  const creator = trustedUserId || cleanText(formData.get("createdByUserId"));
  if (!creator) return json({ error: "Creator is required" }, 400);

  const contentHashValue = cleanText(formData.get("contentHash"));
  const contentHash = validHash(contentHashValue) ? contentHashValue.toLowerCase() : null;

  if (contentHash) {
    const duplicate = await env.DB.prepare(
      `SELECT id FROM gallery_media WHERE content_hash = ? LIMIT 1`,
    ).bind(contentHash).first<{ id: string }>();

    if (duplicate) {
      return json({
        error: "duplicate",
        duplicate: true,
        existingId: duplicate.id,
      }, 409);
    }
  }

  const takenAtValue = cleanText(formData.get("takenAt"));
  const takenAt = validDateTime(takenAtValue)
    ? new Date(takenAtValue).toISOString()
    : null;

  const yearRaw = Number(formData.get("yearOverride"));
  const yearOverride = validYear(yearRaw) ? yearRaw : null;

  const widthRaw = Number(formData.get("width"));
  const heightRaw = Number(formData.get("height"));
  const width = Number.isInteger(widthRaw) && widthRaw > 0 ? widthRaw : null;
  const height = Number.isInteger(heightRaw) && heightRaw > 0 ? heightRaw : null;

  const capturedAtValue = cleanText(formData.get("capturedAt"));
  const capturedAt = validDateTime(capturedAtValue)
    ? new Date(capturedAtValue).toISOString()
    : new Date().toISOString();

  const id = crypto.randomUUID();
  const mediaType = isVideo ? "video" : "photo";
  const baseKey = `gallery/${mediaType}/${id}`;
  const storageKey = `${baseKey}/${safeFilename(file.name)}`;

  const thumbnail = formData.get("thumbnail");
  const preview = formData.get("preview");
  const thumbnailFile = thumbnail instanceof File && thumbnail.size > 0 ? thumbnail : null;
  const previewFile = preview instanceof File && preview.size > 0 ? preview : null;

  const thumbnailStorageKey = thumbnailFile ? `${baseKey}/thumbnail.webp` : null;
  const previewStorageKey = previewFile ? `${baseKey}/preview.webp` : null;

  const storedKeys: string[] = [];

  try {
    await env.PRIVATE_STORAGE.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalFilename: file.name, mediaType },
    });
    storedKeys.push(storageKey);

    if (thumbnailFile && thumbnailStorageKey) {
      await env.PRIVATE_STORAGE.put(thumbnailStorageKey, thumbnailFile.stream(), {
        httpMetadata: { contentType: thumbnailFile.type || "image/webp" },
      });
      storedKeys.push(thumbnailStorageKey);
    }

    if (previewFile && previewStorageKey) {
      await env.PRIVATE_STORAGE.put(previewStorageKey, previewFile.stream(), {
        httpMetadata: { contentType: previewFile.type || "image/webp" },
      });
      storedKeys.push(previewStorageKey);
    }

    const now = new Date().toISOString();

    await env.DB.prepare(
      `
      INSERT INTO gallery_media (
        id,
        album_id,
        media_type,
        storage_key,
        original_filename,
        mime_type,
        size_bytes,
        captured_at,
        taken_at,
        year_override,
        width,
        height,
        content_hash,
        thumbnail_storage_key,
        thumbnail_mime_type,
        thumbnail_size_bytes,
        preview_storage_key,
        preview_mime_type,
        preview_size_bytes,
        created_by_user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).bind(
      id,
      albumId,
      mediaType,
      storageKey,
      file.name,
      file.type,
      file.size,
      capturedAt,
      takenAt,
      yearOverride,
      width,
      height,
      contentHash,
      thumbnailStorageKey,
      thumbnailFile?.type || null,
      thumbnailFile?.size || null,
      previewStorageKey,
      previewFile?.type || null,
      previewFile?.size || null,
      creator,
      now,
      now,
    ).run();

    return json({ ok: true, id, mediaType }, 201);
  } catch (error) {
    for (const key of storedKeys) {
      try { await env.PRIVATE_STORAGE.delete(key); } catch {}
    }
    throw error;
  }
}

export async function storeGalleryVariants(
  request: Request,
  env: Env,
  mediaId: string,
) {
  const media = await env.DB.prepare(
    `SELECT id, media_type FROM gallery_media WHERE id = ? LIMIT 1`,
  ).bind(mediaId).first<{ id: string; media_type: "photo" | "video" }>();

  if (!media) return json({ error: "Media not found" }, 404);

  const formData = await request.formData();
  const thumbnail = formData.get("thumbnail");
  const preview = formData.get("preview");
  const thumbnailFile = thumbnail instanceof File && thumbnail.size > 0 ? thumbnail : null;
  const previewFile = preview instanceof File && preview.size > 0 ? preview : null;

  if (!thumbnailFile && !previewFile) {
    return json({ error: "No variants supplied" }, 400);
  }

  const widthRaw = Number(formData.get("width"));
  const heightRaw = Number(formData.get("height"));
  const width = Number.isInteger(widthRaw) && widthRaw > 0 ? widthRaw : null;
  const height = Number.isInteger(heightRaw) && heightRaw > 0 ? heightRaw : null;

  const baseKey = `gallery/${media.media_type}/${mediaId}`;
  const thumbnailStorageKey = thumbnailFile ? `${baseKey}/thumbnail.webp` : null;
  const previewStorageKey = previewFile ? `${baseKey}/preview.webp` : null;

  if (thumbnailFile && thumbnailStorageKey) {
    await env.PRIVATE_STORAGE.put(thumbnailStorageKey, thumbnailFile.stream(), {
      httpMetadata: { contentType: thumbnailFile.type || "image/webp" },
    });
  }

  if (previewFile && previewStorageKey) {
    await env.PRIVATE_STORAGE.put(previewStorageKey, previewFile.stream(), {
      httpMetadata: { contentType: previewFile.type || "image/webp" },
    });
  }

  await env.DB.prepare(
    `
    UPDATE gallery_media
    SET
      thumbnail_storage_key = COALESCE(?, thumbnail_storage_key),
      thumbnail_mime_type = COALESCE(?, thumbnail_mime_type),
      thumbnail_size_bytes = COALESCE(?, thumbnail_size_bytes),
      preview_storage_key = COALESCE(?, preview_storage_key),
      preview_mime_type = COALESCE(?, preview_mime_type),
      preview_size_bytes = COALESCE(?, preview_size_bytes),
      width = COALESCE(?, width),
      height = COALESCE(?, height),
      updated_at = ?
    WHERE id = ?
    `,
  ).bind(
    thumbnailStorageKey,
    thumbnailFile?.type || null,
    thumbnailFile?.size || null,
    previewStorageKey,
    previewFile?.type || null,
    previewFile?.size || null,
    width,
    height,
    new Date().toISOString(),
    mediaId,
  ).run();

  return json({ ok: true });
}

export async function updateGalleryMediaMetadata(
  request: Request,
  env: Env,
  mediaId: string,
) {
  const body = await readJson<{
    takenAt?: string | null;
    yearOverride?: number | null;
    albumId?: string | null;
  }>(request);

  const exists = await env.DB.prepare(
    `SELECT id FROM gallery_media WHERE id = ? LIMIT 1`,
  ).bind(mediaId).first();

  if (!exists) return json({ error: "Media not found" }, 404);

  let takenAt: string | null = null;
  if (body.takenAt) {
    if (!validDate(body.takenAt)) return json({ error: "Invalid date" }, 400);
    takenAt = `${body.takenAt}T12:00:00.000Z`;
  }

  const yearOverride = body.yearOverride == null
    ? null
    : validYear(body.yearOverride)
      ? body.yearOverride
      : null;

  if (body.yearOverride != null && yearOverride == null) {
    return json({ error: "Invalid year" }, 400);
  }

  const albumId = body.albumId || null;
  if (albumId) {
    const album = await env.DB.prepare(
      `SELECT id FROM gallery_albums WHERE id = ? LIMIT 1`,
    ).bind(albumId).first();
    if (!album) return json({ error: "Album not found" }, 404);
  }

  await env.DB.prepare(
    `
    UPDATE gallery_media
    SET taken_at = ?, year_override = ?, album_id = ?, updated_at = ?
    WHERE id = ?
    `,
  ).bind(
    takenAt,
    takenAt ? null : yearOverride,
    albumId,
    new Date().toISOString(),
    mediaId,
  ).run();

  return json({ ok: true });
}

export async function purgeGallery(env: Env) {
  const rows = await env.DB.prepare(
    `
    SELECT storage_key, thumbnail_storage_key, preview_storage_key
    FROM gallery_media
    `,
  ).all<{
    storage_key: string;
    thumbnail_storage_key: string | null;
    preview_storage_key: string | null;
  }>();

  const keys = Array.from(new Set(
    rows.results.flatMap((row) => [
      row.storage_key,
      row.thumbnail_storage_key,
      row.preview_storage_key,
    ]).filter((value): value is string => Boolean(value)),
  ));

  for (let index = 0; index < keys.length; index += 500) {
    await env.PRIVATE_STORAGE.delete(keys.slice(index, index + 500));
  }

  await env.DB.batch([
    env.DB.prepare(`DELETE FROM gallery_media`),
    env.DB.prepare(`DELETE FROM gallery_albums`),
  ]);

  return json({ ok: true, deleted: rows.results.length });
}

export async function deleteGalleryMedia(
  request: Request,
  env: Env,
) {
  const body =
    await readJson<{
      id?: string;
    }>(request);

  if (!body.id) {
    return json(
      {
        error:
          "Media ID is required",
      },
      400,
    );
  }

  const media =
    await env.DB.prepare(
      `
      SELECT
        id,
        storage_key,
        thumbnail_storage_key,
        preview_storage_key,
        album_id
      FROM gallery_media
      WHERE id = ?
      LIMIT 1
      `,
    )
      .bind(
        body.id,
      )
      .first<{
        id: string;
        storage_key: string;
        thumbnail_storage_key: string | null;
        preview_storage_key: string | null;
        album_id: string | null;
      }>();

  if (!media) {
    return json(
      {
        error:
          "Media not found",
      },
      404,
    );
  }

  const keys = [
    media.storage_key,
    media.thumbnail_storage_key,
    media.preview_storage_key,
  ].filter((value): value is string => Boolean(value));

  try {
    await env.PRIVATE_STORAGE.delete(keys);
  } catch (error) {
    console.error(
      "Gallery R2 deletion:",
      error,
    );

    return json(
      {
        error:
          "Stored media deletion failed",
      },
      500,
    );
  }

  await env.DB.batch([
    env.DB.prepare(
      `
      UPDATE gallery_albums
      SET
        cover_media_id = NULL,
        updated_at = ?
      WHERE cover_media_id = ?
      `,
    ).bind(
      new Date().toISOString(),
      body.id,
    ),

    env.DB.prepare(
      `
      DELETE FROM gallery_media
      WHERE id = ?
      `,
    ).bind(
      body.id,
    ),
  ]);

  return json({
    ok: true,
  });
}

export async function serveGalleryMedia(
  request: Request,
  env: Env,
  mediaId: string,
) {
  const media = await env.DB.prepare(
    `
    SELECT
      media_type,
      storage_key,
      original_filename,
      mime_type,
      size_bytes,
      thumbnail_storage_key,
      thumbnail_mime_type,
      thumbnail_size_bytes,
      preview_storage_key,
      preview_mime_type,
      preview_size_bytes
    FROM gallery_media
    WHERE id = ?
    LIMIT 1
    `,
  ).bind(mediaId).first<{
    media_type: "photo" | "video";
    storage_key: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    thumbnail_storage_key: string | null;
    thumbnail_mime_type: string | null;
    thumbnail_size_bytes: number | null;
    preview_storage_key: string | null;
    preview_mime_type: string | null;
    preview_size_bytes: number | null;
  }>();

  if (!media) return json({ error: "Media not found" }, 404);

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const requestedVariant = download
    ? "original"
    : (url.searchParams.get("variant") || "original");

  let storageKey = media.storage_key;
  let mimeType = media.mime_type;
  let sizeBytes = media.size_bytes;

  if (requestedVariant === "thumb" && media.thumbnail_storage_key) {
    storageKey = media.thumbnail_storage_key;
    mimeType = media.thumbnail_mime_type || "image/webp";
    sizeBytes = media.thumbnail_size_bytes || 0;
  } else if (
    requestedVariant === "preview" &&
    media.media_type === "photo" &&
    media.preview_storage_key
  ) {
    storageKey = media.preview_storage_key;
    mimeType = media.preview_mime_type || "image/webp";
    sizeBytes = media.preview_size_bytes || 0;
  }

  const headers = new Headers();
  headers.set("Content-Type", mimeType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set(
    "Content-Disposition",
    `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(
      media.original_filename,
    )}`,
  );

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader && sizeBytes > 0) {
    const range = parseRange(rangeHeader, sizeBytes);
    if (!range) {
      headers.set("Content-Range", `bytes */${sizeBytes}`);
      return new Response(null, { status: 416, headers });
    }

    const object = await env.PRIVATE_STORAGE.get(storageKey, {
      range: { offset: range.start, length: range.length },
    });

    if (!object) return json({ error: "Stored media not found" }, 404);

    headers.set("Content-Length", String(range.length));
    headers.set(
      "Content-Range",
      `bytes ${range.start}-${range.end}/${sizeBytes}`,
    );
    if (object.httpEtag) headers.set("ETag", object.httpEtag);

    return new Response(object.body, { status: 206, headers });
  }

  const object = await env.PRIVATE_STORAGE.get(storageKey);
  if (!object) return json({ error: "Stored media not found" }, 404);

  if (sizeBytes > 0) headers.set("Content-Length", String(sizeBytes));
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  return new Response(object.body, { status: 200, headers });
}
