import "server-only";

import { dbRequest } from "@/server/db/client";

export type GalleryAlbum = {
  id: string;
  title: string;
  description: string | null;
  activity: string | null;
  album_date: string;
  cover_media_id: string | null;
  media_count: number;
  photo_count: number;
  video_count: number;
  created_at: string;
  updated_at: string;
};

export type GalleryMedia = {
  id: string;
  album_id: string | null;
  media_type: "photo" | "video";
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  captured_at: string;
  taken_at: string | null;
  year_override: number | null;
  width: number | null;
  height: number | null;
  has_thumbnail: number;
  has_preview: number;
  album_title: string | null;
  activity: string | null;
  album_date: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryResponse = {
  albums: GalleryAlbum[];
  media: GalleryMedia[];
};

export async function listGallery() {
  return dbRequest<GalleryResponse>("/v1/gallery", { method: "GET" });
}

export async function createGalleryAlbum(input: {
  title: string;
  description?: string | null;
  activity?: string | null;
  albumDate: string;
  createdByUserId: string;
}) {
  return dbRequest<{ ok: true; id: string }>("/v1/gallery/albums", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateGalleryAlbum(input: {
  id: string;
  title: string;
  description?: string | null;
  activity?: string | null;
  albumDate: string;
  coverMediaId?: string | null;
}) {
  return dbRequest<{ ok: true }>("/v1/gallery/albums", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteGalleryAlbum(id: string) {
  return dbRequest<{ ok: true }>("/v1/gallery/albums", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function deleteGalleryMedia(id: string) {
  return dbRequest<{ ok: true }>("/v1/gallery/media", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}
