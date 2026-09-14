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
  roles: DashboardRole[];
  group: "main" | "management";
};

const ALL_ROLES: DashboardRole[] = [
  "member",
  "admin",
  "super_admin",
];

const ADMIN_ROLES: DashboardRole[] = [
  "admin",
  "super_admin",
];

export const dashboardNavigationItems:
  DashboardNavigationItem[] = [
    {
      label: "Tableau de bord",
      href: "/membre",
      iconKey: "dashboard",
      roles: ALL_ROLES,
      group: "main",
    },
    {
      label: "Calendrier",
      href: "/membre/calendrier",
      iconKey: "calendar",
      roles: ALL_ROLES,
      group: "main",
    },
    {
      label: "Répertoire",
      href: "/membre/ressources",
      iconKey: "resources",
      roles: ALL_ROLES,
      group: "main",
    },

    {
      label: "Membres",
      href: "/admin/utilisateurs",
      iconKey: "members",
      roles: ADMIN_ROLES,
      group: "management",
    },
    {
      label: "Contenu du site",
      href: "/admin/contenu",
      iconKey: "content",
      roles: ADMIN_ROLES,
      group: "management",
    },
    {
      label: "Images",
      href: "/admin/images",
      iconKey: "images",
      roles: ADMIN_ROLES,
      group: "management",
    },
    {
      label: "Galerie",
      href: "/admin/galerie",
      iconKey: "siteGallery",
      roles: ADMIN_ROLES,
      group: "management",
    },
    {
      label: "Paramètres",
      href: "/admin/settings",
      iconKey: "settings",
      roles: ADMIN_ROLES,
      group: "management",
    },
  ];

export function getDashboardNavigation(
  role: DashboardRole,
) {
  return dashboardNavigationItems.filter(
    (item) => item.roles.includes(role),
  );
}

export function getRoleLabel(
  role: DashboardRole,
) {
  if (role === "super_admin") {
    return "Super administrateur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  return "Membre";
}
