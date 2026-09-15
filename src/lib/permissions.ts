export type RolePermissionKey =
  | "members"
  | "calendar"
  | "resources"
  | "content"
  | "images"
  | "gallery"
  | "settings";

export type RolePermissions = Record<RolePermissionKey, boolean>;

export type AdminPermissionKey =
  | RolePermissionKey
  | "events"
  | "admins"
  | "messages";

export type AdminPermissions =
  RolePermissions & {
    events: boolean;
    admins: boolean;
    messages: boolean;
  };

export const EMPTY_ROLE_PERMISSIONS: RolePermissions = {
  members: false,
  calendar: false,
  resources: false,
  content: false,
  images: false,
  gallery: false,
  settings: false,
};

export const SUPER_ADMIN_ROLE_PERMISSIONS: RolePermissions = {
  members: true,
  calendar: true,
  resources: true,
  content: true,
  images: true,
  gallery: true,
  settings: true,
};

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  ...EMPTY_ROLE_PERMISSIONS,
  events: false,
  admins: false,
  messages: false,
};

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  ...SUPER_ADMIN_ROLE_PERMISSIONS,
  events: true,
  admins: true,
  messages: true,
};

export const PERMISSION_LABELS: Record<
  AdminPermissionKey,
  string
> = {
  members: "Gestion des membres",
  calendar: "Gestion du calendrier",
  resources: "Gestion du répertoire",
  content: "Contenu du site",
  images: "Images",
  gallery: "Galerie",
  settings: "Paramètres",
  events: "Gestion du calendrier",
  admins: "Gestion des membres",
  messages: "Gestion des membres",
};

export function normalizeRolePermissions(
  value: unknown,
): RolePermissions {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_ROLE_PERMISSIONS };
  }

  const raw = value as Partial<
    Record<RolePermissionKey, unknown>
  >;

  return {
    members: raw.members === true,
    calendar: raw.calendar === true,
    resources: raw.resources === true,
    content: raw.content === true,
    images: raw.images === true,
    gallery: raw.gallery === true,
    settings: raw.settings === true,
  };
}

function adminPermissionToRolePermission(
  permission: AdminPermissionKey,
): RolePermissionKey {
  if (permission === "events") {
    return "calendar";
  }

  if (
    permission === "admins" ||
    permission === "messages"
  ) {
    return "members";
  }

  return permission;
}

export function hasRolePermission(
  subject: {
    role?: string | null;
    permissions?: Partial<RolePermissions> | null;
  },
  permission: RolePermissionKey,
) {
  if (subject.role === "super_admin") {
    return true;
  }

  return subject.permissions?.[permission] === true;
}

export function hasAdminPermission(
  subject: {
    role?: string | null;
    permissions?: Partial<RolePermissions> | null;
  },
  permission: AdminPermissionKey,
) {
  return hasRolePermission(
    subject,
    adminPermissionToRolePermission(permission),
  );
}

export function hasAnyManagementPermission(
  subject: {
    role?: string | null;
    permissions?: Partial<RolePermissions> | null;
  },
) {
  if (subject.role === "super_admin") {
    return true;
  }

  return (
    subject.permissions?.members === true ||
    subject.permissions?.calendar === true ||
    subject.permissions?.resources === true ||
    subject.permissions?.content === true ||
    subject.permissions?.images === true ||
    subject.permissions?.gallery === true ||
    subject.permissions?.settings === true
  );
}

export function normalizePermissions(
  value: unknown,
): AdminPermissions {
  const rolePermissions =
    normalizeRolePermissions(value);

  return {
    ...rolePermissions,
    events: rolePermissions.calendar,
    admins: rolePermissions.members,
    messages: rolePermissions.members,
  };
}
