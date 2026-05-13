import { canAccess, type AdminPermissionKey, type CurrentAdmin } from "@/lib/auth";

export type AdminIconKey =
  | "dashboard"
  | "content"
  | "image"
  | "calendar"
  | "settings"
  | "admins";

export type AdminNavigationItem = {
  label: string;
  href: string;
  iconKey: AdminIconKey;
  permission: AdminPermissionKey | null;
};

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    iconKey: "dashboard",
    permission: null,
  },
  {
    label: "Contenu",
    href: "/admin/contenu",
    iconKey: "content",
    permission: "content",
  },
  {
    label: "Images site",
    href: "/admin/images",
    iconKey: "image",
    permission: "images",
  },
  {
    label: "Galerie",
    href: "/admin/galerie",
    iconKey: "image",
    permission: "gallery",
  },
  {
    label: "Événements",
    href: "/admin/evenements",
    iconKey: "calendar",
    permission: "events",
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    iconKey: "settings",
    permission: "settings",
  },
  {
    label: "Admins",
    href: "/admin/admins",
    iconKey: "admins",
    permission: "admins",
  },
];

export function getAllowedAdminLinks(admin: CurrentAdmin) {
  return adminNavigationItems.filter((item) => {
    if (!item.permission) return true;
    return canAccess(admin, item.permission);
  });
}