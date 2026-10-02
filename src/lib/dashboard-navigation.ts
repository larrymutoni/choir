import type {
  RolePermissionKey,
  RolePermissions,
} from "@/lib/permissions";

export type DashboardRole =
  | "member"
  | "admin"
  | "super_admin";

export type DashboardIconKey =
  | "dashboard"
  | "calendar"
  | "resources"
  | "members"
  | "content"
  | "images"
  | "siteGallery"
  | "settings";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  iconKey: DashboardIconKey;
  group: "main" | "management";
  permission?: RolePermissionKey;
  disabled?: boolean;
};

export const dashboardNavigationItems:
  DashboardNavigationItem[] = [
    {
      label: "Tableau de bord",
      href: "/membre",
      iconKey: "dashboard",
      group: "main",
    },
    {
      label: "Calendrier",
      href: "/membre/calendrier",
      iconKey: "calendar",
      group: "main",
    },
    {
      label: "Répertoire",
      href: "/membre/ressources",
      iconKey: "resources",
      group: "main",
    },
    {
      label: "Galerie",
      href: "/membre/galerie",
      iconKey: "siteGallery",
      group: "main",
    },
    {
      label: "Membres",
      href: "/admin/utilisateurs",
      iconKey: "members",
      group: "management",
      permission: "members",
    },
    {
      label: "Pages",
      href: "/admin/contenu",
      iconKey: "content",
      group: "management",
      permission: "content",
    },
    {
      label: "Images",
      href: "/admin/images",
      iconKey: "images",
      group: "management",
      permission: "images",
      disabled: true,
    },
    {
      label: "Paramètres du site",
      href: "/admin/settings",
      iconKey: "settings",
      group: "management",
      permission: "settings",
      disabled: true,
    },
  ];

export function getDashboardNavigation(
  role: DashboardRole,
  permissions?: RolePermissions,
) {
  return dashboardNavigationItems.filter(
    (item) => {
      // A disabled item must not be shown to anyone, including super_admin.
      if (item.disabled === true) {
        return false;
      }

      if (!item.permission) {
        return true;
      }

      if (role === "super_admin") {
        return true;
      }

      return permissions?.[item.permission] === true;
    },
  );
}

export function getRoleLabel(
  role: DashboardRole,
  customRoleName?: string | null,
) {
  if (customRoleName) {
    return customRoleName;
  }

  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}
