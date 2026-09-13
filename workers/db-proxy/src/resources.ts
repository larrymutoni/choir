import { Env, json, readJson } from "./http";

type SongRow = {
  id: string;
  title: string;
  composer: string | null;
  program: string | null;
  lyrics: string | null;
  notes: string | null;
  status: "draft" | "published";
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type ResourceFileRow = {
  id: string;
  song_id: string | null;
  kind: "score" | "audio" | "document";
  title: string;
  category: string | null;
  description: string | null;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  downloadable: number;
  published: number;
  sort_order: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

type ResourceTokenPayload = {
  scope: "resources";
  action: "upload" | "read";
  userId: string;
  resourceId?: string;
  canManage?: boolean;
  exp: number;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "image/jpeg",
  "image/png",
  "image/webp",

  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
  "audio/x-flac",
]);

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function optionalText(value: unknown) {
  const text = cleanText(value);

  return text || null;
}

function boolFromForm(value: FormDataEntryValue | null, defaultValue = true) {
  if (value === null) {
    return defaultValue;
  }

  return String(value) === "true" || String(value) === "1";
}

function safeFilename(value: string) {
  const cleaned = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "fichier";
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");

  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const binary = atob(padded);

  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function verifyResourceToken(token: string | null, env: Env) {
  if (!token || !env.DB_PROXY_SECRET) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payloadPart, signaturePart] = parts;

  try {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",

      encoder.encode(env.DB_PROXY_SECRET),

      {
        name: "HMAC",
        hash: "SHA-256",
      },

      false,

      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      "HMAC",

      key,

      decodeBase64Url(signaturePart),

      encoder.encode(payloadPart),
    );

    if (!valid) {
      return null;
    }

    const decoded = new TextDecoder().decode(decodeBase64Url(payloadPart));

    const payload = JSON.parse(decoded) as Partial<ResourceTokenPayload>;

    if (
      payload.scope !== "resources" ||
      (payload.action !== "upload" && payload.action !== "read") ||
      typeof payload.userId !== "string" ||
      !payload.userId ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload as ResourceTokenPayload;
  } catch {
    return null;
  }
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);

  headers.set("Access-Control-Allow-Origin", "*");

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  headers.set("Access-Control-Allow-Headers", "Content-Type, Range");

  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Content-Disposition, Accept-Ranges",
  );

  return new Response(response.body, {
    status: response.status,

    statusText: response.statusText,

    headers,
  });
}

export async function handlePublicResourceRequest(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);

  const isUpload = url.pathname === "/v1/resource-upload";

  const accessPrefix = "/v1/resource-access/";

  const isAccess = url.pathname.startsWith(accessPrefix);

  if (!isUpload && !isAccess) {
    return null;
  }

  if (request.method === "OPTIONS") {
    return withCors(
      new Response(null, {
        status: 204,
      }),
    );
  }

  const token = await verifyResourceToken(url.searchParams.get("token"), env);

  if (!token) {
    return withCors(
      json(
        {
          error: "Invalid or expired access token",
        },
        401,
      ),
    );
  }

  if (isUpload) {
    if (request.method !== "POST" || token.action !== "upload") {
      return withCors(
        json(
          {
            error: "Forbidden",
          },
          403,
        ),
      );
    }

    const response = await uploadResourceFile(request, env, token.userId);

    return withCors(response);
  }

  if (request.method !== "GET" || token.action !== "read") {
    return withCors(
      json(
        {
          error: "Forbidden",
        },
        403,
      ),
    );
  }

  const resourceId = decodeURIComponent(
    url.pathname.slice(accessPrefix.length),
  );

  if (!resourceId || token.resourceId !== resourceId) {
    return withCors(
      json(
        {
          error: "Forbidden",
        },
        403,
      ),
    );
  }

  const response = await serveResourceFile(
    request,
    env,
    resourceId,
    Boolean(token.canManage),
  );

  return withCors(response);
}

