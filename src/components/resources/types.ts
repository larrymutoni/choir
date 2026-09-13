export type ResourceKind = "score" | "audio" | "document";

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
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  files: ResourceFile[];
};

export type ResourcesResponse = {
  songs: Song[];
  documents: ResourceFile[];
  canManage: boolean;
};

export function resourceUrl(file: ResourceFile) {
  return `/api/member/resources/files/${encodeURIComponent(file.id)}`;
}

export function downloadUrl(file: ResourceFile) {
  return `${resourceUrl(file)}?download=1`;
}

export function audioVoice(file: ResourceFile) {
  return file.category?.trim() || file.title?.trim() || "Tutti";
}

export function scoreVoice(file: ResourceFile) {
  return file.category?.trim() || "Générale";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} o`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
