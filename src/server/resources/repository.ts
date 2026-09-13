import {
  dbRequest,
} from "@/server/db/client";

export type ResourceKind =
  | "score"
  | "audio"
  | "document";

export type ResourceFile = {
  id: string;
  songId: string | null;
  kind: ResourceKind;
  title: string;
  category: string | null;
  description: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  downloadable: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Song = {
  id: string;
  title: string;
  composer: string | null;
  program: string | null;
  lyrics: string | null;
  notes: string | null;
  status:
    | "draft"
    | "published";
  createdAt: string;
  updatedAt: string;
  files: ResourceFile[];
};

export type ResourcesResponse = {
  songs: Song[];
  documents: ResourceFile[];
};

export async function listResources(
  includeUnpublished = false,
) {
  return dbRequest<ResourcesResponse>(
    `/v1/resources${
      includeUnpublished
        ? "?include_unpublished=1"
        : ""
    }`,
    {
      method: "GET",
    },
  );
}

export async function createSong(
  input: {
    title: string;
    composer?: string | null;
    program?: string | null;
    lyrics?: string | null;
    notes?: string | null;
    status:
      | "draft"
      | "published";
    createdByUserId: string;
  },
) {
  return dbRequest<{
    ok: true;
    id: string;
  }>(
    "/v1/resources/songs",
    {
      method: "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function updateSong(
  input: {
    id: string;
    title: string;
    composer?: string | null;
    program?: string | null;
    lyrics?: string | null;
    notes?: string | null;
    status:
      | "draft"
      | "published";
  },
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/resources/songs",
    {
      method: "PATCH",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteSong(
  id: string,
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/resources/songs",
    {
      method:
        "DELETE",
      body:
        JSON.stringify({
          id,
        }),
    },
  );
}

export async function updateResourceFile(
  input: {
    id: string;
    title: string;
    category?: string | null;
    description?: string | null;
    downloadable: boolean;
    published: boolean;
    sortOrder?: number;
  },
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/resource-files",
    {
      method: "PATCH",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export async function deleteResourceFile(
  id: string,
) {
  return dbRequest<{
    ok: true;
  }>(
    "/v1/resource-files",
    {
      method:
        "DELETE",
      body:
        JSON.stringify({
          id,
        }),
    },
  );
}