export async function listResources(request: Request, env: Env) {
  const url = new URL(request.url);

  const includeUnpublished =
    url.searchParams.get("include_unpublished") === "1";

  const songsResult = await env.DB.prepare(
    `
      SELECT
        id,
        title,
        composer,
        program,
        lyrics,
        notes,
        status,
        created_by_user_id,
        created_at,
        updated_at
      FROM songs
      ${includeUnpublished ? "" : "WHERE status = 'published'"}
      ORDER BY
        LOWER(title),
        created_at DESC
      `,
  ).all<SongRow>();

  const filesResult = await env.DB.prepare(
    `
      SELECT
        id,
        song_id,
        kind,
        title,
        category,
        description,
        storage_key,
        original_filename,
        mime_type,
        size_bytes,
        downloadable,
        published,
        sort_order,
        created_by_user_id,
        created_at,
        updated_at
      FROM resource_files
      ${includeUnpublished ? "" : "WHERE published = 1"}
      ORDER BY
        sort_order,
        LOWER(title),
        created_at
      `,
  ).all<ResourceFileRow>();

  const files = filesResult.results.map((file) => ({
    id: file.id,

    songId: file.song_id,

    kind: file.kind,

    title: file.title,

    category: file.category,

    description: file.description,

    originalFilename: file.original_filename,

    mimeType: file.mime_type,

    sizeBytes: file.size_bytes,

    downloadable: Boolean(file.downloadable),

    published: Boolean(file.published),

    sortOrder: file.sort_order,

    createdAt: file.created_at,

    updatedAt: file.updated_at,
  }));

  const songs = songsResult.results.map((song) => ({
    id: song.id,

    title: song.title,

    composer: song.composer,

    program: song.program,

    lyrics: song.lyrics,

    notes: song.notes,

    status: song.status,

    createdAt: song.created_at,

    updatedAt: song.updated_at,

    files: files.filter((file) => file.songId === song.id),
  }));

  const documents = files.filter(
    (file) => file.kind === "document" && file.songId === null,
  );

  return json({
    songs,
    documents,
  });
}

