import {
  Env,
  json,
  readJson,
} from "./http";

type SiteContentRow = {
  key: string;
  value: string;
};

export async function listSiteContent(
  _request: Request,
  env: Env,
) {
  const result = await env.DB.prepare(
    `
    SELECT key, value
    FROM site_content
    ORDER BY key
    `,
  ).all<SiteContentRow>();

  return json({
    items: result.results ?? [],
  });
}

export async function updateSiteContent(
  request: Request,
  env: Env,
) {
  const body = await readJson<{
    items?: unknown;
  }>(request);

  if (!Array.isArray(body.items)) {
    return json(
      {
        error: "Invalid content data",
      },
      400,
    );
  }

  const items: SiteContentRow[] = [];

  for (const item of body.items) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      return json(
        {
          error: "Invalid content item",
        },
        400,
      );
    }

    const candidate =
      item as Partial<SiteContentRow>;

    if (
      typeof candidate.key !== "string" ||
      !candidate.key.trim() ||
      typeof candidate.value !== "string"
    ) {
      return json(
        {
          error: "Invalid content item",
        },
        400,
      );
    }

    items.push({
      key: candidate.key.trim(),
      value: candidate.value,
    });
  }

  if (items.length === 0) {
    return json({
      ok: true,
    });
  }

  const now =
    new Date().toISOString();

  await env.DB.batch(
    items.map((item) =>
      env.DB.prepare(
        `
        INSERT INTO site_content (
          key,
          value,
          updated_at
        )
        VALUES (?, ?, ?)
        ON CONFLICT(key)
        DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
        `,
      ).bind(
        item.key,
        item.value,
        now,
      ),
    ),
  );

  return json({
    ok: true,
  });
}
