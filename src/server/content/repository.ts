import "server-only";

import {
  dbRequest,
} from "@/server/db/client";

export type SiteContentItem = {
  key: string;
  value: string;
};

export async function listSiteContent() {
  const result =
    await dbRequest<{
      items: SiteContentItem[];
    }>("/v1/site-content");

  return result.items;
}

export async function updateSiteContent(
  items: SiteContentItem[],
) {
  return dbRequest<{
    ok: true;
  }>("/v1/site-content", {
    method: "PUT",
    body: JSON.stringify({
      items,
    }),
  });
}