export async function createSong(request: Request, env: Env) {
  const body = await readJson<{
    title?: string;
    composer?: string | null;
    program?: string | null;
    lyrics?: string | null;
    notes?: string | null;
    status?: "draft" | "published";
    createdByUserId?: string;
  }>(request);

  const title = cleanText(body.title);

  if (!title || !body.createdByUserId) {
    return json(
      {
        error: "Missing song data",
      },
      400,
    );
  }

  const status = body.status === "draft" ? "draft" : "published";

  const id = crypto.randomUUID();

  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO songs (
      id,
      title,
      composer,
      program,
      lyrics,
      notes,
      status,
      created_by_user_id,
      created_at,
      updated_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    `,
  )
    .bind(
      id,
      title,
      optionalText(body.composer),
      optionalText(body.program),
      optionalText(body.lyrics),
      optionalText(body.notes),
      status,
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

export async function updateSong(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
    title?: string;
    composer?: string | null;
    program?: string | null;
    lyrics?: string | null;
    notes?: string | null;
    status?: "draft" | "published";
  }>(request);

  const title = cleanText(body.title);

  if (!body.id || !title) {
    return json(
      {
        error: "Missing song data",
      },
      400,
    );
  }

  const status = body.status === "draft" ? "draft" : "published";

  const result = await env.DB.prepare(
    `
      UPDATE songs
      SET
        title = ?,
        composer = ?,
        program = ?,
        lyrics = ?,
        notes = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
      `,
  )
    .bind(
      title,
      optionalText(body.composer),
      optionalText(body.program),
      optionalText(body.lyrics),
      optionalText(body.notes),
      status,
      new Date().toISOString(),
      body.id,
    )
    .run();

  if (result.meta.changes === 0) {
    return json(
      {
        error: "Song not found",
      },
      404,
    );
  }

  return json({
    ok: true,
  });
}

export async function deleteSong(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
  }>(request);

  if (!body.id) {
    return json(
      {
        error: "Song ID is required",
      },
      400,
    );
  }

  const files = await env.DB.prepare(
    `
      SELECT storage_key
      FROM resource_files
      WHERE song_id = ?
      `,
  )
    .bind(body.id)
    .all<{
      storage_key: string;
    }>();

  const result = await env.DB.prepare(
    `
      DELETE FROM songs
      WHERE id = ?
      `,
  )
    .bind(body.id)
    .run();

  if (result.meta.changes === 0) {
    return json(
      {
        error: "Song not found",
      },
      404,
    );
  }

  for (const file of files.results) {
    try {
      await env.PRIVATE_STORAGE.delete(file.storage_key);
    } catch (error) {
      console.error("R2 cleanup:", error);
    }
  }

  return json({
    ok: true,
  });
}

export async function uploadResourceFile(
  request: Request,
  env: Env,
  trustedUserId?: string,
) {
  const formData = await request.formData();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return json(
      {
        error: "File is required",
      },
      400,
    );
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return json(
      {
        error: "File too large",
      },
      400,
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return json(
      {
        error: "Unsupported file type",
      },
      400,
    );
  }

  const kindValue = cleanText(formData.get("kind"));

  if (!["score", "audio", "document"].includes(kindValue)) {
    return json(
      {
        error: "Invalid resource type",
      },
      400,
    );
  }

  const kind = kindValue as "score" | "audio" | "document";

  const createdByUserId =
    trustedUserId || cleanText(formData.get("createdByUserId"));

  if (!createdByUserId) {
    return json(
      {
        error: "Creator is required",
      },
      400,
    );
  }

  const title = cleanText(formData.get("title")) || file.name;

  const songId = optionalText(formData.get("songId"));

  if ((kind === "score" || kind === "audio") && !songId) {
    return json(
      {
        error: "Song is required",
      },
      400,
    );
  }

  if (kind === "document" && songId) {
    return json(
      {
        error: "Documents cannot belong to a song",
      },
      400,
    );
  }

  if (songId) {
    const song = await env.DB.prepare(
      `
        SELECT id
        FROM songs
        WHERE id = ?
        LIMIT 1
        `,
    )
      .bind(songId)
      .first();

    if (!song) {
      return json(
        {
          error: "Song not found",
        },
        404,
      );
    }
  }

  const id = crypto.randomUUID();

  const storageKey =
    kind === "document"
      ? `resources/documents/${id}/${safeFilename(file.name)}`
      : `resources/music/${songId}/${kind}/${id}/${safeFilename(file.name)}`;

  await env.PRIVATE_STORAGE.put(storageKey, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },

    customMetadata: {
      originalFilename: file.name,
    },
  });

  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `
      INSERT INTO resource_files (
        id,
        song_id,
        kind,
        title,
        category,
        description,
        storage_key,
        original_filename,
        mime_type,
        size_bytes,
        downloadable,
        published,
        sort_order,
        created_by_user_id,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      `,
    )
      .bind(
        id,
        songId,
        kind,
        title,

        optionalText(formData.get("category")),

        optionalText(formData.get("description")),

        storageKey,
        file.name,
        file.type,
        file.size,

        boolFromForm(formData.get("downloadable")) ? 1 : 0,

        boolFromForm(formData.get("published")) ? 1 : 0,

        Number(formData.get("sortOrder") ?? 0) || 0,

        createdByUserId,
        now,
        now,
      )
      .run();
  } catch (error) {
    await env.PRIVATE_STORAGE.delete(storageKey);

    throw error;
  }

  return json(
    {
      ok: true,
      id,
    },
    201,
  );
}

export async function updateResourceFile(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
    title?: string;
    category?: string | null;
    description?: string | null;
    downloadable?: boolean;
    published?: boolean;
    sortOrder?: number;
  }>(request);

  const title = cleanText(body.title);

  if (!body.id || !title) {
    return json(
      {
        error: "Invalid resource data",
      },
      400,
    );
  }

  const result = await env.DB.prepare(
    `
      UPDATE resource_files
      SET
        title = ?,
        category = ?,
        description = ?,
        downloadable = ?,
        published = ?,
        sort_order = ?,
        updated_at = ?
      WHERE id = ?
      `,
  )
    .bind(
      title,

      optionalText(body.category),

      optionalText(body.description),

      body.downloadable === false ? 0 : 1,

      body.published === false ? 0 : 1,

      Number.isFinite(body.sortOrder) ? body.sortOrder : 0,

      new Date().toISOString(),

      body.id,
    )
    .run();

  if (result.meta.changes === 0) {
    return json(
      {
        error: "Resource not found",
      },
      404,
    );
  }

  return json({
    ok: true,
  });
}

export async function deleteResourceFile(request: Request, env: Env) {
  const body = await readJson<{
    id?: string;
  }>(request);

  if (!body.id) {
    return json(
      {
        error: "Resource ID is required",
      },
      400,
    );
  }

  const resource = await env.DB.prepare(
    `
      SELECT storage_key
      FROM resource_files
      WHERE id = ?
      LIMIT 1
      `,
  )
    .bind(body.id)
    .first<{
      storage_key: string;
    }>();

  if (!resource) {
    return json(
      {
        error: "Resource not found",
      },
      404,
    );
  }

  await env.DB.prepare(
    `
    DELETE FROM resource_files
    WHERE id = ?
    `,
  )
    .bind(body.id)
    .run();

  try {
    await env.PRIVATE_STORAGE.delete(resource.storage_key);
  } catch (error) {
    console.error("R2 cleanup:", error);
  }

  return json({
    ok: true,
  });
}

function parseRange(value: string, totalSize: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);

  if (!match) {
    return null;
  }

  const startText = match[1];

  const endText = match[2];

  let start: number;
  let end: number;

  if (!startText) {
    const suffixLength = Number(endText);

    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }

    start = Math.max(totalSize - suffixLength, 0);

    end = totalSize - 1;
  } else {
    start = Number(startText);

    end = endText ? Number(endText) : totalSize - 1;
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= totalSize
  ) {
    return null;
  }

  end = Math.min(end, totalSize - 1);

  return {
    start,
    end,

    length: end - start + 1,
  };
}

export async function serveResourceFile(
  request: Request,
  env: Env,
  resourceId: string,
  allowUnpublished = true,
) {
  const resource = await env.DB.prepare(
    `
      SELECT
        resource_files.storage_key,
        resource_files.original_filename,
        resource_files.mime_type,
        resource_files.size_bytes,
        resource_files.downloadable,
        resource_files.published,
        resource_files.song_id,
        songs.status AS song_status
      FROM resource_files
      LEFT JOIN songs
        ON songs.id = resource_files.song_id
      WHERE resource_files.id = ?
      LIMIT 1
      `,
  )
    .bind(resourceId)
    .first<{
      storage_key: string;
      original_filename: string;
      mime_type: string;
      size_bytes: number;
      downloadable: number;
      published: number;
      song_id: string | null;
      song_status: string | null;
    }>();

  if (!resource) {
    return json(
      {
        error: "Resource not found",
      },
      404,
    );
  }

  if (
    !allowUnpublished &&
    (resource.published !== 1 ||
      (resource.song_id && resource.song_status !== "published"))
  ) {
    return json(
      {
        error: "Resource not found",
      },
      404,
    );
  }

  const url = new URL(request.url);

  const wantsDownload = url.searchParams.get("download") === "1";

  if (wantsDownload && !Boolean(resource.downloadable)) {
    return json(
      {
        error: "Download disabled",
      },
      403,
    );
  }

  const headers = new Headers();

  headers.set("Content-Type", resource.mime_type);

  headers.set("Accept-Ranges", "bytes");

  headers.set("Cache-Control", "private, no-store");

  if (wantsDownload) {
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(
        resource.original_filename,
      )}`,
    );
  } else {
    headers.set(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(
        resource.original_filename,
      )}`,
    );
  }

  const rangeHeader = request.headers.get("Range");

  if (rangeHeader) {
    const range = parseRange(rangeHeader, resource.size_bytes);

    if (!range) {
      headers.set("Content-Range", `bytes */${resource.size_bytes}`);

      return new Response(null, {
        status: 416,
        headers,
      });
    }

    const object = await env.PRIVATE_STORAGE.get(resource.storage_key, {
      range: {
        offset: range.start,

        length: range.length,
      },
    });

    if (!object) {
      return json(
        {
          error: "Stored file not found",
        },
        404,
      );
    }

    headers.set("Content-Length", String(range.length));

    headers.set(
      "Content-Range",
      `bytes ${range.start}-${range.end}/${resource.size_bytes}`,
    );

    return new Response(object.body, {
      status: 206,
      headers,
    });
  }

  const object = await env.PRIVATE_STORAGE.get(resource.storage_key);

  if (!object) {
    return json(
      {
        error: "Stored file not found",
      },
      404,
    );
  }

  headers.set("Content-Length", String(resource.size_bytes));

  return new Response(object.body, {
    status: 200,
    headers,
  });
}
