export type AdminPermissionKey =
  | "content"
  | "images"
  | "gallery"
  | "events"
  | "settings"
  | "admins"
  | "messages";

export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  content: false,
  images: false,
  gallery: false,
  events: false,
  settings: false,
  admins: false,
  messages: false,
};

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  content: true,
  images: true,
  gallery: true,
  events: true,
  settings: true,
  admins: true,
  messages: true,
};

export const PERMISSION_LABELS: Record<AdminPermissionKey, string> = {
  content: "Textes",
  images: "Images site",
  gallery: "Galerie",
  events: "Événements",
  settings: "Paramètres",
  admins: "Admins",
  messages: "Messages",
};

export function normalizePermissions(value: unknown): AdminPermissions {
  if (!value || typeof value !== "object") {
    return DEFAULT_ADMIN_PERMISSIONS;
  }

  const raw = value as Partial<Record<AdminPermissionKey, boolean>>;

  return {
    content: Boolean(raw.content),
    images: Boolean(raw.images),
    gallery: Boolean(raw.gallery),
    events: Boolean(raw.events),
    settings: Boolean(raw.settings),
    admins: Boolean(raw.admins),
    messages: Boolean(raw.messages),
  };
}
